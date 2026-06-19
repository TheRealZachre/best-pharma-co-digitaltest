import { subDays, subMonths } from "date-fns";
import { inferStoryBeat } from "@/lib/narrative/beats";
import type {
  AudienceSnapshot,
  BrandProfile,
  CompetitorBrand,
  ReportSummary,
  SocialPost,
} from "./types";
import {
  clickThroughRate,
  engagementRate,
} from "./metrics";
import { CLIENT_NAME, CLIENT_SLUG } from "./client";

const now = new Date();

function daysAgo(n: number): string {
  return subDays(now, n).toISOString();
}

const captions = [
  "Best Pharma Co. at ASCO 2026 — new data across oncology and vaccines.",
  "BPC-401 Priority Review: advancing care for patients with advanced NSCLC.",
  "Maria's rheumatoid arthritis story — Patients First in action.",
  "Q1 2026 results: $14.2B revenue, +8% year over year.",
  "Best Care Access program expanded to 14 new markets.",
  "2025 ESG report: carbon targets, trial diversity, community health.",
  "World Immunization Week — colleagues advancing next-gen vaccine candidates.",
  "Rare disease awareness: fewer than 10% of conditions have approved therapies.",
  "Great Place to Work certified across U.S. and EU hubs.",
  "Patient Advisory Council 2026 — lived experience shaping our programs.",
  "Dr. James Okonkwo on translational oncology — urgency with rigor.",
  "42 ASCO abstracts accepted — hematology depth and solid tumor momentum.",
];

const categories = [
  "product",
  "lifestyle",
  "educational",
  "ugc",
  "promotional",
  "behind-the-scenes",
] as const;

const platforms = [
  "instagram",
  "facebook",
  "tiktok",
  "linkedin",
] as const;

function makePost(i: number, daysBack: number): SocialPost {
  const isPaid = i % 5 === 0;
  const isBoosted = i % 7 === 0 && !isPaid;
  const reach = 12000 + Math.floor(Math.random() * 38000);
  const impressions = Math.round(reach * (1.2 + Math.random() * 0.8));
  const likes = Math.floor(reach * (0.02 + Math.random() * 0.06));
  const comments = Math.floor(likes * (0.05 + Math.random() * 0.1));
  const shares = Math.floor(likes * (0.02 + Math.random() * 0.05));
  const saves = Math.floor(likes * (0.08 + Math.random() * 0.12));
  const clicks = Math.floor(impressions * (0.005 + Math.random() * 0.02));

  const caption = captions[i % captions.length];

  return {
    id: `post-${i}`,
    platform: platforms[i % platforms.length],
    category: categories[i % categories.length],
    storyBeat: inferStoryBeat(caption),
    type: isPaid ? "paid" : isBoosted ? "boosted" : "organic",
    publishedAt: daysAgo(daysBack),
    caption,
    imageUrl: `https://picsum.photos/seed/bpc-${i + 42}/600/600`,
    metrics: {
      impressions,
      reach,
      likes,
      comments,
      shares,
      saves,
      clicks,
      spend: isPaid || isBoosted ? 200 + Math.floor(Math.random() * 800) : undefined,
    },
  };
}

export const allPosts: SocialPost[] = Array.from({ length: 45 }, (_, i) =>
  makePost(i, Math.floor(i * 2.1))
);

export function getPostsForTimeframe(
  timeframe: "weekly" | "monthly" | "quarterly"
): SocialPost[] {
  const cutoffs = { weekly: 7, monthly: 30, quarterly: 90 };
  const cutoff = subDays(now, cutoffs[timeframe]);
  return allPosts.filter((p) => new Date(p.publishedAt) >= cutoff);
}

export const competitors: CompetitorBrand[] = [
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

export const brand: BrandProfile = {
  name: CLIENT_NAME,
  handle: `@${CLIENT_SLUG}`,
  competitors,
};

export const audienceGrowth: AudienceSnapshot[] = Array.from(
  { length: 24 },
  (_, i) => {
    const date = subMonths(now, 23 - i);
    const base = 2100000 + i * 1800 + Math.floor(Math.random() * 600);
    return {
      date: date.toISOString(),
      followers: base,
      growth: i === 0 ? 0 : base - (2100000 + (i - 1) * 1800),
    };
  }
);

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
