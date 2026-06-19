import type { SocialPost } from "@/lib/types";
import type { Platform } from "@/lib/types";
import { ANALYTICS_CHANNEL_PLATFORMS } from "./channels";

export const ANALYTICS_CHANNELS_COOKIE = "analytics-channels";
export const ANALYTICS_CHANNELS_STORAGE_KEY = "analytics-channels";

export const CHANNEL_LABELS: Record<Platform, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
  youtube: "YouTube",
  tiktok: "TikTok",
};

function parseChannelArray(value: string): Platform[] | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return null;

    const valid = parsed.filter((platform): platform is Platform =>
      ANALYTICS_CHANNEL_PLATFORMS.includes(platform as Platform)
    );

    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

export function parseAnalyticsChannels(raw?: string | null): Platform[] {
  if (!raw) return [...ANALYTICS_CHANNEL_PLATFORMS];

  const direct = parseChannelArray(raw);
  if (direct) return direct;

  try {
    const decoded = decodeURIComponent(raw);
    const fromCookie = parseChannelArray(decoded);
    if (fromCookie) return fromCookie;
  } catch {
    // fall through to default
  }

  return [...ANALYTICS_CHANNEL_PLATFORMS];
}

export function filterPostsByChannels(
  posts: SocialPost[],
  channels: Platform[]
): SocialPost[] {
  if (channels.length >= ANALYTICS_CHANNEL_PLATFORMS.length) return posts;
  const selected = new Set(channels);
  return posts.filter((post) => selected.has(post.platform));
}

export function formatChannelList(channels: Platform[]): string {
  if (channels.length === ANALYTICS_CHANNEL_PLATFORMS.length) {
    return "all channels";
  }
  return channels.map((channel) => CHANNEL_LABELS[channel]).join(", ");
}
