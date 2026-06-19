export async function runApifyActor<T = Record<string, unknown>>(
  actorId: string,
  input: Record<string, unknown>,
  token: string,
  timeoutMs = 180_000
): Promise<T[]> {
  const url = new URL(
    `https://api.apify.com/v2/acts/${actorId.replace("/", "~")}/run-sync-get-dataset-items`
  );
  url.searchParams.set("token", token);
  url.searchParams.set("format", "json");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const body = (await response.json()) as T[] | { error?: { message?: string } };

  if (!response.ok) {
    const message =
      !Array.isArray(body) && body.error?.message
        ? body.error.message
        : `Apify request failed (${response.status})`;
    throw new Error(message);
  }

  if (!Array.isArray(body)) {
    const message =
      body.error?.message ?? "Unexpected Apify response from Apify";
    throw new Error(message);
  }

  return body;
}
