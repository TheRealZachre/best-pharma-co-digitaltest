import type { WeekBucket } from "@/lib/narrative/types";
import { formatPercent } from "@/lib/metrics";
import { engagementRateAxisMax } from "@/lib/narrative/chart-axis";
import { PeriodMetricsChart } from "./PeriodMetricsChart";

interface WeekComparisonPanelProps {
  current: {
    weeks: WeekBucket[];
    dateRange: string;
    postCount: number;
    avgEngagementScore: number;
    avgEngagementRate: number;
    avgReactions: number;
  };
  prior: {
    weeks: WeekBucket[];
    dateRange: string;
    postCount: number;
    avgEngagementScore: number;
    avgEngagementRate: number;
    avgReactions: number;
  };
}

export function WeekComparisonPanel({ current, prior }: WeekComparisonPanelProps) {
  const maxEngagementRate = engagementRateAxisMax([
    current.avgEngagementRate,
    prior.avgEngagementRate,
    ...current.weeks.map((w) => w.avgEngagementRate),
    ...prior.weeks.map((w) => w.avgEngagementRate),
  ]);

  const rateDelta =
    prior.postCount > 0 && current.postCount > 0
      ? Math.round((current.avgEngagementRate - prior.avgEngagementRate) * 10) /
        10
      : null;
  const positive = rateDelta !== null && rateDelta >= 0;

  return (
    <section className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-brand-ink">
        Current week vs prior week
      </h3>
      <p className="mt-1 text-sm text-brand-muted">
        Side-by-side engagement rate by period with date ranges
      </p>

      {rateDelta !== null && (
        <p
          className={`mt-3 text-sm font-medium ${positive ? "text-emerald-600" : "text-rose-600"}`}
        >
          {positive ? "+" : ""}
          {formatPercent(rateDelta, 1)} engagement rate vs prior week
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <PeriodMetricsChart
          title="Current week"
          dateRange={current.dateRange}
          postCount={current.postCount}
          avgEngagementScore={current.avgEngagementScore}
          avgEngagementRate={current.avgEngagementRate}
          avgReactions={current.avgReactions}
          maxEngagementRate={maxEngagementRate}
          variant="current"
          weeks={current.weeks}
          emptyMessage="No posts in the current week."
        />
        <PeriodMetricsChart
          title="Prior week"
          dateRange={prior.dateRange}
          postCount={prior.postCount}
          avgEngagementScore={prior.avgEngagementScore}
          avgEngagementRate={prior.avgEngagementRate}
          avgReactions={prior.avgReactions}
          maxEngagementRate={maxEngagementRate}
          variant="prior"
          weeks={prior.weeks}
          emptyMessage="No posts in the prior week."
        />
      </div>
    </section>
  );
}
