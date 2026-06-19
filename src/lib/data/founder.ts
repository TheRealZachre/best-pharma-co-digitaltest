/**
 * Data functions for the Founder/CEO section.
 * Reads from founder-social-posts.json (separate from company social-posts.json).
 * Only LinkedIn and X are supported for founder profiles.
 */

import { subDays, subMonths } from "date-fns";
import type {
  AudienceSnapshot,
  BrandProfile,
  ReportSummary,
  ReportTimeframe,
  SocialPost,
} from "@/lib/types";
import { clickThroughRate, engagementRate } from "@/lib/metrics";
import { AUDIENCE_GROWTH_HISTORY_MONTHS } from "@/lib/audience-growth";
import {
  buildAllChannelSummaries,
  filterPostsByPlatform,
} from "@/lib/analytics/summaries";
import { enrichPostsWithStoryBeat } from "@/lib/narrative/enrich";
import type { ChannelSummary, Platform } from "@/lib/types";
import type { SocialChannel, SocialPostCacheMeta } from "@/lib/social/types";
import {
  readFounderSocialCache,
} from "./founder-cache";
import { generateFounderSeedPosts } from "@/lib/social/founder-seed";
import { audienceGrowth as defaultAudienceGrowth } from "@/lib/mock-data";

import { CEO } from "@/lib/client";

export const FOUNDER_PLATFORMS: Platform[] = ["linkedin", "x"];
export const FOUNDER_SLUG = CEO.slug;

const now = new Date();

function channelSourcesFromMeta(
  meta?: SocialPostCacheMeta
): Partial<Record<Platform, "live" | "seed">> {
  if (!meta?.channels) return {};
  const sources: Partial<Record<Platform, "live" | "seed">> = {};
  for (const platform of FOUNDER_PLATFORMS) {
    const ch = meta.channels[platform as SocialChannel];
    if (ch?.dataSource === "live") sources[platform] = "live";
    else if (ch?.dataSource === "seed") sources[platform] = "seed";
  }
  return sources;
}

function followersFromMeta(
  meta?: SocialPostCacheMeta
): Partial<Record<Platform, number>> {
  if (!meta?.channels) return {};
  const followers: Partial<Record<Platform, number>> = {};
  for (const platform of FOUNDER_PLATFORMS) {
    const count = meta.channels[platform as SocialChannel]?.followers;
    if (count && count > 0) followers[platform] = count;
  }
  return followers;
}

export async function getFounderMultiChannelPosts(): Promise<{
  posts: SocialPost[];
  channelSources: Partial<Record<Platform, "live" | "seed">>;
  channelFollowers: Partial<Record<Platform, number>>;
  meta?: SocialPostCacheMeta & { postCount: number };
}> {
  const cache = await readFounderSocialCache();

  if (cache?.posts?.length) {
    const channelSources = channelSourcesFromMeta(cache.meta);
    const mergedSources: Partial<Record<Platform, "live" | "seed">> = {
      ...channelSources,
    };
    for (const platform of FOUNDER_PLATFORMS) {
      if (!mergedSources[platform]) mergedSources[platform] = "seed";
    }

    return {
      posts: enrichPostsWithStoryBeat(cache.posts),
      channelSources: mergedSources,
      channelFollowers: followersFromMeta(cache.meta),
      meta: { ...cache.meta, postCount: cache.posts.length },
    };
  }

  return getFounderSeedFallback();
}

function getFounderSeedFallback() {
  const posts = generateFounderSeedPosts();
  return {
    posts,
    channelSources: { linkedin: "seed" as const, x: "seed" as const },
    channelFollowers: { linkedin: 185000, x: 92000 },
    meta: {
      syncedAt: new Date().toISOString(),
      companySlug: FOUNDER_SLUG,
      postCount: posts.length,
      channels: {
        linkedin: {
          postCount: posts.filter((p) => p.platform === "linkedin").length,
          followers: 185000,
          provider: "seed",
          dataSource: "seed" as const,
          syncedAt: new Date().toISOString(),
        },
        x: {
          postCount: posts.filter((p) => p.platform === "x").length,
          followers: 92000,
          provider: "seed",
          dataSource: "seed" as const,
          syncedAt: new Date().toISOString(),
        },
      },
    },
  };
}

