import { runApifyActor } from "../apify";
import { normalizeTikTokPost } from "../normalize";
import type { SocialPost } from "@/lib/types";

const ACTOR = "clockworks/tiktok-profile-scraper";

export async function fetchTikTokPosts(
  handle: string,
  token: string,
  maxPosts: number
): Promise<{ posts: SocialPost[]; followers?: number }> {
  const username = handle.replace(/^@/, "");
  const records = await runApifyActor<Record<string, unknown>>(
    ACTOR,
    { profiles: [username], resultsPerPage: maxPosts },
    token,
    240_000
  );

  const followers = records.reduce<number | undefined>((found, record) => {
    if (found) return found;
    const authorMeta = record.authorMeta as { fans?: number } | undefined;
    const fans = Number(authorMeta?.fans ?? 0);
    return fans > 0 ? fans : undefined;
  }, undefined);

  const posts = records
    .map((record) => normalizeTikTokPost(record))
    .filter((post): post is SocialPost => post !== null)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, maxPosts);

  return { posts, followers };
}
