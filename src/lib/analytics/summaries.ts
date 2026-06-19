import { clickThroughRate, engagementRate } from "@/lib/metrics";
import {
  ANALYTICS_CHANNEL_PLATFORMS,
  ANALYTICS_CHANNELS,
  getChannelConfigByPlatform,
} from "./channels";
import type { ChannelSummary, Platform, SocialPost } from "@/lib/types";

export function filterPostsByPlatform(
  posts: SocialPost[],
  platform: Platform
): SocialPost[] {
  return posts.filter((p) => p.platform === platform);
}

export function buildChannelSummary(
  platform: Platform,
  posts: SocialPost[],
  dataSource: "live" | "seed",
  followersOverride?: number
): ChannelSummary {
  const config = getChannelConfigByPlatform(platform);
  const platformPosts = filterPostsByPlatform(posts, platform);
  const paid = platformPosts.filter(
    (p) => p.type === "paid" || p.type === "boosted"
  );
  const avgEngagementRate =
    platformPosts.reduce((sum, p) => sum + engagementRate(p.metrics), 0) /
    (platformPosts.length || 1);
  const avgCTR =
    platformPosts.reduce((sum, p) => sum + clickThroughRate(p.metrics), 0) /
    (platformPosts.length || 1);

  const growthRates: Record<Platform, number> = {
    linkedin: 4200,
    instagram: 1800,
    facebook: 950,
    x: 620,
    youtube: 1100,
    tiktok: 2500,
  };

  return {
    platform,
    label: config?.label ?? platform,
    handle: config?.handle ?? "",
    followers: followersOverride ?? config?.followers ?? 0,
    followerGrowth: growthRates[platform] ?? 0,
    postCount: platformPosts.length,
    avgEngagementRate: Math.round(avgEngagementRate * 10) / 10,
    avgCTR: Math.round(avgCTR * 10) / 10,
    totalReach: platformPosts.reduce((s, p) => s + p.metrics.reach, 0),
    totalImpressions: platformPosts.reduce(
      (s, p) => s + p.metrics.impressions,
      0
    ),
    totalSpend: paid.reduce((s, p) => s + (p.metrics.spend ?? 0), 0),
    dataSource,
  };
}

export function buildAllChannelSummaries(
  posts: SocialPost[],
  channelSources: Partial<Record<Platform, "live" | "seed">>,
  channelFollowers?: Partial<Record<Platform, number>>
): ChannelSummary[] {
  return ANALYTICS_CHANNEL_PLATFORMS.map((platform) =>
    buildChannelSummary(
      platform,
      posts,
      channelSources[platform] ?? "seed",
      channelFollowers?.[platform]
    )
  );
}

export function buildCrossChannelTotals(summaries: ChannelSummary[]) {
  const allChannel = ANALYTICS_CHANNELS[0];
  return {
    label: allChannel.label,
    handle: allChannel.handle,
    followers: summaries.reduce((s, c) => s + c.followers, 0),
    followerGrowth: summaries.reduce((s, c) => s + c.followerGrowth, 0),
    postCount: summaries.reduce((s, c) => s + c.postCount, 0),
    avgEngagementRate:
      Math.round(
        (summaries.reduce((s, c) => s + c.avgEngagementRate, 0) /
          (summaries.length || 1)) *
          10
      ) / 10,
    avgCTR:
      Math.round(
        (summaries.reduce((s, c) => s + c.avgCTR, 0) /
          (summaries.length || 1)) *
          10
      ) / 10,
    totalReach: summaries.reduce((s, c) => s + c.totalReach, 0),
    totalImpressions: summaries.reduce((s, c) => s + c.totalImpressions, 0),
    totalSpend: summaries.reduce((s, c) => s + c.totalSpend, 0),
    channelCount: summaries.length,
  };
}

export interface CrossChannelActivityTotals {
  postCount: number;
  avgEngagementRate: number;
  avgCTR: number;
  totalReach: number;
  totalImpressions: number;
}

export function buildCrossChannelActivityFromPosts(
  posts: SocialPost[]
): CrossChannelActivityTotals {
  if (posts.length === 0) {
    return {
      postCount: 0,
      avgEngagementRate: 0,
      avgCTR: 0,
      totalReach: 0,
      totalImpressions: 0,
    };
  }

  const avgEngagementRate =
    posts.reduce((sum, post) => sum + engagementRate(post.metrics), 0) /
    posts.length;
  const avgCTR =
    posts.reduce((sum, post) => sum + clickThroughRate(post.metrics), 0) /
    posts.length;

  return {
    postCount: posts.length,
    avgEngagementRate: Math.round(avgEngagementRate * 10) / 10,
    avgCTR: Math.round(avgCTR * 10) / 10,
    totalReach: posts.reduce((sum, post) => sum + post.metrics.reach, 0),
    totalImpressions: posts.reduce(
      (sum, post) => sum + post.metrics.impressions,
      0
    ),
  };
}

export interface MonthOverMonthChange {
  text: string;
  tone: "positive" | "negative" | "neutral";
}

export function buildMonthlyChannelSummaries(
  channels: ChannelSummary[],
  monthPosts: SocialPost[]
): ChannelSummary[] {
  return channels.map((channel) =>
    buildChannelSummary(
      channel.platform,
      monthPosts,
      channel.dataSource,
      channel.followers
    )
  );
}

export interface CrossChannelVolumeTotals {
  postCount: number;
  totalReach: number;
  totalImpressions: number;
}

export function buildCrossChannelVolumeFromPosts(
  posts: SocialPost[]
): CrossChannelVolumeTotals {
  return {
    postCount: posts.length,
    totalReach: posts.reduce((sum, post) => sum + post.metrics.reach, 0),
    totalImpressions: posts.reduce(
      (sum, post) => sum + post.metrics.impressions,
      0
    ),
  };
}

export function buildCrossChannelVolumeFromChannelSummaries(
  summaries: ChannelSummary[]
): CrossChannelVolumeTotals {
  return {
    postCount: summaries.reduce((sum, channel) => sum + channel.postCount, 0),
    totalReach: summaries.reduce((sum, channel) => sum + channel.totalReach, 0),
    totalImpressions: summaries.reduce(
      (sum, channel) => sum + channel.totalImpressions,
      0
    ),
  };
}

export function formatMonthOverMonthChange(
  delta: number,
  formatter: (value: number) => string,
  comparisonLabel = "vs prior month"
): MonthOverMonthChange {
  if (delta === 0) {
    return {
      text:
        comparisonLabel === "vs same period last month"
          ? "Same as same period last month"
          : "Same as prior month",
      tone: "neutral",
    };
  }

  const sign = delta > 0 ? "+" : "-";
  return {
    text: `${sign}${formatter(Math.abs(delta))} ${comparisonLabel}`,
    tone: delta > 0 ? "positive" : "negative",
  };
}
