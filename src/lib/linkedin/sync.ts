import { readPostCache, writePostCache } from "@/lib/data/cache";
import { resolveFollowerCount } from "@/lib/social/followers";
import { getLinkedInConfig } from "./config";
import { normalizeLinkedInPost } from "./normalize";
import { fetchApifyLinkedInData } from "./providers/apify";
import { fetchLinkedInCompanyFollowers } from "./providers/company-detail";
import { fetchPostsFromLinkedInApi } from "./providers/linkedin-api";
import { fetchPostsFromSeed } from "./providers/seed";
import type { LinkedInDataProvider, LinkedInPostCache, RawLinkedInPost } from "./types";

async function fetchRawPosts(
  provider: LinkedInDataProvider
): Promise<{ posts: RawLinkedInPost[]; followerHint?: number }> {
  const config = getLinkedInConfig();

  switch (provider) {
    case "apify": {
      if (!config.apifyToken) {
        throw new Error(
          "APIFY_TOKEN is required for live public LinkedIn sync. Get one at https://console.apify.com — or set LINKEDIN_DATA_PROVIDER=seed to use curated research data."
        );
      }
      return fetchApifyLinkedInData(
        config.companySlug,
        config.apifyToken,
        config.maxPosts
      );
    }
    case "linkedin": {
      if (!config.linkedinAccessToken || !config.linkedinOrganizationId) {
        throw new Error(
          "LINKEDIN_ACCESS_TOKEN and LINKEDIN_ORGANIZATION_ID are required for the official LinkedIn API."
        );
      }
      const posts = await fetchPostsFromLinkedInApi(
        config.linkedinOrganizationId,
        config.linkedinAccessToken,
        config.maxPosts
      );
      return { posts };
    }
    case "seed":
      return { posts: await fetchPostsFromSeed() };
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function syncLinkedInPosts(
  providerOverride?: LinkedInDataProvider
): Promise<LinkedInPostCache> {
  const config = getLinkedInConfig();
  const provider = providerOverride ?? config.provider;
  const existingCache = await readPostCache();
  const previousFollowers = existingCache?.meta.followers;

  const { posts: rawPosts, followerHint } = await fetchRawPosts(provider);
  const posts = rawPosts.map(normalizeLinkedInPost);

  let followers: number | undefined;
  if (config.apifyToken) {
    const companyFollowers = await fetchLinkedInCompanyFollowers(
      config.companySlug,
      config.apifyToken
    ).catch(() => undefined);
    followers = resolveFollowerCount(
      companyFollowers ?? followerHint,
      previousFollowers
    );
  } else {
    followers = resolveFollowerCount(followerHint, previousFollowers);
  }

  const cache: LinkedInPostCache = {
    meta: {
      syncedAt: new Date().toISOString(),
      provider,
      companySlug: config.companySlug,
      postCount: posts.length,
      followers,
      note:
        provider === "seed"
          ? "Curated from public LinkedIn research (CGA-style). Set APIFY_TOKEN to pull live data."
          : undefined,
    },
    posts,
  };

  await writePostCache(cache);
  return cache;
}
