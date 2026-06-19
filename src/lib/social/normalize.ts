import { inferStoryBeat } from "@/lib/narrative/beats";
import { clicksFromImpressions } from "@/lib/metrics";
import { parseRelativeYouTubeDate } from "@/lib/youtube/parse-relative-date";
import type { ContentCategory, SocialPost } from "@/lib/types";
import {
  extractFacebookImageUrl,
  normalizeSocialImageUrl,
} from "./image-url";

const CATEGORY_RULES: { category: ContentCategory; patterns: RegExp[] }[] = [
  {
    category: "educational",
    patterns: [/fda|clinical|trial|asco|eha|oncolog|research|data|phase 3/i],
  },
  {
    category: "promotional",
    patterns: [/financial results|earnings|investor|quarter|press release/i],
  },
  {
    category: "ugc",
    patterns: [/patient story|meet \w+|richard's story/i],
  },
  {
    category: "behind-the-scenes",
    patterns: [/behind the scenes|team|#teambestpharma|booth|floor to feed/i],
  },
  {
    category: "lifestyle",
    patterns: [/awareness day|world day|poll/i],
  },
  {
    category: "product",
    patterns: [/launch|approval|inhibitor|therapy|pipeline/i],
  },
];

export function inferCategory(text: string): ContentCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.category;
  }
  return "promotional";
}

function estimateReach(
  likes: number,
  comments: number,
  shares: number,
  views?: number
): number {
  if (views && views > 0) return views;
  return Math.max(likes * 12 + shares * 40 + comments * 8, likes + shares);
}

