import type { WeekBucket } from "@/lib/narrative/types";

interface WeeklyPerformancePanelProps {
  weeks: WeekBucket[];
  title?: string;
}

export function WeeklyPerformancePanel({
  weeks,
  title = "Weekly performance within the month",
}: WeeklyPerformancePanelProps) {
  if (weeks.length === 0) {
    return null;
  }

  const maxScore = Math.max(...weeks.map((w) => w.avgEngagementScore), 1);

  return (
    <section className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-brand-ink">{title}</h3>
      <p className="mt-1 text-sm text-brand-muted">
        How each week performed on engagement score and post volume
      </p>

      <div className="mt-6 space-y-4">
        {weeks.map((week) => (
          <div key={week.start}>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium text-brand-ink">{week.label}</span>
              <span className="text-brand-muted">
                {week.postCount} posts · avg {week.avgReactions} reactions ·
                score {week.avgEngagementScore}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-off-white">
              <div
                className="h-full rounded-full bg-brand-indigo/80"
                style={{
                  width: `${(week.avgEngagementScore / maxScore) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
