import { fetchLatestApifyDatasetItems } from "../apify-datasets";
import { runApifyActor } from "../apify";
import { normalizeFacebookPost } from "../normalize";
import type { SocialPost } from "@/lib/types";

const POST_ACTOR = "apify/facebook-posts-scraper";
const PAGE_ACTOR = "apify/facebook-pages-scraper";

function mapApifyRecords(
  postRecords: Record<string, unknown>[],
  pageRecords: Record<string, unknown>[],
  maxPosts: number
): { posts: SocialPost[]; followers?: number } {
  const followers = pageRecords[0]
    ? Number(pageRecords[0].followers ?? pageRecords[0].likes ?? 0) || undefined
    : undefined;

  const posts = postRecords
    .map((record) => normalizeFacebookPost(record))
    .filter((post): post is SocialPost => post !== null)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, maxPosts);

  return { posts, followers };
}

export async function fetchFacebookPosts(
  pageUrl: string,
  token: string,
  maxPosts: number
): Promise<{ posts: SocialPost[]; followers?: number }> {
  try {
    const [postRecords, pageRecords] = await Promise.all([
      runApifyActor<Record<string, unknown>>(
        POST_ACTOR,
        { startUrls: [{ url: pageUrl }], resultsLimit: maxPosts },
        token
      ),
      runApifyActor<Record<string, unknown>>(
        PAGE_ACTOR,
        { startUrls: [{ url: pageUrl }] },
        token,
        120_000
      ).catch(() => [] as Record<string, unknown>[]),
    ]);

    return mapApifyRecords(postRecords, pageRecords, maxPosts);
  } catch (apifyError) {
    const cachedPosts = await fetchLatestApifyDatasetItems(
      POST_ACTOR,
      token,
      maxPosts
    ).catch(() => [] as Record<string, unknown>[]);

    const cachedPages = await fetchLatestApifyDatasetItems(
      PAGE_ACTOR,
      token,
      1
    ).catch(() => [] as Record<string, unknown>[]);

    if (cachedPosts.length > 0) {
      return mapApifyRecords(cachedPosts, cachedPages, maxPosts);
    }

    throw apifyError;
  }
}
