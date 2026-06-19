import { format } from "date-fns";
import { BEATS } from "@/lib/narrative/beats";
import {
  deepDivePerformance,
  postHeadline,
  postSnippet,
} from "@/lib/narrative/deep-dive";
import {
  clickThroughRate,
  rankByEngagement,
  formatPercent,
} from "@/lib/metrics";
import type { SocialPost } from "@/lib/types";
import clsx from "clsx";
import { PostInsightsAnalysis } from "./PostInsightsAnalysis";

interface PostDeepDiveProps {
  post: SocialPost;
  rankedPosts?: SocialPost[];
}

export function PostDeepDive({ post, rankedPosts }: PostDeepDiveProps) {
  const ranking = rankedPosts ?? rankByEngagement([post]);
  const performance = deepDivePerformance(post, ranking);
  const headline = postHeadline(post.caption);
  const snippet = postSnippet(post.caption, headline);
  const beatColor = BEATS[post.storyBeat].color;
  const hasEngagement =
    post.metrics.likes > 0 ||
    post.metrics.comments > 0 ||
    post.metrics.shares > 0;

  return (
    <article
      className={clsx(
        "relative rounded border bg-white px-6 py-7 md:px-9 md:py-8",
        performance === "top" && "border-[#c8102e]",
        performance === "under" && "border-[#b8731a]",
        performance === null && "border-[#e6e6e6]"
      )}
    >
      {performance === "top" && (
        <span className="absolute -top-2.5 left-7 rounded-sm bg-[#c8102e] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white">
          Top Performer
        </span>
      )}
      {performance === "under" && (
        <span className="absolute -top-2.5 left-7 rounded-sm bg-[#b8731a] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white">
          Underperformer
        </span>
      )}

      <div className="mb-3.5 flex flex-wrap items-center gap-3.5">
        <span
          className="rounded-sm px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{
            backgroundColor: `${beatColor}1f`,
            color: beatColor,
          }}
        >
          {post.storyBeat}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#4a5568]">
          {format(new Date(post.publishedAt), "MMM d, yyyy")}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#4a5568]">
          {post.type}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#4a5568]">
          {post.platform}
        </span>
      </div>

      <h3 className="mb-2.5 font-serif text-[22px] font-normal leading-[1.25] tracking-[-0.01em] text-[#0d1421]">
        {headline}
      </h3>

      {snippet && (
        <p className="mb-5 rounded-r border-l-[3px] border-[#e6e6e6] bg-[#f4f4f4] px-4 py-3.5 text-sm italic leading-[1.65] text-[#4a5568]">
          &ldquo;{snippet}&rdquo;
        </p>
      )}

      <div className="mb-5 flex flex-wrap gap-7 border-y border-[#e6e6e6] py-4">
        {hasEngagement ? (
          <>
            <EngagementStat label="Reactions" value={post.metrics.likes} />
            <EngagementStat label="Comments" value={post.metrics.comments} />
            <EngagementStat label="Reposts" value={post.metrics.shares} />
            <EngagementStat
              label="CTR"
              value={formatPercent(clickThroughRate(post.metrics))}
            />
          </>
        ) : (
          <EngagementStat
            label="Status"
            value="Engagement still building"
            muted
          />
        )}
      </div>

      {post.insights && <PostInsightsAnalysis insights={post.insights} />}
    </article>
  );
}

function EngagementStat({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number | string;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#4a5568]">
        {label}
      </span>
      <span
        className={clsx(
          "font-serif text-[22px] leading-none",
          muted ? "text-sm text-[#4a5568]" : "text-[#0d1421]"
        )}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}
