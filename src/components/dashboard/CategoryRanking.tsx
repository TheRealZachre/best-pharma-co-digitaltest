import type { CategoryPerformance } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/metrics";

interface CategoryRankingProps {
  categories: CategoryPerformance[];
}

export function CategoryRanking({ categories }: CategoryRankingProps) {
  const max = categories[0]?.avgEngagementRate ?? 1;

  return (
    <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-brand-ink">
        Content Category Performance
      </h3>
      <p className="mt-1 text-sm text-brand-muted">
        Ranked by average engagement rate
      </p>

      <div className="mt-6 space-y-4">
        {categories.map((cat, i) => (
          <div key={cat.category}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium capitalize text-brand-ink/80">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-off-white text-xs font-bold text-brand-muted">
                  {i + 1}
                </span>
                {cat.category}
              </span>
              <span className="font-semibold text-brand-ink">
                {formatPercent(cat.avgEngagementRate)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-off-white">
              <div
                className="h-full rounded-full bg-brand-indigo/80 transition-all"
                style={{
                  width: `${(cat.avgEngagementRate / max) * 100}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-brand-muted/60">
              {cat.postCount} posts · {formatNumber(cat.totalReach)} reach
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
