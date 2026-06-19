import { subDays, subMonths } from "date-fns";
import type {
  AudienceSnapshot,
  BrandProfile,
  CompetitorBrand,
  ReportSummary,
  ReportTimeframe,
  SocialPost,
} from "@/lib/types";
import {
  clickThroughRate,
  engagementRate,
} from "@/lib/metrics";
import { generateChannelSeedPosts } from "@/lib/analytics/channel-seed";
import { AUDIENCE_GROWTH_HISTORY_MONTHS } from "@/lib/audience-growth";
import { filterPostsByChannels } from "@/lib/analytics/channel-selection";
import { getSelectedAnalyticsChannels } from "@/lib/analytics/channel-selection.server";
import {
  buildAllChannelSummaries,
  filterPostsByPlatform,
} from "@/lib/analytics/summaries";
import { enrichPostsWithStoryBeat } from "@/lib/narrative/enrich";
import type { ChannelSummary, Platform } from "@/lib/types";
import type { SocialChannel, SocialPostCacheMeta } from "@/lib/social/types";
import { readPostCache } from "./cache";
import { readSocialCache } from "./social-cache";

export {
  competitors,
  audienceGrowth,
  brand as defaultBrand,
} from "@/lib/mock-data";

import { audienceGrowth, brand as defaultBrand, competitors } from "@/lib/mock-data";

const now = new Date();

const ANALYTICS_PLATFORMS: SocialChannel[] = [
  "linkedin",
  "instagram",
  "facebook",
  "x",
  "youtube",
  "tiktok",
];

function channelSourcesFromMeta(
  meta?: SocialPostCacheMeta
): Partial<Record<Platform, "live" | "seed">> {
  if (!meta?.channels) return {};

  const sources: Partial<Record<Platform, "live" | "seed">> = {};
  for (const platform of ANALYTICS_PLATFORMS) {
    const channelMeta = meta.channels[platform];
    if (channelMeta?.dataSource === "live") {
      sources[platform] = "live";
    } else if (channelMeta?.dataSource === "seed") {
      sources[platform] = "seed";
    }
  }
  return sources;
}

function followersFromMeta(
  meta?: SocialPostCacheMeta
): Partial<Record<Platform, number>> {
  if (!meta?.channels) return {};

  const followers: Partial<Record<Platform, number>> = {};
  for (const platform of ANALYTICS_PLATFORMS) {
    const count = meta.channels[platform]?.followers;
    if (count && count > 0) followers[platform] = count;
  }
  return followers;
}

export async function getLinkedInPosts(): Promise<{
  posts: SocialPost[];
  source: "cache" | "mock";
  meta?: {
    syncedAt: string;
    provider: string;
    companySlug: string;
    postCount: number;
    followers?: number;
  };
}> {
  const cache = await readPostCache();
  if (cache?.posts?.length) {
    return {
      posts: enrichPostsWithStoryBeat(cache.posts),
      source: "cache",
      meta: {
        syncedAt: cache.meta.syncedAt,
        provider: cache.meta.provider,
        companySlug: cache.meta.companySlug,
        postCount: cache.meta.postCount,
        followers: cache.meta.followers,
      },
    };
  }

  const { allPosts } = await import("@/lib/mock-data");
  return { posts: enrichPostsWithStoryBeat(allPosts), source: "mock" };
}

