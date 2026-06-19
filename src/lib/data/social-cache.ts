import type { SocialPostCache } from "@/lib/social/types";
import {
  getRuntimeDataPath,
  readJsonCache,
  writeJsonCache,
} from "./json-cache";

const CACHE_FILENAME = "social-posts.json";

export function getSocialCachePath() {
  return getRuntimeDataPath(CACHE_FILENAME);
}

export async function readSocialCache(): Promise<SocialPostCache | null> {
  return readJsonCache<SocialPostCache>(CACHE_FILENAME);
}

export async function writeSocialCache(cache: SocialPostCache): Promise<void> {
  await writeJsonCache(CACHE_FILENAME, cache);
}
