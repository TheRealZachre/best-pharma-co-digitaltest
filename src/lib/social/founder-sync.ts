/**
 * Sync social data for the Founder/CEO profile.
 * LinkedIn: elena-marshall  |  X: ElenaMarshallBP
 */

import { CEO } from "@/lib/client";

import { resolveFollowerCount } from "./followers";
import { fetchXPosts } from "./providers/x";
import { inferCategory } from "./normalize";
import { inferStoryBeat } from "@/lib/narrative/beats";
import type {
  ChannelSyncMeta,
  SocialChannel,
  SocialPostCache,
  SocialSyncResult,
} from "./types";
import type { SocialPost } from "@/lib/types";
import { readFounderSocialCache, writeFounderSocialCache } from "@/lib/data/founder-cache";
import { FOUNDER_SLUG } from "@/lib/data/founder";

// harvestapi/linkedin-profile-posts output shape (partial)
interface HarvestApiPost {
  type?: string;
  id?: string;
  content?: string;
  postedAt?: { date?: string; timestamp?: number };
  engagement?: { likes?: number; comments?: number; shares?: number; views?: number };
  postImages?: Array<{ url?: string }>;
  document?: { coverPages?: Array<{ imageUrls?: string[] }> };
  author?: { name?: string; publicIdentifier?: string; followerCount?: number };
}

function normalizeHarvestApiPost(record: HarvestApiPost): SocialPost | null {
  if (record.type === "profile" || !record.id) return null;

  const id = `linkedin-${record.id}`;
  const caption = record.content ?? "";
  const publishedAt =
    record.postedAt?.date ??
    (record.postedAt?.timestamp
      ? new Date(record.postedAt.timestamp).toISOString()
      : new Date().toISOString());

  const likes = record.engagement?.likes ?? 0;
  const comments = record.engagement?.comments ?? 0;
  const shares = record.engagement?.shares ?? 0;
  const views = record.engagement?.views ?? 0;
  const reach = views > 0 ? views : Math.max(likes * 12 + shares * 40 + comments * 8, likes + shares);
  const impressions = views > 0 ? Math.round(views * 1.3) : reach;
  const clicks = Math.round(reach * 0.018);

  const imageUrl =
    record.postImages?.[0]?.url ??
    record.document?.coverPages?.[0]?.imageUrls?.[0] ??
    `https://picsum.photos/seed/${encodeURIComponent(id)}/600/600`;

  const category = inferCategory(caption);

  return {
    id,
    platform: "linkedin",
    category,
    storyBeat: inferStoryBeat(caption),
    type: "organic",
    publishedAt,
    caption,
    imageUrl,
    metrics: { impressions, reach, likes, comments, shares, saves: 0, clicks },
  };
}

