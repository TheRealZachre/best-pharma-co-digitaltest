import {
  endOfDay,
  format,
  getDate,
  isWithinInterval,
  parseISO,
  setDate,
  startOfMonth,
  subMonths,
} from "date-fns";
import type { SocialPost } from "@/lib/types";

export interface AlignedMonthPeriodMeta {
  currentLabel: string;
  priorLabel: string;
  currentDateRange: string;
  priorDateRange: string;
  dayCount: number;
}

export function getAlignedMonthPeriods(
  referenceDate: Date = new Date()
): {
  current: { start: Date; end: Date };
  prior: { start: Date; end: Date };
  meta: AlignedMonthPeriodMeta;
} {
  const currentStart = startOfMonth(referenceDate);
  const currentEnd = endOfDay(referenceDate);
  const dayOfMonth = getDate(referenceDate);

  const priorMonth = subMonths(referenceDate, 1);
  const priorStart = startOfMonth(priorMonth);
  const priorEnd = endOfDay(setDate(priorMonth, dayOfMonth));

  return {
    current: { start: currentStart, end: currentEnd },
    prior: { start: priorStart, end: priorEnd },
    meta: {
      currentLabel: format(referenceDate, "MMMM yyyy"),
      priorLabel: format(priorMonth, "MMMM yyyy"),
      currentDateRange: `${format(currentStart, "MMM d")} – ${format(currentEnd, "MMM d, yyyy")}`,
      priorDateRange: `${format(priorStart, "MMM d")} – ${format(priorEnd, "MMM d, yyyy")}`,
      dayCount: dayOfMonth,
    },
  };
}

export function filterPostsByDateRange(
  posts: SocialPost[],
  start: Date,
  end: Date
): SocialPost[] {
  return posts.filter((post) => {
    const publishedAt = parseISO(post.publishedAt);
    return isWithinInterval(publishedAt, { start, end });
  });
}

export function getPostDateRangeLabel(posts: SocialPost[]): string {
  if (posts.length === 0) {
    return "No posts loaded";
  }

  const timestamps = posts
    .map((post) => new Date(post.publishedAt).getTime())
    .sort((a, b) => a - b);
  const start = new Date(timestamps[0]);
  const end = new Date(timestamps[timestamps.length - 1]);

  if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
    return format(start, "MMM d, yyyy");
  }

  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

export function getAlignedMonthPeriodPosts(
  posts: SocialPost[],
  referenceDate: Date = new Date()
) {
  const { current, prior, meta } = getAlignedMonthPeriods(referenceDate);

  return {
    currentPosts: filterPostsByDateRange(posts, current.start, current.end),
    priorPosts: filterPostsByDateRange(posts, prior.start, prior.end),
    meta,
  };
}
