"use client";

import { PostInsightsAnalysis } from "@/components/dashboard/PostInsightsAnalysis";
import { SocialPostImage } from "@/components/dashboard/SocialPostImage";
import { StoryBeatBadge } from "@/components/narrative/StoryBeatBadge";
import type { SocialPost } from "@/lib/types";
import {
  clickThroughRate,
  engagementRate,
  formatNumber,
  formatPercent,
} from "@/lib/metrics";
import { Heart, MessageCircle, MousePointerClick, Share2 } from "lucide-react";
import clsx from "clsx";

interface PostPreviewProps {
  post: SocialPost;
  showBudget?: boolean;
  compact?: boolean;
}

const platformColors: Record<string, string> = {
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
  facebook: "bg-blue-600",
  tiktok: "bg-slate-900",
  linkedin: "bg-blue-700",
  x: "bg-slate-800",
  youtube: "bg-red-600",
};

export function PostPreview({
  post,
  showBudget = false,
  compact = false,
}: PostPreviewProps) {
  const er = engagementRate(post.metrics);
  const ctr = clickThroughRate(post.metrics);

  return (
    <article
      className={clsx(
        "relative overflow-hidden rounded-xl border border-brand-ink/10 bg-white shadow-sm",
        compact ? "" : "flex flex-col"
      )}
    >
      <SocialPostImage
        imageUrl={post.imageUrl}
        platform={post.platform}
        postId={post.id}
        fit="contain"
        maxHeightClassName={compact ? "max-h-64" : "max-h-[28rem]"}
      />
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex gap-2">
          <span
            className={clsx(
              "rounded-full px-2.5 py-1 text-xs font-semibold capitalize text-white",
              platformColors[post.platform]
            )}
          >
            {post.platform}
          </span>
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium capitalize text-brand-ink/80">
            {post.type}
          </span>
        </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <StoryBeatBadge beat={post.storyBeat} />
            <span className="rounded-md bg-brand-off-white px-2 py-0.5 text-xs font-medium capitalize text-brand-muted">
              {post.category}
            </span>
          </div>
          <time className="text-xs text-brand-muted/60">
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </time>
        </div>

        <div className="mb-3 rounded-lg border border-brand-ink/8 bg-brand-off-white p-3">
          <p className="line-clamp-3 text-sm leading-relaxed text-brand-ink/80">
            {post.caption}
          </p>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 text-xs">
          <Metric icon={Heart} label="Eng. Rate" value={formatPercent(er)} />
          <Metric icon={MousePointerClick} label="CTR" value={formatPercent(ctr)} />
          <Metric
            icon={MessageCircle}
            label="Reach"
            value={formatNumber(post.metrics.reach)}
          />
          <Metric
            icon={Share2}
            label="Impressions"
            value={formatNumber(post.metrics.impressions)}
          />
        </div>

        {post.insights && (
          <div className="mt-4 border-t border-[#e6e6e6] pt-4">
            <PostInsightsAnalysis
              insights={post.insights}
              layout={compact ? "stack" : "grid"}
            />
          </div>
        )}

        {showBudget && post.metrics.spend && (
          <p className="mt-3 text-xs text-brand-muted">
            Spend: ${post.metrics.spend.toLocaleString()}
          </p>
        )}
      </div>
    </article>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-brand-muted">
      <Icon className="h-3.5 w-3.5 text-brand-muted/60" />
      <span className="text-brand-muted/60">{label}</span>
      <span className="ml-auto font-semibold text-brand-ink">{value}</span>
    </div>
  );
}

