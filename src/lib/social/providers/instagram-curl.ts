import { execFile } from "child_process";
import { promisify } from "util";
import { normalizeInstagramPost } from "../normalize";
import type { SocialPost } from "@/lib/types";

const execFileAsync = promisify(execFile);

const IG_HEADERS = [
  "-H",
  "User-Agent: Mozilla/5.0",
  "-H",
  "X-IG-App-ID: 936619743392459",
  "-H",
  "X-Requested-With: XMLHttpRequest",
];

async function curlJson<T>(url: string): Promise<T> {
  const { stdout } = await execFileAsync(
    "curl",
    ["-s", ...IG_HEADERS, url],
    { maxBuffer: 10 * 1024 * 1024, timeout: 30_000 }
  );

  return JSON.parse(stdout) as T;
}

function mapEdgeNode(node: Record<string, unknown>): Record<string, unknown> {
  const captionEdges = node.edge_media_to_caption as
    | { edges?: { node?: { text?: string } }[] }
    | undefined;

  return {
    id: node.id,
    caption: captionEdges?.edges?.[0]?.node?.text ?? "",
    timestamp: node.taken_at_timestamp
      ? new Date(Number(node.taken_at_timestamp) * 1000).toISOString()
      : undefined,
    likesCount:
      (node.edge_liked_by as { count?: number } | undefined)?.count ??
      (node.edge_media_preview_like as { count?: number } | undefined)?.count ??
      0,
    commentsCount:
      (node.edge_media_to_comment as { count?: number } | undefined)?.count ??
      0,
    displayUrl: node.display_url ?? node.thumbnail_src,
  };
}

function mapFeedItem(item: Record<string, unknown>): Record<string, unknown> {
  const caption = item.caption as { text?: string } | null | undefined;
  const imageVersions = item.image_versions2 as
    | { candidates?: { url?: string }[] }
    | undefined;

  return {
    id: item.id ?? item.code,
    caption: caption?.text ?? "",
    timestamp: item.taken_at
      ? new Date(Number(item.taken_at) * 1000).toISOString()
      : undefined,
    likesCount: item.like_count ?? 0,
    commentsCount: item.comment_count ?? 0,
    displayUrl: imageVersions?.candidates?.[0]?.url ?? item.display_url,
  };
}

export async function fetchInstagramPostsCurl(
  handle: string,
  maxPosts: number
): Promise<{ posts: SocialPost[]; followers?: number }> {
  const profile = await curlJson<{
    data?: {
      user?: {
        id?: string;
        edge_followed_by?: { count?: number };
        edge_owner_to_timeline_media?: {
          edges?: { node: Record<string, unknown> }[];
        };
      };
    };
  }>(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`
  );

  const user = profile.data?.user;
  if (!user?.id) {
    throw new Error(`Instagram profile not found for @${handle}`);
  }

  const rawRecords: Record<string, unknown>[] = [];

  for (const edge of user.edge_owner_to_timeline_media?.edges ?? []) {
    rawRecords.push(mapEdgeNode(edge.node));
  }

  try {
    const feed = await curlJson<{
      items?: Record<string, unknown>[];
      more_available?: boolean;
      next_max_id?: string;
      status?: string;
      message?: string;
    }>(
      `https://www.instagram.com/api/v1/feed/user/${user.id}/?count=${Math.min(maxPosts, 50)}`
    );

    if (feed.status !== "fail") {
      for (const item of feed.items ?? []) {
        rawRecords.push(mapFeedItem(item));
      }

      let nextMaxId = feed.more_available ? feed.next_max_id : undefined;

      while (nextMaxId && rawRecords.length < maxPosts) {
        const page = await curlJson<{
          items?: Record<string, unknown>[];
          more_available?: boolean;
          next_max_id?: string;
          status?: string;
        }>(
          `https://www.instagram.com/api/v1/feed/user/${user.id}/?count=50&max_id=${encodeURIComponent(nextMaxId)}`
        );

        if (page.status === "fail" || !page.items?.length) break;

        for (const item of page.items) {
          rawRecords.push(mapFeedItem(item));
        }

        nextMaxId = page.more_available ? page.next_max_id : undefined;
      }
    }
  } catch {
    // Profile timeline edges are enough when the feed endpoint is rate-limited.
  }

  const seen = new Set<string>();
  const posts = rawRecords
    .map((record) => normalizeInstagramPost(record))
    .filter((post): post is SocialPost => {
      if (!post) return false;
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, maxPosts);

  return {
    posts,
    followers: user.edge_followed_by?.count,
  };
}
