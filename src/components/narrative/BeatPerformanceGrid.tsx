import { BEATS } from "@/lib/narrative/beats";
import type { BeatStats } from "@/lib/narrative/types";

interface BeatPerformanceGridProps {
  stats: BeatStats[];
}

export function BeatPerformanceGrid({ stats }: BeatPerformanceGridProps) {
  if (stats.length === 0) {
    return (
      <p className="text-sm text-brand-muted">No story beats in this period.</p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.beat}
          className="relative overflow-hidden rounded-xl border border-brand-ink/10 bg-white p-5 shadow-sm"
          style={{ borderLeftWidth: 4, borderLeftColor: BEATS[stat.beat].color }}
        >
          <h4 className="font-semibold text-brand-ink">{stat.beat}</h4>
          <p className="mt-1 text-xs uppercase tracking-wide text-brand-muted">
            {stat.postCount} {stat.postCount === 1 ? "post" : "posts"}
          </p>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-muted">Avg reactions</span>
              <span className="font-semibold">{stat.avgReactions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Total reposts</span>
              <span className="font-semibold">{stat.totalReposts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Engagement score</span>
              <span className="font-semibold">{stat.avgEngagementScore}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
