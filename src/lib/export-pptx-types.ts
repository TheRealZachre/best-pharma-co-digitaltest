import type { BeatPerformance } from "./narrative/types";
import type {
  CategoryPerformance,
  CompetitorBrand,
  ReportSummary,
  SocialPost,
} from "./types";
import { engagementRate } from "./metrics";
import { toNarrativePosts } from "./narrative/scoring";

export type ReportTimeframeExport = "weekly" | "monthly" | "quarterly";

export interface WeekSummaryRow {
  label: string;
  postCount: number;
  avgEngagementScore: number;
  avgEngagementRate: number;
  avgReactions?: number;
}

export interface MonthSummaryRow {
  label: string;
  postCount: number;
  avgEngagementScore: number;
  avgEngagementRate: number;
  dateRange?: string;
}

export interface PeriodComparisonExport {
  label: string;
  dateRange: string;
  postCount: number;
  avgEngagementScore: number;
  avgEngagementRate: number;
  avgReactions?: number;
}

export interface ReportPptxPayload {
  timeframe: ReportTimeframeExport;
  title: string;
  subtitle: string;
  brandName: string;
  summary: ReportSummary;
  posts: SocialPost[];
  weeks?: WeekSummaryRow[];
  priorWeeks?: WeekSummaryRow[];
  currentMonth?: MonthSummaryRow;
  priorMonth?: MonthSummaryRow;
  quarterMonths?: MonthSummaryRow[];
  currentPeriod?: PeriodComparisonExport;
  priorPeriod?: PeriodComparisonExport;
  beats?: BeatPerformance[];
  categories?: CategoryPerformance[];
  whatWorked?: { worked: string[]; didNot: string[] };
  recommendations?: string[];
  competitors?: CompetitorBrand[];
}

export function weekRowsFromBuckets(
  weeks: {
    label: string;
    postCount: number;
    avgEngagementScore: number;
    avgEngagementRate: number;
    avgReactions?: number;
  }[]
): WeekSummaryRow[] {
  return weeks.map((w) => ({
    label: w.label,
    postCount: w.postCount,
    avgEngagementScore: w.avgEngagementScore,
    avgEngagementRate: w.avgEngagementRate,
    avgReactions: w.avgReactions,
  }));
}

export function monthRowFromBucket(bucket: {
  label: string;
  postCount: number;
  avgEngagementScore: number;
  avgEngagementRate: number;
  dateRange?: string;
}): MonthSummaryRow {
  return {
    label: bucket.label,
    postCount: bucket.postCount,
    avgEngagementScore: bucket.avgEngagementScore,
    avgEngagementRate: bucket.avgEngagementRate,
    dateRange: bucket.dateRange,
  };
}

export function periodFromPosts(
  label: string,
  dateRange: string,
  posts: SocialPost[]
): PeriodComparisonExport {
  const narrative = toNarrativePosts(posts);
  const postCount = narrative.length;
  const avgEngagementScore =
    postCount > 0
      ? Math.round(
          narrative.reduce((sum, post) => sum + post.engagementScore, 0) /
            postCount
        )
      : 0;
  const avgEngagementRate =
    postCount > 0
      ? Math.round(
          (narrative.reduce(
            (sum, post) => sum + engagementRate(post.metrics),
            0
          ) /
            postCount) *
            10
        ) / 10
      : 0;

  return {
    label,
    dateRange,
    postCount,
    avgEngagementScore,
    avgEngagementRate,
  };
}

export function periodFromSummary(
  label: string,
  dateRange: string,
  summary: {
    postCount: number;
    avgEngagementScore: number;
    avgEngagementRate: number;
    avgReactions?: number;
  }
): PeriodComparisonExport {
  return {
    label,
    dateRange,
    postCount: summary.postCount,
    avgEngagementScore: summary.avgEngagementScore,
    avgEngagementRate: summary.avgEngagementRate,
    avgReactions: summary.avgReactions,
  };
}
