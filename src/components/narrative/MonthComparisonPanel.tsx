import { ReportPostsGrid } from "@/components/dashboard/ReportPostsGrid";
import type { MonthBucket } from "@/lib/narrative/types";
import { formatPercent } from "@/lib/metrics";
import { engagementRateAxisMax } from "@/lib/narrative/chart-axis";
import { PeriodMetricsChart } from "./PeriodMetricsChart";

interface MonthComparisonPanelProps {
  current: MonthBucket;
  prior: MonthBucket;
}

export function MonthComparisonPanel({
  current,
  prior,
}: MonthComparisonPanelProps) {
  const rateDelta =
    prior.postCount > 0 && current.postCount > 0
      ? Math.round((current.avgEngagementRate - prior.avgEngagementRate) * 10) /
        10
      : 0;
  const positive = rateDelta >= 0;
  const maxEngagementRate = engagementRateAxisMax([
    current.avgEngagementRate,
    prior.avgEngagementRate,
  ]);

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-brand-ink">
          Current month vs prior month
        </h3>
        <p className="mt-1 text-sm text-brand-muted">
          Side-by-side engagement rate by month with date ranges
        </p>

        {prior.postCount > 0 && current.postCount > 0 && (
          <p
            className={`mt-3 text-sm font-medium ${positive ? "text-emerald-600" : "text-rose-600"}`}
          >
            {positive ? "+" : ""}
            {formatPercent(rateDelta, 1)} engagement rate vs prior month
          </p>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <PeriodMetricsChart
            title="Current month"
            dateRange={current.dateRange}
            postCount={current.postCount}
            avgEngagementScore={current.avgEngagementScore}
            avgEngagementRate={current.avgEngagementRate}
            maxEngagementRate={maxEngagementRate}
            variant="current"
            emptyMessage="No posts in the current month."
          />
          <PeriodMetricsChart
            title="Prior month"
            dateRange={prior.dateRange}
            postCount={prior.postCount}
            avgEngagementScore={prior.avgEngagementScore}
            avgEngagementRate={prior.avgEngagementRate}
            maxEngagementRate={maxEngagementRate}
            variant="prior"
            emptyMessage="No posts in the prior month."
          />
        </div>
      </div>

      {current.posts.length > 0 && (
        <ReportPostsGrid
          posts={current.posts}
          title={`Current month posts (${current.label})`}
          emptyMessage="No posts in the current month."
        />
      )}

      {prior.posts.length > 0 && (
        <ReportPostsGrid
          posts={prior.posts}
          title={`Prior month posts (${prior.label})`}
          emptyMessage="No posts in the prior month."
        />
      )}
    </section>
  );
}
