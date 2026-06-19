import { BEATS } from "@/lib/narrative/beats";
import type { BeatPerformance } from "@/lib/narrative/types";
import { formatNumber, formatPercent } from "@/lib/metrics";

interface BeatRankingProps {
  beats: BeatPerformance[];
}

export function BeatRanking({ beats }: BeatRankingProps) {
  const max = beats[0]?.avgEngagementRate ?? 1;

  return (
    <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-brand-ink">
        Story Beat Performance
      </h3>
      <p className="mt-1 text-sm text-brand-muted">
        Ranked by average engagement rate
      </p>

      <div className="mt-6 space-y-4">
        {beats.map((entry, i) => (
          <div key={entry.beat}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium text-brand-ink/80">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: BEATS[entry.beat].color }}
                >
                  {i + 1}
                </span>
                {entry.beat}
              </span>
              <span className="font-semibold text-brand-ink">
                {formatPercent(entry.avgEngagementRate)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-off-white">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(entry.avgEngagementRate / max) * 100}%`,
                  backgroundColor: BEATS[entry.beat].color,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-brand-muted/60">
              {entry.postCount} posts · {formatNumber(entry.totalReach)} reach
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
