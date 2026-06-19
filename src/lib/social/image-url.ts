import type { Platform } from "@/lib/types";

const PROXY_HOSTS = ["cdninstagram.com", "fbcdn.net"];

export function extractFacebookImageUrl(
  record: Record<string, unknown>
): string {
  const media = record.media as Record<string, unknown>[] | undefined;

  for (const item of media ?? []) {
    const thumbnail = String(item.thumbnail ?? "");
    if (thumbnail.startsWith("http")) return thumbnail;

    const thumbnailImage = item.thumbnailImage as { uri?: string } | undefined;
    if (thumbnailImage?.uri) return thumbnailImage.uri;

    const photoImage = item.photo_image as { uri?: string } | undefined;
    if (photoImage?.uri) return photoImage.uri;

    const image = item.image as { uri?: string } | undefined;
    if (image?.uri) return image.uri;

    const uri = String(item.uri ?? "");
    if (uri.startsWith("http")) return uri;
  }

  const fallback = String(record.image ?? record.thumbnail ?? "");
  return fallback.startsWith("http") ? fallback : "";
}

export function normalizeTwitterImageUrl(url: string): string {
  if (!url.includes("twimg.com")) return url;

  const base = url.split("?")[0];
  if (base.endsWith(".jpg") || base.endsWith(".png")) {
    return `${base}?format=jpg&name=medium`;
  }

  return `${base}?format=jpg&name=medium`;
}

export function normalizeSocialImageUrl(
  platform: Platform,
  url: string
): string {
  if (!url || url.includes("picsum.photos")) return url;

  if (platform === "x") {
    return normalizeTwitterImageUrl(url);
  }

  return url;
}

export function shouldProxyImageUrl(url: string): boolean {
  if (!url.startsWith("http")) return false;
  try {
    const hostname = new URL(url).hostname;
    return PROXY_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

function placeholderImage(postId: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(postId)}/600/600`;
}

export function getPostImageCandidates(
  url: string,
  platform?: Platform,
  postId?: string
): string[] {
  const normalized = platform ? normalizeSocialImageUrl(platform, url) : url;
  const candidates: string[] = [];

  if (normalized && !normalized.includes("picsum.photos")) {
    if (shouldProxyImageUrl(normalized)) {
      candidates.push(`/api/media?url=${encodeURIComponent(normalized)}`);
    }
    candidates.push(normalized);
  }

  if (postId) {
    candidates.push(placeholderImage(postId));
  }

  return [...new Set(candidates.filter(Boolean))];
}

export function getPostImageSrc(
  url: string,
  platform?: Platform,
  postId?: string
): string {
  return getPostImageCandidates(url, platform, postId)[0] ?? "";
}
