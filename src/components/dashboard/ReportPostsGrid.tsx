"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  MousePointerClick,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import { PostPreview } from "@/components/dashboard/PostPreview";
import {
  reportPostSortLabel,
  sortReportPosts,
  type ReportPostSort,
} from "@/lib/report-posts";
import type { SocialPost } from "@/lib/types";

interface SortOption {
  id: ReportPostSort;
  label: string;
  icon: LucideIcon;
}

const SORT_OPTIONS: SortOption[] = [
  { id: "date-desc", label: "Date (newest)", icon: ArrowDown },
  { id: "date-asc", label: "Date (oldest)", icon: ArrowUp },
  { id: "engagement", label: "Best engagement rate", icon: TrendingUp },
  { id: "ctr", label: "Best CTR", icon: MousePointerClick },
];

interface ReportPostsGridProps {
  posts: SocialPost[];
  title: string;
  emptyMessage: string;
  showBudget?: boolean;
  defaultSort?: ReportPostSort;
}

export function ReportPostsGrid({
  posts,
  title,
  emptyMessage,
  showBudget = false,
  defaultSort = "date-desc",
}: ReportPostsGridProps) {
  const [sort, setSort] = useState<ReportPostSort>(defaultSort);

  const sortedPosts = useMemo(
    () => sortReportPosts(posts, sort),
    [posts, sort]
  );

  return (
    <section>
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-ink">
            {title} ({posts.length})
          </h2>
          {posts.length > 0 && (
            <p className="mt-1 text-sm text-brand-muted">
              Sorted by {reportPostSortLabel(sort)}.
            </p>
          )}
        </div>

        {posts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map(({ id, label, icon: Icon }) => {
              const active = sort === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSort(id)}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-brand-indigo bg-brand-indigo/10 text-brand-indigo"
                      : "border-brand-ink/10 bg-white text-brand-muted hover:border-slate-300 hover:text-brand-ink"
                  )}
                  aria-pressed={active}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-brand-muted">{emptyMessage}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedPosts.map((post, index) => (
            <div key={post.id} className="relative">
              {(sort === "engagement" || sort === "ctr") && index < 3 && (
                <span className="absolute -top-2 left-3 z-10 rounded-full bg-brand-indigo px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  #{index + 1}
                </span>
              )}
              <PostPreview post={post} showBudget={showBudget} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
