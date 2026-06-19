import {
  endOfMonth,
  format,
  max,
  min,
  parseISO,
  startOfMonth,
  subMonths,
  subYears,
} from "date-fns";
import type { AudienceSnapshot } from "@/lib/types";

export const AUDIENCE_GROWTH_HISTORY_MONTHS = 24;
export const AUDIENCE_GROWTH_DEFAULT_MONTHS = 12;

export interface YearOverYearGrowth {
  absolute: number;
  percent: number;
  currentFollowers: number;
  priorFollowers: number;
  currentLabel: string;
  priorLabel: string;
}

export function getAudienceGrowthBounds(data: AudienceSnapshot[]): {
  min: Date;
  max: Date;
} {
  if (data.length === 0) {
    const today = new Date();
    return { min: subMonths(today, AUDIENCE_GROWTH_DEFAULT_MONTHS), max: today };
  }

  const dates = data.map((point) => parseISO(point.date));
  return { min: min(dates), max: max(dates) };
}

export function getDefaultAudienceGrowthRange(data: AudienceSnapshot[]): {
  start: Date;
  end: Date;
} {
  const { max: end } = getAudienceGrowthBounds(data);
  return {
    start: subMonths(end, AUDIENCE_GROWTH_DEFAULT_MONTHS),
    end,
  };
}

export function filterAudienceGrowthByRange(
  data: AudienceSnapshot[],
  rangeStart: Date,
  rangeEnd: Date
): AudienceSnapshot[] {
  const start = startOfMonth(rangeStart);
  const end = endOfMonth(rangeEnd);

  return data.filter((point) => {
    const date = parseISO(point.date);
    return date >= start && date <= end;
  });
}

export function formatAudienceGrowthRange(
  rangeStart: Date,
  rangeEnd: Date
): string {
  return `${format(rangeStart, "MMM d, yyyy")} – ${format(rangeEnd, "MMM d, yyyy")}`;
}

export function findAudienceSnapshotForMonth(
  data: AudienceSnapshot[],
  date: Date
): AudienceSnapshot | undefined {
  const monthKey = format(date, "yyyy-MM");
  return data.find(
    (point) => format(parseISO(point.date), "yyyy-MM") === monthKey
  );
}

export function computeYearOverYearGrowth(
  data: AudienceSnapshot[],
  asOf: Date = new Date()
): YearOverYearGrowth | null {
  const current = findAudienceSnapshotForMonth(data, asOf);
  const prior = findAudienceSnapshotForMonth(data, subYears(asOf, 1));

  if (!current || !prior || prior.followers === 0) {
    return null;
  }

  const absolute = current.followers - prior.followers;
  const percent = Math.round((absolute / prior.followers) * 1000) / 10;

  return {
    absolute,
    percent,
    currentFollowers: current.followers,
    priorFollowers: prior.followers,
    currentLabel: format(parseISO(current.date), "MMM yyyy"),
    priorLabel: format(parseISO(prior.date), "MMM yyyy"),
  };
}

export function attachPriorYearFollowers(
  data: AudienceSnapshot[],
  filtered: AudienceSnapshot[]
): Array<AudienceSnapshot & { priorYearFollowers?: number }> {
  return filtered.map((point) => {
    const date = parseISO(point.date);
    const priorYear = findAudienceSnapshotForMonth(data, subYears(date, 1));
    return {
      ...point,
      priorYearFollowers: priorYear?.followers,
    };
  });
}
