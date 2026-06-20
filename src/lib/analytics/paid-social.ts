import {
  ANALYTICS_CHANNEL_PLATFORMS,
  getChannelConfigByPlatform,
} from "./channels";
import {
  clickThroughRate,
  engagementRate,
  estimatedClicks,
} from "@/lib/metrics";
import type { Platform, PostType, SocialPost } from "@/lib/types";

export interface PaidChannelMetrics {
  platform: Platform;
  label: string;
  handle: string;
  color: string;
  organicPosts: number;
  paidPosts: number;
  boostedPosts: number;
  totalSpend: number;
  paidReach: number;
  paidImpressions: number;
  avgPaidEngagementRate: number;
  avgOrganicEngagementRate: number;
  costPerEngagement: number | null;
  costPerClick: number | null;
}

export interface PaidSocialOverview {
  channels: PaidChannelMetrics[];
  totals: {
    organicPosts: number;
    paidPosts: number;
    boostedPosts: number;
    totalSpend: number;
    avgPaidEngagementRate: number;
    avgOrganicEngagementRate: number;
    costPerEngagement: number | null;
    costPerClick: number | null;
  };
}

function isPaidType(type: PostType): boolean {
  return type === "paid" || type === "boosted";
}

function averageRate(posts: SocialPost[]): number {
  if (posts.length === 0) return 0;
  const total = posts.reduce((sum, post) => sum + engagementRate(post.metrics), 0);
  return Math.round((total / posts.length) * 10) / 10;
}

function aggregateCostPerEngagement(posts: SocialPost[]): number | null {
  const paid = posts.filter((post) => isPaidType(post.type) && post.metrics.spend);
  if (paid.length === 0) return null;

  const totalSpend = paid.reduce((sum, post) => sum + (post.metrics.spend ?? 0), 0);
  const totalEngagements = paid.reduce(
    (sum, post) =>
      sum +
      post.metrics.likes +
      post.metrics.comments +
      post.metrics.shares +
      post.metrics.saves,
    0
  );

  if (totalEngagements === 0) return null;
  return Math.round((totalSpend / totalEngagements) * 100) / 100;
}

function aggregateCostPerClick(posts: SocialPost[]): number | null {
  const paid = posts.filter((post) => isPaidType(post.type) && post.metrics.spend);
  if (paid.length === 0) return null;

  const totalSpend = paid.reduce((sum, post) => sum + (post.metrics.spend ?? 0), 0);
  const totalClicks = paid.reduce(
    (sum, post) => sum + estimatedClicks(post.metrics),
    0
  );

  if (totalClicks === 0) return null;
  return Math.round((totalSpend / totalClicks) * 100) / 100;
}

export function buildPaidChannelMetrics(
  platform: Platform,
  posts: SocialPost[]
): PaidChannelMetrics {
  const config = getChannelConfigByPlatform(platform);
  const platformPosts = posts.filter((post) => post.platform === platform);
  const organic = platformPosts.filter((post) => post.type === "organic");
  const paid = platformPosts.filter((post) => post.type === "paid");
  const boosted = platformPosts.filter((post) => post.type === "boosted");
  const paidLike = platformPosts.filter((post) => isPaidType(post.type));
  const totalSpend = paidLike.reduce(
    (sum, post) => sum + (post.metrics.spend ?? 0),
    0
  );

  return {
    platform,
    label: config?.label ?? platform,
    handle: config?.handle ?? "",
    color: config?.color ?? "#0093D0",
    organicPosts: organic.length,
    paidPosts: paid.length,
    boostedPosts: boosted.length,
    totalSpend,
    paidReach: paidLike.reduce((sum, post) => sum + post.metrics.reach, 0),
    paidImpressions: paidLike.reduce(
      (sum, post) => sum + post.metrics.impressions,
      0
    ),
    avgPaidEngagementRate: averageRate(paidLike),
    avgOrganicEngagementRate: averageRate(organic),
    costPerEngagement: aggregateCostPerEngagement(paidLike),
    costPerClick: aggregateCostPerClick(paidLike),
  };
}

export function buildPaidSocialOverview(posts: SocialPost[]): PaidSocialOverview {
  const channels = ANALYTICS_CHANNEL_PLATFORMS.map((platform) =>
    buildPaidChannelMetrics(platform, posts)
  ).filter(
    (channel) =>
      channel.paidPosts + channel.boostedPosts > 0 || channel.totalSpend > 0
  );

  const organicPosts = posts.filter((post) => post.type === "organic");
  const paidPosts = posts.filter((post) => post.type === "paid");
  const boostedPosts = posts.filter((post) => post.type === "boosted");
  const paidLike = posts.filter((post) => isPaidType(post.type));
  const totalSpend = paidLike.reduce(
    (sum, post) => sum + (post.metrics.spend ?? 0),
    0
  );

  return {
    channels:
      channels.length > 0
        ? channels
        : ANALYTICS_CHANNEL_PLATFORMS.map((platform) =>
            buildPaidChannelMetrics(platform, posts)
          ),
    totals: {
      organicPosts: organicPosts.length,
      paidPosts: paidPosts.length,
      boostedPosts: boostedPosts.length,
      totalSpend,
      avgPaidEngagementRate: averageRate(paidLike),
      avgOrganicEngagementRate: averageRate(organicPosts),
      costPerEngagement: aggregateCostPerEngagement(paidLike),
      costPerClick: aggregateCostPerClick(paidLike),
    },
  };
}

export function paidEngagementDelta(channel: PaidChannelMetrics): number | null {
  if (channel.avgOrganicEngagementRate <= 0 || channel.avgPaidEngagementRate <= 0) {
    return null;
  }
  return (
    Math.round(
      (channel.avgPaidEngagementRate - channel.avgOrganicEngagementRate) * 10
    ) / 10
  );
}

export function paidClickThroughRate(posts: SocialPost[]): number {
  const paid = posts.filter((post) => isPaidType(post.type));
  if (paid.length === 0) return 0;
  const total = paid.reduce((sum, post) => sum + clickThroughRate(post.metrics), 0);
  return Math.round((total / paid.length) * 10) / 10;
}
