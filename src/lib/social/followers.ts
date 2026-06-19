import type { SocialChannel } from "./types";

export function resolveFollowerCount(
  next: number | undefined,
  previous: number | undefined
): number | undefined {
  if (next != null && next > 0) return Math.round(next);
  if (previous != null && previous > 0) return Math.round(previous);
  return undefined;
}

export function formatFollowerCount(count: number | undefined): string | null {
  if (count == null || count <= 0) return null;
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(count >= 10_000_000 ? 0 : 1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(count >= 100_000 ? 0 : 1)}K`;
  }
  return count.toLocaleString();
}

export type ChannelFollowersMap = Partial<Record<SocialChannel, number>>;

export function mergeFollowerMaps(
  existing: ChannelFollowersMap | undefined,
  incoming: ChannelFollowersMap
): ChannelFollowersMap {
  const merged: ChannelFollowersMap = { ...(existing ?? {}) };

  for (const [channel, count] of Object.entries(incoming) as [
    SocialChannel,
    number | undefined,
  ][]) {
    merged[channel] = resolveFollowerCount(count, merged[channel]);
  }

  return merged;
}