export async function getFounderAllPosts(): Promise<SocialPost[]> {
  const { posts } = await getFounderMultiChannelPosts();
  return posts;
}

export async function getFounderPostsByPlatform(
  platform: Platform
): Promise<SocialPost[]> {
  const { posts } = await getFounderMultiChannelPosts();
  return filterPostsByPlatform(posts, platform);
}

export async function getFounderChannelSummaries(): Promise<{
  channels: ChannelSummary[];
  channelSources: Partial<Record<Platform, "live" | "seed">>;
  selectedChannels: Platform[];
  meta?: Awaited<ReturnType<typeof getFounderMultiChannelPosts>>["meta"];
}> {
  const { posts, channelSources, channelFollowers, meta } =
    await getFounderMultiChannelPosts();

  return {
    channels: buildAllChannelSummaries(posts, channelSources, channelFollowers).filter(
      (c) => FOUNDER_PLATFORMS.includes(c.platform)
    ),
    channelSources,
    selectedChannels: FOUNDER_PLATFORMS,
    meta,
  };
}

export async function getFounderPostsForTimeframe(
  timeframe: ReportTimeframe
): Promise<SocialPost[]> {
  const posts = await getFounderAllPosts();
  const cutoffs = { weekly: 7, monthly: 30, quarterly: 90 };
  const cutoff = subDays(now, cutoffs[timeframe]);
  return posts.filter((p) => new Date(p.publishedAt) >= cutoff);
}

export function buildFounderReportSummary(posts: SocialPost[]): ReportSummary {
  const organic = posts.filter((p) => p.type === "organic");
  const paid = posts.filter(
    (p) => p.type === "paid" || p.type === "boosted"
  );
  const totalSpend = paid.reduce((sum, p) => sum + (p.metrics.spend ?? 0), 0);
  const avgER =
    posts.reduce((sum, p) => sum + engagementRate(p.metrics), 0) /
    (posts.length || 1);
  const avgCTR =
    posts.reduce((sum, p) => sum + clickThroughRate(p.metrics), 0) /
    (posts.length || 1);
  const latest = defaultAudienceGrowth[defaultAudienceGrowth.length - 1];
  const previous = defaultAudienceGrowth[defaultAudienceGrowth.length - 2];

  return {
    totalPosts: posts.length,
    organicPosts: organic.length,
    paidPosts: paid.length,
    totalSpend,
    avgEngagementRate: avgER,
    avgCTR,
    totalReach: posts.reduce((s, p) => s + p.metrics.reach, 0),
    totalImpressions: posts.reduce((s, p) => s + p.metrics.impressions, 0),
    audienceGrowth: latest.followers - previous.followers,
  };
}

export async function getFounderBrand(): Promise<BrandProfile> {
  const cache = await readFounderSocialCache();
  return {
    name: CEO.name,
    handle: `@${CEO.xHandle}`,
    competitors: [],
    ...(cache?.meta?.companySlug
      ? { handle: `@${cache.meta.companySlug}` }
      : {}),
  };
}

export async function getFounderAudienceGrowth(): Promise<AudienceSnapshot[]> {
  const { posts, channelSources, channelFollowers } =
    await getFounderMultiChannelPosts();
  const summaries = buildAllChannelSummaries(
    posts,
    channelSources,
    channelFollowers
  );
  const totalFollowers = summaries.reduce((s, c) => s + c.followers, 0);
  const monthlyGrowth = summaries.reduce((s, c) => s + c.followerGrowth, 0);

  if (totalFollowers === 0) return defaultAudienceGrowth;

  const months = AUDIENCE_GROWTH_HISTORY_MONTHS;
  const startFollowers = Math.max(
    0,
    totalFollowers - monthlyGrowth * (months - 1)
  );

  return Array.from({ length: months }, (_, i) => {
    const date = subMonths(now, months - 1 - i);
    const followers = Math.round(startFollowers + monthlyGrowth * i);
    const previousFollowers =
      i === 0
        ? followers
        : Math.round(startFollowers + monthlyGrowth * (i - 1));
    return {
      date: date.toISOString(),
      followers,
      growth: followers - previousFollowers,
    };
  });
}
