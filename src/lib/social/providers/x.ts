import { runApifyActor } from "../apify";
import { normalizeXPost } from "../normalize";
import type { SocialPost } from "@/lib/types";

const ACTOR = "api402/twitter-x-profile-scraper";

export async function fetchXPosts(
  handle: string,
  token: string,
  maxPosts: number
): Promise<{ posts: SocialPost[]; followers?: number }> {
  const records = await runApifyActor<Record<string, unknown>>(
    ACTOR,
    { twitterHandles: [handle], maxTweets: maxPosts },
    token
  );

  const profile = records.find((r) => r.type === "profile");
  const followers = profile
    ? Number(profile.followers ?? 0) || undefined
    : undefined;

  const posts = records
    .map((record) => normalizeXPost(record))
    .filter((post): post is SocialPost => post !== null)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, maxPosts);

  return { posts, followers };
}
