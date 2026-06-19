import { StoryBeatBadge } from "@/components/narrative/StoryBeatBadge";
import type { BudgetRecommendation, SocialPost } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/metrics";
import { DollarSign, TrendingUp, Zap } from "lucide-react";

interface BudgetRecommendationsProps {
  posts: SocialPost[];
  recommendations: BudgetRecommendation[];
}

export function BudgetRecommendations({
  posts,
  recommendations,
}: BudgetRecommendationsProps) {
  const eligible = recommendations.filter((r) => r.eligible);

  if (eligible.length === 0) {
    return (
      <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-brand-ink">
          Paid Amplification Recommendations
        </h3>
        <p className="mt-2 text-sm text-brand-muted">
          No posts currently meet the eligibility threshold for paid boost
          recommendations.
        </p>
      </div>
    );
  }

  const postMap = new Map(posts.map((p) => [p.id, p]));

  return (
    <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-amber-500" />
        <h3 className="text-base font-semibold text-brand-ink">
          Paid Amplification Recommendations
        </h3>
      </div>
      <p className="mt-1 text-sm text-brand-muted">
        {eligible.length} posts eligible for paid boost based on organic
        performance
      </p>

      <div className="mt-6 space-y-4">
        {eligible.slice(0, 6).map((rec) => {
          const post = postMap.get(rec.postId);
          if (!post) return null;

          return (
            <div
              key={rec.postId}
              className="rounded-lg border border-amber-100 bg-amber-50/50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StoryBeatBadge beat={post.storyBeat} size="md" />
                    <span className="text-xs capitalize text-brand-muted">
                      {post.platform}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-brand-muted">
                    {post.caption}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                  <DollarSign className="h-3.5 w-3.5" />
                  {formatCurrency(rec.recommendedBudget)}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                <div>
                  <p className="text-brand-muted/60">Projected ER</p>
                  <p className="flex items-center gap-1 font-semibold text-emerald-700">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {formatPercent(rec.projectedEngagementRate)}
                  </p>
                </div>
                <div>
                  <p className="text-brand-muted/60">Projected Reach</p>
                  <p className="font-semibold text-brand-ink">
                    {rec.projectedReach.toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-brand-muted/60">Rationale</p>
                  <p className="text-brand-muted">{rec.rationale}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
