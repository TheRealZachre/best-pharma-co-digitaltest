import { subDays } from "date-fns";
import type { BeatPerformance } from "./narrative/types";
import type {
  BudgetRecommendation,
  CategoryPerformance,
  PostMetrics,
  SocialPost,
} from "./types";

export function engagementRate(metrics: PostMetrics): number {
  if (metrics.reach === 0) return 0;
  const engagements =
    metrics.likes + metrics.comments + metrics.shares + metrics.saves;
  return (engagements / metrics.reach) * 100;
}

/** Default CTR for posts without native click data (matches seed corpus). */
const ESTIMATED_CTR = 0.012;

export function clicksFromImpressions(impressions: number): number {
  if (impressions <= 0) return 0;
  return Math.max(1, Math.floor(impressions * ESTIMATED_CTR));
}

export function estimatedClicks(metrics: PostMetrics): number {
  if (metrics.clicks > 0) return metrics.clicks;
  if (metrics.impressions === 0) return 0;
  return Math.max(1, Math.floor(metrics.impressions * ESTIMATED_CTR));
}

export function clickThroughRate(metrics: PostMetrics): number {
  if (metrics.impressions === 0) return 0;
  return (estimatedClicks(metrics) / metrics.impressions) * 100;
}

export function costPerEngagement(metrics: PostMetrics): number | null {
  if (!metrics.spend || metrics.spend === 0) return null;
  const engagements =
    metrics.likes + metrics.comments + metrics.shares + metrics.saves;
  if (engagements === 0) return null;
  return metrics.spend / engagements;
}

export function rankByEngagement(posts: SocialPost[]): SocialPost[] {
  return [...posts].sort(
    (a, b) => engagementRate(b.metrics) - engagementRate(a.metrics)
  );
}

export function filterRecentPosts(
  posts: SocialPost[],
  days: number
): SocialPost[] {
  const cutoff = subDays(new Date(), days);
  return posts.filter((post) => new Date(post.publishedAt) >= cutoff);
}

export function sortPostsByDateDesc(posts: SocialPost[]): SocialPost[] {
  return [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** Prefer recent posts for analysis; fall back to newest when the window is sparse. */
export function analysisPostPool(
  posts: SocialPost[],
  recentDays = 30,
  minPosts = 3
): SocialPost[] {
  const recent = filterRecentPosts(posts, recentDays);
  if (recent.length >= minPosts) return recent;
  return sortPostsByDateDesc(posts).slice(0, Math.max(minPosts, 12));
}

export function beatPerformance(posts: SocialPost[]): BeatPerformance[] {
  const map = new Map<
    string,
    { posts: SocialPost[]; reach: number; impressions: number }
  >();

  for (const post of posts) {
    const existing = map.get(post.storyBeat) ?? {
      posts: [],
      reach: 0,
      impressions: 0,
    };
    existing.posts.push(post);
    existing.reach += post.metrics.reach;
    existing.impressions += post.metrics.impressions;
    map.set(post.storyBeat, existing);
  }

  return Array.from(map.entries())
    .map(([beat, data]) => ({
      beat: beat as BeatPerformance["beat"],
      postCount: data.posts.length,
      avgEngagementRate:
        data.posts.reduce((sum, p) => sum + engagementRate(p.metrics), 0) /
        data.posts.length,
      totalReach: data.reach,
      totalImpressions: data.impressions,
    }))
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
}

export function categoryPerformance(
  posts: SocialPost[]
): CategoryPerformance[] {
  const map = new Map<
    string,
    { posts: SocialPost[]; reach: number; impressions: number }
  >();

  for (const post of posts) {
    const existing = map.get(post.category) ?? {
      posts: [],
      reach: 0,
      impressions: 0,
    };
    existing.posts.push(post);
    existing.reach += post.metrics.reach;
    existing.impressions += post.metrics.impressions;
    map.set(post.category, existing);
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category: category as CategoryPerformance["category"],
      postCount: data.posts.length,
      avgEngagementRate:
        data.posts.reduce((sum, p) => sum + engagementRate(p.metrics), 0) /
        data.posts.length,
      totalReach: data.reach,
      totalImpressions: data.impressions,
    }))
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
}

