import { normalizeInstagramPost } from "../normalize";
import type { SocialPost } from "@/lib/types";

const IG_APP_ID = "936619743392459";
const IG_HEADERS = {
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "X-IG-App-ID": IG_APP_ID,
  "X-Requested-With": "XMLHttpRequest",
  Referer: "https://www.instagram.com/",
  Origin: "https://www.instagram.com",
};

interface IgUser {
  id: string;
  edge_followed_by?: { count?: number };
  edge_owner_to_timeline_media?: {
    edges?: { node: Record<string, unknown> }[];
    page_info?: { has_next_page?: boolean; end_cursor?: string };
  };
}

interface IgFeedItem {
  id?: string;
  code?: string;
  caption?: { text?: string } | null;
  like_count?: number;
  comment_count?: number;
  taken_at?: number;
  image_versions2?: { candidates?: { url?: string }[] };
  display_url?: string;
}

async function igFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: IG_HEADERS,
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Instagram request failed (${response.status})`);
  }

  const body = (await response.json()) as T & { message?: string; status?: string };
  if (body.status === "fail") {
    throw new Error(body.message ?? "Instagram API request failed");
  }

  return body;
}

function mapFeedItem(item: IgFeedItem): Record<string, unknown> {
  const imageUrl =
    item.image_versions2?.candidates?.[0]?.url ?? item.display_url ?? "";

  return {
    id: item.id ?? item.code,
    caption: item.caption?.text ?? "",
    timestamp: item.taken_at
      ? new Date(item.taken_at * 1000).toISOString()
      : undefined,
    likesCount: item.like_count ?? 0,
    commentsCount: item.comment_count ?? 0,
    displayUrl: imageUrl,
    url: item.code ? `https://www.instagram.com/p/${item.code}/` : undefined,
  };
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
    url: node.shortcode
      ? `https://www.instagram.com/p/${String(node.shortcode)}/`
      : undefined,
  };
}

export async function fetchInstagramPostsPublic(
  handle: string,
  maxPosts: number
): Promise<{ posts: SocialPost[]; followers?: number }> {
  const profile = await igFetch<{ data?: { user?: IgUser } }>(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`
  );

  const user = profile.data?.user;
  if (!user?.id) {
    throw new Error(`Instagram profile not found for @${handle}`);
  }

  const followers = user.edge_followed_by?.count;
  const rawRecords: Record<string, unknown>[] = [];

  for (const edge of user.edge_owner_to_timeline_media?.edges ?? []) {
    rawRecords.push(mapEdgeNode(edge.node));
  }

  let nextMaxId: string | undefined;
  const feed = await igFetch<{
    items?: IgFeedItem[];
    more_available?: boolean;
    next_max_id?: string;
  }>(
    `https://www.instagram.com/api/v1/feed/user/${user.id}/?count=${Math.min(maxPosts, 50)}`
  );

  for (const item of feed.items ?? []) {
    rawRecords.push(mapFeedItem(item));
  }

  nextMaxId = feed.more_available ? feed.next_max_id : undefined;

  while (nextMaxId && rawRecords.length < maxPosts) {
    const page = await igFetch<{
      items?: IgFeedItem[];
      more_available?: boolean;
      next_max_id?: string;
    }>(
      `https://www.instagram.com/api/v1/feed/user/${user.id}/?count=50&max_id=${encodeURIComponent(nextMaxId)}`
    );

    if (!page.items?.length) break;

    for (const item of page.items) {
      rawRecords.push(mapFeedItem(item));
    }

    nextMaxId = page.more_available ? page.next_max_id : undefined;
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

  return { posts, followers };
}
