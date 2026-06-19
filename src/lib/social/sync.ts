import { readPostCache } from "@/lib/data/cache";
import { readSocialCache, writeSocialCache } from "@/lib/data/social-cache";
import { resolveFollowerCount } from "./followers";
import { syncLinkedInPosts } from "@/lib/linkedin/sync";
import type { SocialPost } from "@/lib/types";
import { getSocialConfig } from "./config";
import { fetchFacebookPosts } from "./providers/facebook";
import { fetchInstagramPosts } from "./providers/instagram";
import { fetchXPosts } from "./providers/x";
import { fetchYouTubePosts } from "./providers/youtube";
import { fetchTikTokPosts } from "./providers/tiktok";
import type {
  ChannelSyncMeta,
  SocialChannel,
  SocialPostCache,
  SocialSyncResult,
} from "./types";

async function syncLinkedInChannel(
  maxPosts: number
): Promise<{ posts: SocialPost[]; meta: ChannelSyncMeta }> {
  const existingCache = await readSocialCache();
  const previousFollowers = existingCache?.meta.channels?.linkedin?.followers;

  try {
    const cache = await syncLinkedInPosts();
    return {
      posts: cache.posts.slice(0, maxPosts),
      meta: {
        postCount: cache.posts.length,
        followers: resolveFollowerCount(cache.meta.followers, previousFollowers),
        provider: cache.meta.provider,
        dataSource: cache.meta.provider === "seed" ? "seed" : "live",
        syncedAt: cache.meta.syncedAt,
      },
    };
  } catch (error) {
    const cached = await readPostCache();
    if (!cached?.posts?.length) throw error;

    return {
      posts: cached.posts.slice(0, maxPosts),
      meta: {
        postCount: cached.posts.length,
        followers: resolveFollowerCount(
          cached.meta.followers,
          previousFollowers
        ),
        provider: cached.meta.provider,
        dataSource: cached.meta.provider === "seed" ? "seed" : "live",
        syncedAt: cached.meta.syncedAt,
      },
    };
  }
}

