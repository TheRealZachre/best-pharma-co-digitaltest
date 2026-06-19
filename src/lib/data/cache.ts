import type { LinkedInPostCache } from "@/lib/linkedin/types";
import {
  getRuntimeDataPath,
  readJsonCache,
  writeJsonCache,
} from "./json-cache";

const CACHE_FILENAME = "linkedin-posts.json";

export function getCachePath() {
  return getRuntimeDataPath(CACHE_FILENAME);
}

export async function readPostCache(): Promise<LinkedInPostCache | null> {
  return readJsonCache<LinkedInPostCache>(CACHE_FILENAME);
}

export async function writePostCache(cache: LinkedInPostCache): Promise<void> {
  await writeJsonCache(CACHE_FILENAME, cache);
}
