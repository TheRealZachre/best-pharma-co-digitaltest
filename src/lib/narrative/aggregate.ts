import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import type { SocialPost } from "@/lib/types";
import { engagementRate } from "@/lib/metrics";
import { BEAT_ORDER } from "./beats";
import { toNarrativePost, toNarrativePosts } from "./scoring";
import type { BeatStats, MonthBucket, NarrativePost, WeekBucket } from "./types";

export function computeBeatStats(posts: NarrativePost[]): BeatStats[] {
  const map = new Map<
    string,
    { posts: NarrativePost[]; reactions: number; reposts: number; comments: number }
  >();

  for (const post of posts) {
    const existing = map.get(post.storyBeat) ?? {
      posts: [],
      reactions: 0,
      reposts: 0,
      comments: 0,
    };
    existing.posts.push(post);
    existing.reactions += post.metrics.likes;
    existing.reposts += post.metrics.shares;
    existing.comments += post.metrics.comments;
    map.set(post.storyBeat, existing);
  }

  return BEAT_ORDER.filter((beat) => map.has(beat)).map((beat) => {
    const data = map.get(beat)!;
    return {
      beat,
      postCount: data.posts.length,
      avgReactions: Math.round(data.reactions / data.posts.length),
      totalReposts: data.reposts,
      totalComments: data.comments,
      avgEngagementScore: Math.round(
        data.posts.reduce((s, p) => s + p.engagementScore, 0) / data.posts.length
      ),
    };
  });
}

export function groupByWeek(
  posts: SocialPost[],
  referenceDate: Date = new Date()
): WeekBucket[] {
  const narrative = toNarrativePosts(posts, referenceDate);
  const map = new Map<string, NarrativePost[]>();

  for (const post of narrative) {
    const weekStart = startOfWeek(new Date(post.publishedAt), { weekStartsOn: 1 });
    const key = format(weekStart, "yyyy-MM-dd");
    const bucket = map.get(key) ?? [];
    bucket.push(post);
    map.set(key, bucket);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, weekPosts]) => {
      const start = new Date(key);
      const end = endOfWeek(start, { weekStartsOn: 1 });
      const avgReactions = Math.round(
        weekPosts.reduce((s, p) => s + p.metrics.likes, 0) / weekPosts.length
      );
      const avgEngagementScore = Math.round(
        weekPosts.reduce((s, p) => s + p.engagementScore, 0) / weekPosts.length
      );
      const avgEngagementRate =
        Math.round(
          (weekPosts.reduce((s, p) => s + engagementRate(p.metrics), 0) /
            weekPosts.length) *
            10
        ) / 10;
      return {
        label: `${format(start, "MMM d")} – ${format(end, "MMM d")}`,
        start: start.toISOString(),
        end: end.toISOString(),
        posts: weekPosts,
        postCount: weekPosts.length,
        avgReactions,
        avgEngagementScore,
        avgEngagementRate,
      };
    });
}

export function getMonthPosts(
  allPosts: SocialPost[],
  monthsAgo: number,
  referenceDate: Date = new Date()
): MonthBucket {
  const target = subMonths(referenceDate, monthsAgo);
  const start = startOfMonth(target);
  const end = endOfMonth(target);
  const monthPosts = allPosts.filter((p) => {
    const d = new Date(p.publishedAt);
    return d >= start && d <= end;
  });

  const narrative = monthPosts.map((p) => toNarrativePost(p, referenceDate));
  const avgEngagementScore =
    narrative.length > 0
      ? Math.round(
          narrative.reduce((s, p) => s + p.engagementScore, 0) / narrative.length
        )
      : 0;
  const avgEngagementRate =
    narrative.length > 0
      ? Math.round(
          (narrative.reduce((s, p) => s + engagementRate(p.metrics), 0) /
            narrative.length) *
            10
        ) / 10
      : 0;

  return {
    label: format(target, "MMMM yyyy"),
    monthKey: format(target, "yyyy-MM"),
    dateRange: `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`,
    start: start.toISOString(),
    end: end.toISOString(),
    posts: narrative,
    postCount: narrative.length,
    avgEngagementScore,
    avgEngagementRate,
  };
}

export function summarizeWeekBuckets(weeks: WeekBucket[]) {
  const active = weeks.filter((w) => w.postCount > 0);
  const postCount = active.reduce((sum, w) => sum + w.postCount, 0);
  const avgEngagementScore =
    postCount > 0
      ? Math.round(
          active.reduce(
            (sum, w) => sum + w.avgEngagementScore * w.postCount,
            0
          ) / postCount
        )
      : 0;
  const avgReactions =
    postCount > 0
      ? Math.round(
          active.reduce((sum, w) => sum + w.avgReactions * w.postCount, 0) /
            postCount
        )
      : 0;
  const avgEngagementRate =
    postCount > 0
      ? Math.round(
          (active.reduce(
            (sum, w) => sum + w.avgEngagementRate * w.postCount,
            0
          ) /
            postCount) *
            10
        ) / 10
      : 0;

  return { postCount, avgEngagementScore, avgReactions, avgEngagementRate };
}
