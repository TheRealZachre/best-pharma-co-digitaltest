const APIFY_BASE = "https://api.apify.com/v2";

export async function fetchLatestApifyDatasetItems(
  actorId: string,
  token: string,
  limit = 100
): Promise<Record<string, unknown>[]> {
  const runsUrl = new URL(
    `${APIFY_BASE}/acts/${actorId.replace("/", "~")}/runs`
  );
  runsUrl.searchParams.set("token", token);
  runsUrl.searchParams.set("limit", "20");
  runsUrl.searchParams.set("desc", "1");

  const runsResponse = await fetch(runsUrl, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!runsResponse.ok) {
    throw new Error(`Failed to list Apify runs for ${actorId}`);
  }

  const runsBody = (await runsResponse.json()) as {
    data?: { items?: { status?: string; defaultDatasetId?: string }[] };
  };

  const runs =
    runsBody.data?.items?.filter((run) => run.status === "SUCCEEDED") ?? [];

  const merged: Record<string, unknown>[] = [];
  const seen = new Set<string>();

  for (const run of runs) {
    const datasetId = run.defaultDatasetId;
    if (!datasetId) continue;

    const itemsUrl = new URL(`${APIFY_BASE}/datasets/${datasetId}/items`);
    itemsUrl.searchParams.set("token", token);
    itemsUrl.searchParams.set("format", "json");
    itemsUrl.searchParams.set("limit", String(limit));

    const itemsResponse = await fetch(itemsUrl, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!itemsResponse.ok) continue;

    const items = (await itemsResponse.json()) as Record<string, unknown>[];
    for (const item of items) {
      const key = String(item.postId ?? item.id ?? JSON.stringify(item).slice(0, 80));
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }

    if (merged.length >= limit) break;
  }

  return merged.slice(0, limit);
}
