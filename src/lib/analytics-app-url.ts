const DEFAULT_ANALYTICS_APP_URL =
  "http://localhost:3004";

/** Base URL for the analytics-only app (separate deployment). */
export function getAnalyticsAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_ANALYTICS_URL ??
    process.env.ANALYTICS_APP_URL ??
    process.env.NEXT_PUBLIC_ANALYTICS_APP_URL;

  if (raw) return raw.replace(/\/$/, "");

  return DEFAULT_ANALYTICS_APP_URL;
}

/** Same-origin paths middleware redirects to the analytics app. */
export function isAnalyticsShellPath(pathname: string): boolean {
  return pathname === "/methodology" || pathname.startsWith("/reports");
}

export function analyticsHref(path: string, baseUrl?: string): string {
  const root = baseUrl ?? getAnalyticsAppUrl();
  if (path === "/") return root;
  return `${root}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isExternalAnalyticsUrl(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}