async function syncChannel(
  channel: SocialChannel,
  token: string,
  maxPosts: number,
  previousFollowers?: number
): Promise<{ posts: SocialPost[]; meta: ChannelSyncMeta }> {
  const config = getSocialConfig();
  const syncedAt = new Date().toISOString();

  switch (channel) {
    case "linkedin":
      return syncLinkedInChannel(maxPosts);
    case "instagram": {
      const { posts, followers } = await fetchInstagramPosts(
        config.channels.instagram.handle,
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
    }
    case "facebook": {
      const { posts, followers } = await fetchFacebookPosts(
        config.channels.facebook.url,
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
    }
    case "x": {
      const { posts, followers } = await fetchXPosts(
        config.channels.x.handle,
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
    }
    case "youtube": {
      const { posts, followers } = await fetchYouTubePosts(
        config.channels.youtube.channel,
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
    }
    case "tiktok": {
      const { posts, followers } = await fetchTikTokPosts(
        config.channels.tiktok.handle ?? "bestpharmacoco",
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
    }
    default:
      throw new Error(`Unsupported channel: ${channel}`);
  }
}

export async function mergeChannelIntoSocialCache(
  channel: SocialChannel,
  posts: SocialPost[],
  meta: ChannelSyncMeta
): Promise<SocialPostCache> {
  const config = getSocialConfig();
  const existing = (await readSocialCache()) ?? {
    meta: {
      syncedAt: new Date().toISOString(),
      companySlug: config.companySlug,
      channels: {},
    },
    posts: [],
  };

  const otherPosts = existing.posts.filter((post) => post.platform !== channel);
  const previousFollowers = existing.meta.channels?.[channel]?.followers;
  const cache: SocialPostCache = {
    meta: {
      syncedAt: new Date().toISOString(),
      companySlug: config.companySlug,
      channels: {
        ...existing.meta.channels,
        [channel]: {
          ...meta,
          followers: resolveFollowerCount(meta.followers, previousFollowers),
        },
      },
    },
    posts: [...otherPosts, ...posts].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    ),
  };

  await writeSocialCache(cache);
  return cache;
}

export async function bootstrapSocialCacheFromLinkedIn(): Promise<SocialPostCache | null> {
  const linkedInCache = await readPostCache();
  if (!linkedInCache?.posts?.length) return null;

  const config = getSocialConfig();
  const cache: SocialPostCache = {
    meta: {
      syncedAt: linkedInCache.meta.syncedAt,
      companySlug: linkedInCache.meta.companySlug,
      channels: {
        linkedin: {
          postCount: linkedInCache.posts.length,
          followers: linkedInCache.meta.followers,
          provider: linkedInCache.meta.provider,
          dataSource:
            linkedInCache.meta.provider === "seed" ? "seed" : "live",
          syncedAt: linkedInCache.meta.syncedAt,
        },
      },
    },
    posts: linkedInCache.posts,
  };

  await writeSocialCache(cache);
  return cache;
}

export async function syncSocialPosts(
  channels?: SocialChannel[]
): Promise<SocialSyncResult> {
  const config = getSocialConfig();
  const token = config.apifyToken;
  const existingCache = await readSocialCache();

  const allChannels: SocialChannel[] = [
    "linkedin",
    "instagram",
    "facebook",
    "x",
    "youtube",
    "tiktok",
  ];
  const targetChannels: SocialChannel[] = channels ?? allChannels;
  const skippedChannels = allChannels.filter(
    (channel) => !targetChannels.includes(channel)
  );

  const errors: Partial<Record<SocialChannel, string>> = {};
  const channelMeta: Partial<Record<SocialChannel, ChannelSyncMeta>> = {};
  const allPosts: SocialPost[] = [];

  const results = await Promise.allSettled(
    targetChannels.map(async (channel) => {
      if (channel === "linkedin") {
        return { channel, ...(await syncLinkedInChannel(config.maxPosts)) };
      }

      if (!token) {
        throw new Error(
          "APIFY_TOKEN is required for non-LinkedIn channels. Set it in .env.local."
        );
      }

      const result = await syncChannel(
        channel,
        token,
        config.maxPosts,
        existingCache?.meta.channels?.[channel]?.followers
      );
      return { channel, ...result };
    })
  );

  for (let i = 0; i < results.length; i++) {
    const channel = targetChannels[i];
    const result = results[i];

    if (result.status === "fulfilled") {
      const previousFollowers = existingCache?.meta.channels?.[channel]?.followers;
      channelMeta[channel] = {
        ...result.value.meta,
        followers: resolveFollowerCount(
          result.value.meta.followers,
          previousFollowers
        ),
      };
      allPosts.push(...result.value.posts);
    } else {
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : "Sync failed";
      errors[channel] = message;

      const previousPosts =
        existingCache?.posts.filter((post) => post.platform === channel) ?? [];
      const previousMeta = existingCache?.meta.channels?.[channel];

      if (previousPosts.length > 0 && previousMeta) {
        channelMeta[channel] = {
          ...previousMeta,
          error: message,
        };
        allPosts.push(...previousPosts);
      } else {
        channelMeta[channel] = {
          postCount: 0,
          provider: "apify",
          dataSource: "error",
          error: message,
          syncedAt: new Date().toISOString(),
        };
      }
    }
  }

  const skippedPosts =
    existingCache?.posts.filter((post) =>
      skippedChannels.includes(post.platform as SocialChannel)
    ) ?? [];

  const posts = [...skippedPosts, ...allPosts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const cache: SocialPostCache = {
    meta: {
      syncedAt: new Date().toISOString(),
      companySlug: config.companySlug,
      channels: {
        ...(existingCache?.meta.channels ?? {}),
        ...channelMeta,
      },
    },
    posts,
  };

  if (posts.length > 0) {
    await writeSocialCache(cache);
  }

  return { cache, errors };
}
