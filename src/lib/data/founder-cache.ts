import type { SocialPostCache } from "@/lib/social/types";
import { getRuntimeDataPath, readJsonCache, writeJsonCache } from "./json-cache";

export const FOUNDER_CACHE_FILENAME = "founder-social-posts.json";

export function getFounderCachePath() {
  return getRuntimeDataPath(FOUNDER_CACHE_FILENAME);
}

export async function readFounderSocialCache(): Promise<SocialPostCache | null> {
  const data = await readJsonCache<SocialPostCache>(FOUNDER_CACHE_FILENAME);
  if (!data?.posts?.length) return null;
  return data;
}

export async function writeFounderSocialCache(
  cache: SocialPostCache
): Promise<void> {
  await writeJsonCache(FOUNDER_CACHE_FILENAME, cache);
}
