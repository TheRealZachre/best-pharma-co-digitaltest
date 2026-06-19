/** User-facing labels — never expose internal provider names like "apify". */
export function formatDisplayProvider(provider?: string | null): string | undefined {
  if (!provider) return undefined;
  const normalized = provider.toLowerCase();
  if (normalized === "apify") return "live sync";
  return provider;
}

export function formatDisplaySource(source?: string | null): string {
  if (!source) return "";
  const normalized = source.toLowerCase();
  if (normalized === "apify") return "live";
  if (normalized === "youtube-api") return "YouTube API";
  if (normalized === "seed") return "demo data";
  return source;
}

export function sanitizeUserFacingText(text: string): string {
  return text
    .replace(/\bApify\b/g, "live sync")
    .replace(/\bapify\b/g, "live sync")
    .replace(/\(Apify\)/gi, "")
    .replace(/APIFY_TOKEN/g, "sync credentials");
}
