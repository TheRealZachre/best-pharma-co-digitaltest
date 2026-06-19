import { coerceApifyRecord } from "../normalize";
import { parseFollowersFromApifyPostRecords } from "./company-detail";
import type { RawLinkedInPost } from "../types";

const ACTOR = "apimaestro/linkedin-company-posts";

async function fetchApifyRecords(
  companySlug: string,
  token: string,
  maxPosts: number
): Promise<Record<string, unknown>[]> {
  const url = new URL(
    `https://api.apify.com/v2/acts/${ACTOR.replace("/", "~")}/run-sync-get-dataset-items`
  );
  url.searchParams.set("token", token);
  url.searchParams.set("format", "json");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_name: companySlug,
      limit: maxPosts,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Apify sync failed (${response.status}): ${body.slice(0, 300)}`
    );
  }

  return (await response.json()) as Record<string, unknown>[];
}

export async function fetchPostsFromApify(
  companySlug: string,
  token: string,
  maxPosts: number
): Promise<RawLinkedInPost[]> {
  const { posts } = await fetchApifyLinkedInData(companySlug, token, maxPosts);
  return posts;
}

export async function fetchApifyLinkedInData(
  companySlug: string,
  token: string,
  maxPosts: number
): Promise<{ posts: RawLinkedInPost[]; followerHint?: number }> {
  const records = await fetchApifyRecords(companySlug, token, maxPosts);

  const errorRecord = records.find((r) => r.message);
  if (errorRecord && records.length === 1) {
    throw new Error(
      `Apify returned no posts for "${companySlug}": ${String(errorRecord.message)}`
    );
  }

  const followerHint = parseFollowersFromApifyPostRecords(records);
  const posts = records
    .map((record, index) => coerceApifyRecord(record, index))
    .filter((post): post is RawLinkedInPost => post !== null)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

  return { posts, followerHint };
}
