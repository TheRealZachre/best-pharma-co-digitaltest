import { inferStoryBeat } from "@/lib/narrative/beats";
import { clicksFromImpressions } from "@/lib/metrics";
import type { ContentCategory, SocialPost } from "@/lib/types";
import type { RawLinkedInPost } from "./types";

const CATEGORY_RULES: { category: ContentCategory; patterns: RegExp[] }[] = [
  {
    category: "educational",
    patterns: [/fda|clinical|trial|inhibitor|oncolog|research|data/i],
  },
  {
    category: "promotional",
    patterns: [/financial results|earnings|investor|quarter/i],
  },
  {
    category: "ugc",
    patterns: [/patient story|meet \w+|advocacy council/i],
  },
  {
    category: "behind-the-scenes",
    patterns: [/behind the scenes|team|great place to work|culture|gm\b/i],
  },
  {
    category: "lifestyle",
    patterns: [/awareness day|poll|world day/i],
  },
  {
    category: "product",
    patterns: [/launch|product|save changes|brand/i],
  },
];

function inferCategory(text: string): ContentCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.category;
  }
  return "promotional";
}

function estimateReach(reactions: number, reposts: number): number {
  return Math.max(reactions * 12 + reposts * 40, reactions + reposts);
}

export function normalizeLinkedInPost(raw: RawLinkedInPost): SocialPost {
  const text = [raw.headline, raw.text].filter(Boolean).join(" — ");
  const reach = estimateReach(raw.reactions, raw.reposts);
  const impressions = Math.round(reach * 1.35);

  return {
    id: raw.id,
    platform: "linkedin",
    category: inferCategory(text),
    storyBeat: inferStoryBeat(text),
    type: "organic",
    publishedAt: raw.publishedAt,
    caption: raw.text,
    imageUrl:
      raw.imageUrl ??
      `https://picsum.photos/seed/${encodeURIComponent(raw.id)}/600/600`,
    metrics: {
      impressions,
      reach,
      likes: raw.reactions,
      comments: raw.comments,
      shares: raw.reposts,
      saves: 0,
      clicks: clicksFromImpressions(impressions),
    },
  };
}

function apifyStats(record: Record<string, unknown>) {
  const stats = record.stats as Record<string, unknown> | undefined;
  return {
    reactions: Number(
      stats?.total_reactions ??
        stats?.like ??
        record.likes ??
        record.numLikes ??
        record.reactions ??
        0
    ),
    comments: Number(stats?.comments ?? record.comments ?? record.numComments ?? 0),
    reposts: Number(
      stats?.reposts ?? record.reposts ?? record.shares ?? record.repostCount ?? 0
    ),
  };
}

function isDisplayableImageUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    !lower.includes(".mp4") &&
    !lower.includes(".webm") &&
    !lower.includes("/playlist/vid/")
  );
}

function apifyImageUrl(record: Record<string, unknown>): string {
  const document = record.document as
    | { thumbnail?: string; cover_url?: string }
    | undefined;
  if (document?.thumbnail && isDisplayableImageUrl(document.thumbnail)) {
    return document.thumbnail;
  }
  if (document?.cover_url && isDisplayableImageUrl(document.cover_url)) {
    return document.cover_url;
  }

  const media = record.media as
    | { type?: string; items?: { url?: string; thumbnail?: string }[] }
    | undefined;

  for (const item of media?.items ?? []) {
    if (item.thumbnail && isDisplayableImageUrl(item.thumbnail)) {
      return item.thumbnail;
    }
    if (item.url && isDisplayableImageUrl(item.url)) {
      return item.url;
    }
  }

  const author = record.author as { logo_url?: string } | undefined;
  if (author?.logo_url) return author.logo_url;

  const fallback = String(record.imageUrl ?? record.image ?? record.mediaUrl ?? "");
  return isDisplayableImageUrl(fallback) ? fallback : author?.logo_url ?? "";
}

function apifyPublishedAt(record: Record<string, unknown>): string {
  const postedAt = record.posted_at as
    | { date?: string; timestamp?: number }
    | undefined;

  if (postedAt?.timestamp) {
    return new Date(postedAt.timestamp).toISOString();
  }
  if (postedAt?.date) {
    return new Date(postedAt.date.replace(" ", "T") + "Z").toISOString();
  }

  const fallback = String(
    record.postedAt ??
      record.postedDate ??
      record.publishedAt ??
      record.date ??
      ""
  );
  return fallback ? new Date(fallback).toISOString() : new Date().toISOString();
}

export function coerceApifyRecord(
  record: Record<string, unknown>,
  index: number
): RawLinkedInPost | null {
  if (record.message) return null;

  const text = String(
    record.text ??
      record.postText ??
      record.commentary ??
      record.description ??
      ""
  ).trim();

  if (!text) return null;

  const { reactions, comments, reposts } = apifyStats(record);

  const id = String(
    record.activity_urn ??
      record.post_url ??
      record.postUrl ??
      record.url ??
      record.activityId ??
      `linkedin-${index}`
  );

  return {
    id,
    url: String(record.post_url ?? record.postUrl ?? record.url ?? ""),
    headline: String(record.headline ?? record.title ?? ""),
    text,
    postType: String(record.post_type ?? record.postType ?? record.type ?? "Post"),
    publishedAt: apifyPublishedAt(record),
    reactions,
    comments,
    reposts,
    imageUrl: apifyImageUrl(record),
  };
}
