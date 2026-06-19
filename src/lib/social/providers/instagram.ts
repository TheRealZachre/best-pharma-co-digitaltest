import { fetchLatestApifyDatasetItems } from "../apify-datasets";
import { runApifyActor } from "../apify";
import { normalizeInstagramPost } from "../normalize";
import { fetchInstagramPostsCurl } from "./instagram-curl";
import { fetchInstagramPostsPublic } from "./instagram-public";
import type { SocialPost } from "@/lib/types";

const POST_ACTOR = "apify/instagram-post-scraper";
const PROFILE_ACTOR = "apify/instagram-profile-scraper";

function mapApifyRecords(
  postRecords: Record<string, unknown>[],
  profileRecords: Record<string, unknown>[],
  maxPosts: number
): { posts: SocialPost[]; followers?: number } {
  const followers = profileRecords[0]
    ? Number(profileRecords[0].followersCount ?? 0) || undefined
    : undefined;

  const posts = postRecords
    .map((record) => normalizeInstagramPost(record))
    .filter((post): post is SocialPost => post !== null)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, maxPosts);

  return { posts, followers };
}

export async function fetchInstagramPosts(
  handle: string,
  token: string,
  maxPosts: number
): Promise<{ posts: SocialPost[]; followers?: number }> {
  try {
    const [postRecords, profileRecords] = await Promise.all([
      runApifyActor<Record<string, unknown>>(
        POST_ACTOR,
        { username: [handle], resultsLimit: maxPosts },
        token
      ),
      runApifyActor<Record<string, unknown>>(
        PROFILE_ACTOR,
        { usernames: [handle] },
        token,
        120_000
      ).catch(() => [] as Record<string, unknown>[]),
    ]);

    return mapApifyRecords(postRecords, profileRecords, maxPosts);
  } catch (apifyError) {
    try {
      return await fetchInstagramPostsCurl(handle, maxPosts);
    } catch (curlError) {
      try {
        return await fetchInstagramPostsPublic(handle, maxPosts);
      } catch (publicError) {
      try {
        const cachedPosts = await fetchLatestApifyDatasetItems(
          POST_ACTOR,
          token,
          maxPosts
        );
        const cachedProfiles = await fetchLatestApifyDatasetItems(
          PROFILE_ACTOR,
          token,
          1
        );

        if (cachedPosts.length > 0) {
          return mapApifyRecords(cachedPosts, cachedProfiles, maxPosts);
        }
      } catch {
        // Fall through to combined error.
      }

      const apifyMessage =
        apifyError instanceof Error ? apifyError.message : "Apify failed";
      const curlMessage =
        curlError instanceof Error ? curlError.message : "Curl API failed";
      const publicMessage =
        publicError instanceof Error ? publicError.message : "Public API failed";
      throw new Error(`${apifyMessage} · ${curlMessage} · ${publicMessage}`);
      }
    }
  }
}