async function fetchLinkedInFollowerCount(
  profileUrl: string
): Promise<number | undefined> {
  try {
    const res = await fetch(profileUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return undefined;

    const html = await res.text();

    // LinkedIn embeds follower count in JSON-LD and meta tags
    const patterns = [
      /"followerCount"\s*:\s*(\d+)/,
      /(\d[\d,]+)\s*followers/i,
      /followerCount["\s:]+(\d+)/i,
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const n = parseInt(match[1].replace(/,/g, ""), 10);
        if (n > 0) return n;
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

async function fetchLinkedInPersonalPosts(
  profileUrl: string,
  token: string,
  maxPosts: number
): Promise<{ posts: SocialPost[]; followers?: number }> {
  const ACTOR = "harvestapi~linkedin-profile-posts";
  const url = new URL(
    `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items`
  );
  url.searchParams.set("token", token);
  url.searchParams.set("format", "json");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetUrls: [profileUrl],
      maxPosts,
      includeQuotePosts: true,
      includeReposts: false,
      scrapeReactions: false,
      scrapeComments: false,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `LinkedIn personal sync failed (${response.status}): ${body.slice(0, 300)}`
    );
  }

  const records = (await response.json()) as HarvestApiPost[];

  if (records.length === 0) {
    throw new Error(
      `No posts returned for LinkedIn profile "${profileUrl}". Check your APIFY_TOKEN and that the profile is public.`
    );
  }

  const posts = records
    .map(normalizeHarvestApiPost)
    .filter((p): p is SocialPost => p !== null)
    .slice(0, maxPosts);

  // Try to fetch follower count from the public profile page.
  // Falls back to LINKEDIN_FOUNDER_FOLLOWERS env var if the page is blocked.
  const liveFollowers = await fetchLinkedInFollowerCount(profileUrl);
  const manualFollowers = process.env.LINKEDIN_FOUNDER_FOLLOWERS
    ? Number(process.env.LINKEDIN_FOUNDER_FOLLOWERS)
    : undefined;
  const followers = liveFollowers ?? manualFollowers;

  return { posts, followers };
}

async function syncFounderLinkedIn(
  token: string,
  maxPosts: number,
  previousFollowers?: number
): Promise<{ posts: SocialPost[]; meta: ChannelSyncMeta }> {
  const syncedAt = new Date().toISOString();
  try {
    const { posts, followers } = await fetchLinkedInPersonalPosts(
      CEO.linkedinUrl,
      token,
      maxPosts
    );
    return {
      posts,
      meta: {
        postCount: posts.length,
        followers: resolveFollowerCount(followers, previousFollowers),
        provider: "apify",
        dataSource: "live",
        syncedAt,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "LinkedIn personal sync failed";
    throw new Error(message);
  }
}

async function syncFounderX(
  token: string,
  maxPosts: number,
  previousFollowers?: number
): Promise<{ posts: SocialPost[]; meta: ChannelSyncMeta }> {
  const syncedAt = new Date().toISOString();
  const { posts, followers } = await fetchXPosts(CEO.xHandle, token, maxPosts);
  return {
    posts,
    meta: {
      postCount: posts.length,
      followers: resolveFollowerCount(followers, previousFollowers),
      provider: "apify",
      dataSource: "live",
      syncedAt,
    },
  };
}

export async function syncFounderPosts(
  channels?: Array<"linkedin" | "x">
): Promise<SocialSyncResult> {
  // In dev, re-read .dev.vars on every call so new tokens are
  // picked up without a server restart.
  if (process.env.NODE_ENV !== "production") {
    try {
      const { existsSync, readFileSync } = await import("node:fs");
      const { join } = await import("node:path");
      const devVarsPath = join(process.cwd(), ".dev.vars");
      if (existsSync(devVarsPath)) {
        for (const line of readFileSync(devVarsPath, "utf8").split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const sep = trimmed.indexOf("=");
          if (sep === -1) continue;
          const k = trimmed.slice(0, sep).trim();
          let v = trimmed.slice(sep + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          if (k) process.env[k] = v;
        }
      }
    } catch {
      // ignore read errors
    }
  }

  const maxPosts = 50;
  const apifyToken = process.env.APIFY_TOKEN;

  const existingCache = await readFounderSocialCache();
  const ALLOWED: Array<"linkedin" | "x"> = ["linkedin", "x"];
  const targetChannels = (channels ?? ALLOWED).filter((c) =>
    ALLOWED.includes(c as "linkedin" | "x")
  ) as Array<"linkedin" | "x">;

  if (!apifyToken) {
    throw new Error(
      "APIFY_TOKEN is required to sync founder social data. " +
        "Set it in .dev.vars or as a Cloudflare Worker secret."
    );
  }

  const errors: Partial<Record<SocialChannel, string>> = {};
  const channelMeta: Partial<Record<SocialChannel, ChannelSyncMeta>> = {};
  const allPosts: SocialPost[] = [];

  await Promise.allSettled(
    targetChannels.map(async (channel) => {
      const previousFollowers =
        existingCache?.meta?.channels?.[channel]?.followers;
      try {
        let result: { posts: SocialPost[]; meta: ChannelSyncMeta };
        if (channel === "linkedin") {
          result = await syncFounderLinkedIn(apifyToken, maxPosts, previousFollowers);
        } else {
          result = await syncFounderX(apifyToken, maxPosts, previousFollowers);
        }
        channelMeta[channel] = result.meta;
        allPosts.push(...result.posts);
      } catch (err) {
        const msg = err instanceof Error ? err.message : `${channel} sync failed`;
        errors[channel] = msg;

        const prevPosts =
          existingCache?.posts.filter((p) => p.platform === channel) ?? [];
        const prevMeta = existingCache?.meta?.channels?.[channel];
        if (prevPosts.length > 0 && prevMeta) {
          channelMeta[channel] = { ...prevMeta, error: msg };
          allPosts.push(...prevPosts);
        } else {
          channelMeta[channel] = {
            postCount: 0,
            provider: "apify",
            dataSource: "error",
            error: msg,
            syncedAt: new Date().toISOString(),
          };
        }
      }
    })
  );

  // Preserve posts for channels we didn't sync this run
  const skippedPosts =
    existingCache?.posts.filter(
      (p) =>
        !targetChannels.includes(p.platform as "linkedin" | "x") &&
        ["linkedin", "x"].includes(p.platform)
    ) ?? [];

  const seen = new Set<string>();
  const posts = [...skippedPosts, ...allPosts]
    .filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

  const cache: SocialPostCache = {
    meta: {
      syncedAt: new Date().toISOString(),
      companySlug: FOUNDER_SLUG,
      channels: {
        ...(existingCache?.meta?.channels ?? {}),
        ...channelMeta,
      },
    },
    posts,
  };

  if (posts.length > 0) {
    await writeFounderSocialCache(cache);
  }

  return { cache, errors };
}