function placeholderImage(id: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(id)}/600/600`;
}

export function parseXDate(label: string): string {
  const cleaned = label.trim();
  if (!cleaned) return new Date().toISOString();

  const parts = cleaned.split("·").map((p) => p.trim());
  if (parts.length >= 2) {
    const datePart = parts[0];
    const timePart = parts[1].replace(/\s*UTC$/i, "").trim();
    const parsed = new Date(`${datePart} ${timePart} UTC`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const fallback = new Date(cleaned);
  return Number.isNaN(fallback.getTime())
    ? new Date().toISOString()
    : fallback.toISOString();
}

export function normalizeInstagramPost(
  record: Record<string, unknown>
): SocialPost | null {
  const id = String(record.id ?? record.shortCode ?? "");
  const caption = String(record.caption ?? "").trim();
  if (!id || !caption) return null;

  const likes = Number(record.likesCount ?? 0);
  const comments = Number(record.commentsCount ?? 0);
  const reach = estimateReach(likes, comments, 0);
  const timestamp = String(record.timestamp ?? record.takenAt ?? "");
  const publishedAt = timestamp
    ? new Date(timestamp).toISOString()
    : new Date().toISOString();

  const images = record.images as string[] | undefined;
  const childPosts = record.childPosts as { displayUrl?: string }[] | undefined;
  const rawImage =
    String(record.displayUrl ?? images?.[0] ?? childPosts?.[0]?.displayUrl ?? "");
  const imageUrl =
    normalizeSocialImageUrl("instagram", rawImage) || placeholderImage(id);

  const impressions = Math.round(reach * 1.35);

  return {
    id: `ig-${id}`,
    platform: "instagram",
    category: inferCategory(caption),
    storyBeat: inferStoryBeat(caption),
    type: "organic",
    publishedAt,
    caption,
    imageUrl,
    metrics: {
      impressions,
      reach,
      likes,
      comments,
      shares: 0,
      saves: 0,
      clicks: clicksFromImpressions(impressions),
    },
  };
}

export function normalizeFacebookPost(
  record: Record<string, unknown>
): SocialPost | null {
  const id = String(record.postId ?? record.feedbackId ?? "");
  const caption = String(record.text ?? "").trim();
  if (!id || !caption) return null;

  const likes = Number(record.likes ?? record.reactionLikeCount ?? 0);
  const shares = Number(record.shares ?? 0);
  const views = Number(record.viewsCount ?? 0);
  const reach = estimateReach(likes, 0, shares, views);

  const timestamp = Number(record.timestamp ?? 0);
  const publishedAt = timestamp
    ? new Date(timestamp * 1000).toISOString()
    : record.time
      ? new Date(String(record.time)).toISOString()
      : new Date().toISOString();

  const imageUrl =
    normalizeSocialImageUrl("facebook", extractFacebookImageUrl(record)) ||
    placeholderImage(id);

  const impressions = Math.round(reach * 1.3);

  return {
    id: `fb-${id}`,
    platform: "facebook",
    category: inferCategory(caption),
    storyBeat: inferStoryBeat(caption),
    type: "organic",
    publishedAt,
    caption,
    imageUrl,
    metrics: {
      impressions,
      reach,
      likes,
      comments: 0,
      shares,
      saves: 0,
      clicks: clicksFromImpressions(impressions),
    },
  };
}

export function normalizeXPost(
  record: Record<string, unknown>
): SocialPost | null {
  if (record.type !== "tweet") return null;

  const id = String(record.tweet_id ?? "");
  const caption = String(record.text ?? "").trim();
  if (!id || !caption) return null;

  const stats = (record.stats ?? {}) as Record<string, number>;
  const likes = Number(stats.likes ?? 0);
  const comments = Number(stats.comments ?? 0);
  const shares = Number(stats.retweets ?? 0) + Number(stats.quotes ?? 0);
  const views = Number(stats.views ?? 0);
  const reach = estimateReach(likes, comments, shares, views);

  const publishedAt = parseXDate(String(record.date ?? ""));

  const media = record.media as { thumbnail?: string; url?: string }[] | undefined;
  const rawImage = media?.[0]?.thumbnail ?? media?.[0]?.url ?? "";
  const imageUrl =
    normalizeSocialImageUrl("x", rawImage) || placeholderImage(id);

  const impressions = views || Math.round(reach * 1.2);

  return {
    id: `x-${id}`,
    platform: "x",
    category: inferCategory(caption),
    storyBeat: inferStoryBeat(caption),
    type: "organic",
    publishedAt,
    caption,
    imageUrl,
    metrics: {
      impressions,
      reach,
      likes,
      comments,
      shares,
      saves: 0,
      clicks: clicksFromImpressions(impressions),
    },
  };
}

export function normalizeTikTokPost(
  record: Record<string, unknown>
): SocialPost | null {
  const id = String(record.id ?? "");
  const caption = String(record.text ?? "").trim();
  if (!id || !caption) return null;

  const likes = Number(record.diggCount ?? 0);
  const comments = Number(record.commentCount ?? 0);
  const shares = Number(record.shareCount ?? 0);
  const views = Number(record.playCount ?? 0);
  const reach = estimateReach(likes, comments, shares, views);

  const publishedAt =
    String(record.createTimeISO ?? "") ||
    (record.createTime
      ? new Date(Number(record.createTime) * 1000).toISOString()
      : new Date().toISOString());

  const videoMeta = record.videoMeta as { coverUrl?: string } | undefined;
  const imageUrl =
    String(videoMeta?.coverUrl ?? "") || placeholderImage(`tiktok-${id}`);

  const impressions = views || Math.round(reach * 1.2);

  return {
    id: `tiktok-${id}`,
    platform: "tiktok",
    category: inferCategory(caption),
    storyBeat: inferStoryBeat(caption),
    type: "organic",
    publishedAt,
    caption,
    imageUrl,
    metrics: {
      impressions,
      reach,
      likes,
      comments,
      shares,
      saves: Number(record.collectCount ?? 0),
      clicks: clicksFromImpressions(impressions),
    },
  };
}

export function normalizeYouTubePost(
  record: Record<string, unknown>
): SocialPost | null {
  const id = String(record.id ?? "");
  const title = String(record.title ?? "").trim();
  if (!id || !title) return null;

  const views = Number(record.viewCount ?? 0);
  const caption = title;
  const reach = views || 100;

  const publishedAt = parseRelativeYouTubeDate(String(record.date ?? ""));

  const imageUrl =
    String(record.thumbnailUrl ?? "") || placeholderImage(id);

  const impressions = views;

  return {
    id: `yt-${id}`,
    platform: "youtube",
    category: inferCategory(caption),
    storyBeat: inferStoryBeat(caption),
    type: "organic",
    publishedAt,
    caption,
    imageUrl,
    metrics: {
      impressions,
      reach,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      clicks: clicksFromImpressions(impressions),
    },
  };
}
