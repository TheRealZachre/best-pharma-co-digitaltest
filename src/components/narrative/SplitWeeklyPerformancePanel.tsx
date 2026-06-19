import type { WeekBucket } from "@/lib/narrative/types";
import { engagementRateAxisMax } from "@/lib/narrative/chart-axis";
import { PeriodMetricsChart } from "./PeriodMetricsChart";

interface SplitWeeklyPerformancePanelProps {
  current: {
    label: string;
    dateRange: string;
    weeks: WeekBucket[];
  };
  prior: {
    label: string;
    dateRange: string;
    weeks: WeekBucket[];
  };
}

function summarizeWeeks(weeks: WeekBucket[]) {
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

export function SplitWeeklyPerformancePanel({
  current,
  prior,
}: SplitWeeklyPerformancePanelProps) {
  const currentSummary = summarizeWeeks(current.weeks);
  const priorSummary = summarizeWeeks(prior.weeks);

  if (currentSummary.postCount === 0 && priorSummary.postCount === 0) {
    return null;
  }

  const maxEngagementRate = engagementRateAxisMax([
    currentSummary.avgEngagementRate,
    priorSummary.avgEngagementRate,
    ...current.weeks.map((w) => w.avgEngagementRate),
    ...prior.weeks.map((w) => w.avgEngagementRate),
  ]);

  return (
    <section className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-brand-ink">
        Weekly performance by month
      </h3>
      <p className="mt-1 text-sm text-brand-muted">
        Each side shows weekly engagement rate within that month
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <PeriodMetricsChart
          title={current.label}
          dateRange={current.dateRange}
          postCount={currentSummary.postCount}
          avgEngagementScore={currentSummary.avgEngagementScore}
          avgEngagementRate={currentSummary.avgEngagementRate}
          avgReactions={currentSummary.avgReactions}
          maxEngagementRate={maxEngagementRate}
          variant="current"
          weeks={current.weeks}
          emptyMessage="No weekly data for the current month."
        />
        <PeriodMetricsChart
          title={prior.label}
          dateRange={prior.dateRange}
          postCount={priorSummary.postCount}
          avgEngagementScore={priorSummary.avgEngagementScore}
          avgEngagementRate={priorSummary.avgEngagementRate}
          avgReactions={priorSummary.avgReactions}
          maxEngagementRate={maxEngagementRate}
          variant="prior"
          weeks={prior.weeks}
          emptyMessage="No weekly data for the prior month."
        />
      </div>
    </section>
  );
}