export async function getMultiChannelPosts(): Promise<{
  posts: SocialPost[];
  linkedInSource: "live" | "seed";
  channelSources: Partial<Record<Platform, "live" | "seed">>;
  channelFollowers: Partial<Record<Platform, number>>;
  meta?: SocialPostCacheMeta & { postCount: number };
}> {
  const socialCache = await readSocialCache();
  if (socialCache?.posts?.length) {
    const channelSources = channelSourcesFromMeta(socialCache.meta);
    const livePlatforms = ANALYTICS_PLATFORMS.filter(
      (platform) => channelSources[platform] === "live"
    );

    const seedPosts = generateChannelSeedPosts().filter(
      (post) => !livePlatforms.includes(post.platform as SocialChannel)
    );

    const posts = [...socialCache.posts, ...seedPosts].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const mergedSources: Partial<Record<Platform, "live" | "seed">> = {
      ...channelSources,
    };
    for (const platform of ANALYTICS_PLATFORMS) {
      if (!mergedSources[platform]) mergedSources[platform] = "seed";
    }

    return {
      posts: enrichPostsWithStoryBeat(posts),
      linkedInSource: mergedSources.linkedin ?? "seed",
      channelSources: mergedSources,
      channelFollowers: followersFromMeta(socialCache.meta),
      meta: {
        ...socialCache.meta,
        postCount: posts.length,
      },
    };
  }

  const { posts: linkedInPosts, source, meta } = await getLinkedInPosts();
  const seedPosts = generateChannelSeedPosts();
  const posts = [...linkedInPosts, ...seedPosts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const linkedInSource = source === "cache" ? "live" : "seed";
  const linkedInFollowers =
    meta?.followers && meta.followers > 0
      ? { linkedin: meta.followers }
      : {};

  return {
    posts,
    linkedInSource,
    channelSources: {
      linkedin: linkedInSource,
      instagram: "seed",
      facebook: "seed",
      x: "seed",
      youtube: "seed",
    },
    channelFollowers: linkedInFollowers,
    meta: meta
      ? {
          syncedAt: meta.syncedAt,
          companySlug: meta.companySlug,
          postCount: meta.postCount,
          channels: {
            linkedin: {
              postCount: meta.postCount,
              followers: meta.followers,
              provider: meta.provider,
              dataSource: linkedInSource,
              syncedAt: meta.syncedAt,
            },
          },
        }
      : undefined,
  };
}

export async function getAllPosts(): Promise<SocialPost[]> {
  const { posts } = await getMultiChannelPosts();
  const selectedChannels = await getSelectedAnalyticsChannels();
  return filterPostsByChannels(posts, selectedChannels);
}

export async function getPostsByPlatform(
  platform: Platform
): Promise<SocialPost[]> {
  const { posts } = await getMultiChannelPosts();
  return filterPostsByPlatform(posts, platform);
}

export async function getChannelSummaries(): Promise<{
  channels: ChannelSummary[];
  linkedInSource: "live" | "seed";
  channelSources: Partial<Record<Platform, "live" | "seed">>;
  selectedChannels: Platform[];
  meta?: Awaited<ReturnType<typeof getMultiChannelPosts>>["meta"];
}> {
  const { posts, linkedInSource, channelSources, channelFollowers, meta } =
    await getMultiChannelPosts();
  const selectedChannels = await getSelectedAnalyticsChannels();
  const filteredPosts = filterPostsByChannels(posts, selectedChannels);

  return {
    channels: buildAllChannelSummaries(
      filteredPosts,
      channelSources,
      channelFollowers
    ).filter((channel) => selectedChannels.includes(channel.platform)),
    linkedInSource,
    channelSources,
    selectedChannels,
    meta,
  };
}

export async function getPostsForTimeframe(
  timeframe: ReportTimeframe
): Promise<SocialPost[]> {
  const posts = await getAllPosts();
  const cutoffs = { weekly: 7, monthly: 30, quarterly: 90 };
  const cutoff = subDays(now, cutoffs[timeframe]);
  return posts.filter((p) => new Date(p.publishedAt) >= cutoff);
}

export function buildReportSummary(posts: SocialPost[]): ReportSummary {
  const organic = posts.filter((p) => p.type === "organic");
  const paid = posts.filter((p) => p.type === "paid" || p.type === "boosted");
  const totalSpend = paid.reduce(
    (sum, p) => sum + (p.metrics.spend ?? 0),
    0
  );

  const avgER =
    posts.reduce((sum, p) => sum + engagementRate(p.metrics), 0) /
    (posts.length || 1);
  const avgCTR =
    posts.reduce((sum, p) => sum + clickThroughRate(p.metrics), 0) /
    (posts.length || 1);

  const latest = audienceGrowth[audienceGrowth.length - 1];
  const previous = audienceGrowth[audienceGrowth.length - 2];

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

const COMPANY_NAMES: Record<string, string> = {
  "best-pharma-co": "Best Pharma Co.",
};

const PHARMA_COMPETITORS: CompetitorBrand[] = [
  {
    name: "NorthStar Therapeutics",
    followers: 890000,
    avgEngagementRate: 2.6,
    avgPostsPerWeek: 9,
    topCategory: "educational",
  },
  {
    name: "Helix Bio Sciences",
    followers: 620000,
    avgEngagementRate: 3.1,
    avgPostsPerWeek: 7,
    topCategory: "educational",
  },
  {
    name: "Meridian Health Labs",
    followers: 1100000,
    avgEngagementRate: 2.4,
    avgPostsPerWeek: 11,
    topCategory: "promotional",
  },
  {
    name: "Summit Oncology",
    followers: 480000,
    avgEngagementRate: 3.5,
    avgPostsPerWeek: 6,
    topCategory: "educational",
  },
];

function slugToBrandName(slug: string): string {
  return (
    COMPANY_NAMES[slug] ??
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

export async function getBrand(): Promise<BrandProfile> {
  const socialCache = await readSocialCache();
  if (socialCache?.meta?.companySlug) {
    const slug = socialCache.meta.companySlug;
    return {
      name: slugToBrandName(slug),
      handle: `@${slug}`,
      competitors: PHARMA_COMPETITORS,
    };
  }

  const cache = await readPostCache();
  if (cache?.meta?.companySlug) {
    const slug = cache.meta.companySlug;
    return {
      name: slugToBrandName(slug),
      handle: `@${slug}`,
      competitors: PHARMA_COMPETITORS,
    };
  }
  return defaultBrand;
}

export function getCompetitors(): CompetitorBrand[] {
  return competitors;
}

function buildAudienceGrowthFromSummaries(
  summaries: ChannelSummary[]
): AudienceSnapshot[] {
  const totalFollowers = summaries.reduce((s, c) => s + c.followers, 0);
  const monthlyGrowth = summaries.reduce((s, c) => s + c.followerGrowth, 0);

  if (totalFollowers === 0) {
    return audienceGrowth;
  }

  const months = AUDIENCE_GROWTH_HISTORY_MONTHS;
  const startFollowers = Math.max(
    0,
    totalFollowers - monthlyGrowth * (months - 1)
  );

  return Array.from({ length: months }, (_, i) => {
    const date = subMonths(now, months - 1 - i);
    const followers = Math.round(startFollowers + monthlyGrowth * i);
    const previousFollowers =
      i === 0 ? followers : Math.round(startFollowers + monthlyGrowth * (i - 1));

    return {
      date: date.toISOString(),
      followers,
      growth: followers - previousFollowers,
    };
  });
}

export async function getAudienceGrowth(): Promise<AudienceSnapshot[]> {
  const { posts, channelSources, channelFollowers } =
    await getMultiChannelPosts();
  const summaries = buildAllChannelSummaries(
    posts,
    channelSources,
    channelFollowers
  );
  return buildAudienceGrowthFromSummaries(summaries);
}
