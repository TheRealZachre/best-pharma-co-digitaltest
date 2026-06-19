import type { SocialPost } from "@/lib/types";
import { differenceInDays } from "date-fns";
import type { NarrativePost } from "./types";

/** Weights used for narrative arc scoring and beat aggregates. */
export const ENGAGEMENT_SCORE_WEIGHTS = {
  likes: 1,
  comments: 3,
  shares: 5,
} as const;

export function narrativeEngagementScore(post: SocialPost): number {
  const m = post.metrics;
  return (
    m.likes * ENGAGEMENT_SCORE_WEIGHTS.likes +
    m.comments * ENGAGEMENT_SCORE_WEIGHTS.comments +
    m.shares * ENGAGEMENT_SCORE_WEIGHTS.shares
  );
}

export function toNarrativePost(
  post: SocialPost,
  referenceDate: Date = new Date()
): NarrativePost {
  const published = new Date(post.publishedAt);
  return {
    ...post,
    engagementScore: narrativeEngagementScore(post),
    daysAgo: Math.max(0, differenceInDays(referenceDate, published)),
  };
}

export function toNarrativePosts(
  posts: SocialPost[],
  referenceDate: Date = new Date()
): NarrativePost[] {
  return posts
    .map((p) => toNarrativePost(p, referenceDate))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}
