import { getPostImageCandidates } from "@/lib/social/image-url";
import type { SocialPost } from "@/lib/types";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(buffer).toString("base64");
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

async function fetchImageAsDataUrl(
  url: string,
  origin?: string
): Promise<string | null> {
  try {
    const absolute = url.startsWith("/")
      ? `${origin ?? ""}${url}`
      : url;

    if (!absolute.startsWith("http")) {
      return null;
    }

    const response = await fetch(absolute, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) return null;

    const mime = contentType.split(";")[0] || "image/jpeg";
    return `${mime};base64,${arrayBufferToBase64(buffer)}`;
  } catch {
    return null;
  }
}

export async function resolvePostImageData(
  post: SocialPost,
  origin?: string
): Promise<string | null> {
  const candidates = getPostImageCandidates(
    post.imageUrl,
    post.platform,
    post.id
  );

  for (const candidate of candidates) {
    const dataUrl = await fetchImageAsDataUrl(candidate, origin);
    if (dataUrl) return dataUrl;
  }

  return null;
}
