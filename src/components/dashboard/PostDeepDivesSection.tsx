import { selectDeepDivePosts, deepDivePostPool } from "@/lib/narrative/deep-dive";
import { rankByEngagement } from "@/lib/metrics";
import type { SocialPost } from "@/lib/types";
import { PostDeepDive } from "./PostDeepDive";

interface PostDeepDivesSectionProps {
  posts: SocialPost[];
  title?: string;
  subtitle?: string;
  recentDays?: number;
}

export function PostDeepDivesSection({
  posts,
  title = "Why these landed. Why these didn't.",
  subtitle,
  recentDays = 30,
}: PostDeepDivesSectionProps) {
  const pool = deepDivePostPool(posts, recentDays);
  const featured = selectDeepDivePosts(posts, 6, recentDays);
  const rankedPosts = rankByEngagement(pool);

  if (featured.length === 0) return null;

  const postCount = pool.length;
  const timeframeText =
    recentDays > 0
      ? `Last ${recentDays} days · ${postCount} post${postCount !== 1 ? "s" : ""} analyzed`
      : `All-time · ${postCount} post${postCount !== 1 ? "s" : ""} analyzed`;

  const defaultSubtitle =
    `Per-post breakdown from the ${timeframeText.toLowerCase()}. ` +
    `What worked, what needs improvement, and the narrative role each post played.`;

  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c8102e]">
        Top Performers · Underperformers
      </p>
      <h2 className="mt-2 font-serif text-2xl font-normal tracking-[-0.01em] text-[#0d1421] md:text-[28px]">
        {title}
      </h2>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className="text-sm leading-relaxed text-[#4a5568]">
          {subtitle ?? defaultSubtitle}
        </p>
        <span className="inline-flex items-center gap-1 rounded-full border border-brand-ink/10 bg-brand-off-white px-2.5 py-0.5 text-xs font-medium text-brand-muted">
          {timeframeText}
        </span>
      </div>

      <div className="mt-5 space-y-[18px]">
        {featured.map((post, idx) => {
          const rank = rankedPosts.findIndex((p) => p.id === post.id);
          const isTop = rank < Math.ceil(rankedPosts.length / 2);
          const performerLabel = isTop ? "Top performer" : "Needs improvement";
          const labelColor = isTop ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-600 bg-red-50 border-red-200";

          return (
            <div key={post.id} className="relative">
              <div className="absolute -top-2 right-0 z-10">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${labelColor}`}>
                  {performerLabel}
                </span>
              </div>
              <PostDeepDive post={post} rankedPosts={rankedPosts} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