const AMPLIFICATION_THRESHOLD = 3.5;
const BASE_BUDGET = 150;
const BUDGET_MULTIPLIER = 45;

export function budgetRecommendation(post: SocialPost): BudgetRecommendation {
  const rate = engagementRate(post.metrics);
  const eligible =
    post.type === "organic" && rate >= AMPLIFICATION_THRESHOLD;

  if (!eligible) {
    return {
      postId: post.id,
      eligible: false,
      recommendedBudget: 0,
      projectedEngagementRate: rate,
      projectedReach: post.metrics.reach,
      rationale:
        rate < AMPLIFICATION_THRESHOLD
          ? "Engagement rate below amplification threshold (3.5%). Focus on organic optimization."
          : "Already running as paid content.",
    };
  }

  const recommendedBudget = Math.round(
    BASE_BUDGET + rate * BUDGET_MULTIPLIER
  );
  const projectedReach = Math.round(
    post.metrics.reach * (1 + recommendedBudget / 500)
  );
  const projectedEngagementRate = rate * (1 + recommendedBudget / 800);

  return {
    postId: post.id,
    eligible: true,
    recommendedBudget,
    projectedEngagementRate,
    projectedReach,
    rationale: `Strong organic performance (${rate.toFixed(1)}% ER). Projected ${projectedEngagementRate.toFixed(1)}% ER with $${recommendedBudget} boost.`,
  };
}

function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function uniqueInsights(items: string[]): string[] {
  return [...new Set(items)];
}

export function whatWorkedAnalysis(
  posts: SocialPost[],
  recentDays: number | null = 30
): {
  worked: string[];
  didNot: string[];
  sunsetCandidates: string[];
  timeframeLabel: string;
} {
  const pool =
    recentDays == null || recentDays <= 0
      ? posts
      : analysisPostPool(posts, recentDays);
  const ranked = rankByEngagement(pool);
  const top = ranked.slice(0, 3);
  const bottom = ranked.slice(-3).reverse();
  const beats = beatPerformance(pool);

  const timeframeLabel =
    recentDays == null || recentDays <= 0
      ? `all ${pool.length} posts`
      : `last ${recentDays} days · ${pool.length} post${pool.length !== 1 ? "s" : ""}`;

  const worked = uniqueInsights([
    ...top.map(
      (p) =>
        `${p.storyBeat} on ${p.platform} (${engagementRate(p.metrics).toFixed(1)}% ER) — ${formatPostDate(p.publishedAt)}`
    ),
    beats[0]
      ? `${beats[0].beat} was the top-performing story beat overall`
      : "",
  ].filter(Boolean));

  const didNot = uniqueInsights([
    ...bottom.map(
      (p) =>
        `${p.storyBeat} on ${p.platform} underperformed (${engagementRate(p.metrics).toFixed(1)}% ER) — ${formatPostDate(p.publishedAt)}`
    ),
    beats[beats.length - 1]
      ? `${beats[beats.length - 1].beat} had the lowest story beat engagement`
      : "",
  ].filter(Boolean));

  // Sunset candidates: story beats with consistently low ER across ≥2 posts
  const beatCounts: Record<string, { count: number; totalER: number }> = {};
  for (const p of pool) {
    const key = p.storyBeat;
    if (!beatCounts[key]) beatCounts[key] = { count: 0, totalER: 0 };
    beatCounts[key].count += 1;
    beatCounts[key].totalER += engagementRate(p.metrics);
  }
  const avgEROverall =
    pool.reduce((s, p) => s + engagementRate(p.metrics), 0) / (pool.length || 1);

  const sunsetCandidates = Object.entries(beatCounts)
    .filter(([, { count, totalER }]) => {
      const beatAvg = totalER / count;
      return count >= 2 && beatAvg < avgEROverall * 0.5;
    })
    .map(([beat, { count, totalER }]) => {
      const beatAvg = totalER / count;
      return `${beat} — avg ${beatAvg.toFixed(1)}% ER across ${count} posts (half the overall average). Consider reducing this content type.`;
    });

  return { worked, didNot, sunsetCandidates, timeframeLabel };
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
