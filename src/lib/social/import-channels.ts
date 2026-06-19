import { readSocialCache, writeSocialCache } from "@/lib/data/social-cache";
import { getSocialConfig } from "./config";
import { fetchFacebookPosts } from "./providers/facebook";
import { fetchInstagramPosts } from "./providers/instagram";
import type { ChannelSyncMeta, SocialChannel, SocialPostCache } from "./types";
import type { SocialPost } from "@/lib/types";

export async function importSocialChannels(
  channels: SocialChannel[]
): Promise<SocialPostCache> {
  const config = getSocialConfig();
  const token = config.apifyToken;
  const existing = await readSocialCache();
  const syncedAt = new Date().toISOString();

  const channelMeta: SocialPostCache["meta"]["channels"] = {
    ...(existing?.meta.channels ?? {}),
  };

  const keptPosts =
    existing?.posts.filter(
      (post) => !channels.includes(post.platform as SocialChannel)
    ) ?? [];

  const importedPosts: SocialPost[] = [];
  const errors: Partial<Record<SocialChannel, string>> = {};

  for (const channel of channels) {
    try {
      if (channel === "instagram") {
        const { posts, followers } = await fetchInstagramPosts(
          config.channels.instagram.handle,
          token ?? "",
          config.maxPosts
        );
        importedPosts.push(...posts);
        channelMeta.instagram = {
          postCount: posts.length,
          followers,
          provider: "instagram-public-api",
          dataSource: "live",
          syncedAt,
        };
      }

      if (channel === "facebook") {
        if (!token) {
          throw new Error("APIFY_TOKEN is required to import Facebook posts.");
        }
        const { posts, followers } = await fetchFacebookPosts(
          config.channels.facebook.url,
          token,
          config.maxPosts
        );
        importedPosts.push(...posts);
        channelMeta.facebook = {
          postCount: posts.length,
          followers,
          provider: "apify",
          dataSource: "live",
          syncedAt,
        };
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Import failed";
      errors[channel] = message;
      channelMeta[channel] = {
        postCount: 0,
        provider: "apify",
        dataSource: "error",
        error: message,
        syncedAt,
      };
    }
  }

  if (Object.keys(errors).length === channels.length) {
    throw new Error(
      channels.map((channel) => `${channel}: ${errors[channel]}`).join("; ")
    );
  }

  const posts = [...keptPosts, ...importedPosts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const cache: SocialPostCache = {
    meta: {
      syncedAt,
      companySlug: config.companySlug,
      channels: channelMeta,
    },
    posts,
  };

  await writeSocialCache(cache);
  return cache;
}
