import { parseChannelInput } from "@/lib/youtube/parse-channel-url";
import { runApifyActor } from "../apify";
import { normalizeYouTubePost } from "../normalize";
import type { SocialPost } from "@/lib/types";

const ACTOR = "streamers/youtube-channel-scraper";

function normalizeChannelUrl(input: string): string {
  const parsed = parseChannelInput(input);
  if (!parsed) return input.trim();
  if (parsed.raw.startsWith("http")) return parsed.raw;
  if (parsed.handle) return `https://www.youtube.com/@${parsed.handle}`;
  if (parsed.channelId) {
    return `https://www.youtube.com/channel/${parsed.channelId}`;
  }
  return input.trim();
}

export async function fetchYouTubePosts(
  channelInput: string,
  token: string,
  maxPosts: number
): Promise<{ posts: SocialPost[]; followers?: number }> {
  const channelUrl = normalizeChannelUrl(channelInput);

  const records = await runApifyActor<Record<string, unknown>>(
    ACTOR,
    { startUrls: [{ url: channelUrl }], maxResults: maxPosts },
    token,
    180_000
  );

  const about = records[0]?.aboutChannelInfo as
    | { numberOfSubscribers?: number }
    | undefined;
  const followers =
    Number(
      about?.numberOfSubscribers ??
        records[0]?.numberOfSubscribers ??
        0
    ) || undefined;

  const posts = records
    .map((record) => normalizeYouTubePost(record))
    .filter((post): post is SocialPost => post !== null)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, maxPosts);

  return { posts, followers };
}
