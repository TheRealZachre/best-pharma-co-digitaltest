import type { MonthBucket } from "@/lib/narrative/types";
import { formatPercent } from "@/lib/metrics";

interface QuarterlyMonthTrendProps {
  months: MonthBucket[];
}

export function QuarterlyMonthTrend({ months }: QuarterlyMonthTrendProps) {
  const visible = months.filter((m) => m.postCount > 0);
  if (visible.length === 0) return null;

  const maxRate = Math.max(...visible.map((m) => m.avgEngagementRate), 0.1);

  return (
    <section className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-brand-ink">
        Monthly trend across the quarter
      </h3>
      <p className="mt-1 text-sm text-brand-muted">
        Post volume and average engagement rate by month
      </p>

      <div className="mt-6 space-y-4">
        {visible.map((month) => (
          <div key={month.monthKey}>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium text-brand-ink">{month.label}</span>
              <span className="text-brand-muted">
                {month.postCount} posts · {formatPercent(month.avgEngagementRate)}{" "}
                avg ER · score {month.avgEngagementScore}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-off-white">
              <div
                className="h-full rounded-full bg-rose-600"
                style={{
                  width: `${(month.avgEngagementRate / maxRate) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
