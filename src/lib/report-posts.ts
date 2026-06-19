import {
  clickThroughRate,
  engagementRate,
  rankByEngagement,
} from "@/lib/metrics";
import type { SocialPost } from "@/lib/types";

export type ReportPostSort = "date-desc" | "date-asc" | "engagement" | "ctr";

export function sortReportPosts(
  posts: SocialPost[],
  sort: ReportPostSort
): SocialPost[] {
  switch (sort) {
    case "date-desc":
      return [...posts].sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    case "date-asc":
      return [...posts].sort(
        (a, b) =>
          new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      );
    case "engagement":
      return rankByEngagement(posts);
    case "ctr":
      return [...posts].sort(
        (a, b) =>
          clickThroughRate(b.metrics) - clickThroughRate(a.metrics)
      );
  }
}

export function reportPostSortLabel(sort: ReportPostSort): string {
  switch (sort) {
    case "date-desc":
      return "newest first";
    case "date-asc":
      return "oldest first";
    case "engagement":
      return "best engagement rate";
    case "ctr":
      return "best CTR";
  }
}

export function topMetricForSort(
  post: SocialPost,
  sort: ReportPostSort
): { label: string; value: string } | null {
  switch (sort) {
    case "engagement":
      return {
        label: "Engagement",
        value: `${engagementRate(post.metrics).toFixed(1)}%`,
      };
    case "ctr":
      return {
        label: "CTR",
        value: `${clickThroughRate(post.metrics).toFixed(2)}%`,
      };
    default:
      return null;
  }
}
