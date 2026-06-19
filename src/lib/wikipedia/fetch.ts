/**
 * Wikipedia data layer — TypeScript port of wiki-auditor/app/wikipedia.py
 * Uses the public Wikimedia APIs (no auth required).
 */

const USER_AGENT =
  "BestPharmaCoWikiAnalytics/1.0 (demo tool; fictional company)";

const PAGEVIEWS_BASE =
  "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article";

const DEFAULT_PROJECT = "en.wikipedia.org";

// ── Maintenance templates ─────────────────────────────────────────
export interface MaintenanceFlag {
  template: string;
  label: string;
  severity: "high" | "medium" | "low";
  description: string;
  action: string;
}

const MAINTENANCE_TEMPLATES: Record<
  string,
  Omit<MaintenanceFlag, "template">
> = {
  unreferenced: {
    label: "No references at all",
    severity: "high",
    description:
      "This article does not cite any sources. Every claim needs to be verifiable through a reliable, published source.",
    action:
      "Add inline citations (<ref> tags) to support factual statements, and populate a References section.",
  },
  "more citations needed": {
    label: "Needs additional citations",
    severity: "high",
    description:
      "Many statements are unsupported. Wikipedia's verifiability policy requires all significant claims to be backed by reliable sources.",
    action:
      "Identify unsourced paragraphs and add footnotes to published, third-party sources.",
  },
  refimprove: {
    label: "Needs additional citations",
    severity: "high",
    description:
      "Many statements are unsupported. Wikipedia's verifiability policy requires all significant claims to be backed by reliable sources.",
    action:
      "Identify unsourced paragraphs and add footnotes to published, third-party sources.",
  },
  "citation needed": {
    label: "Specific claims lack a citation",
    severity: "medium",
    description:
      "One or more specific statements have been tagged as needing a source. Readers cannot verify these claims without a reference.",
    action:
      "Find a reliable published source for each flagged claim and add an inline citation.",
  },
  "original research": {
    label: "May contain original research",
    severity: "high",
    description:
      "Wikipedia only summarises what reliable sources say. Content introducing new arguments not found in published sources violates policy.",
    action:
      "Remove or rewrite passages that present unpublished analysis; replace with cited summaries.",
  },
  pov: {
    label: "Neutrality is disputed",
    severity: "high",
    description:
      "The article may not fairly represent all significant viewpoints. Wikipedia requires balanced, impartial coverage.",
    action:
      "Identify one-sided language, add sourced alternative views, and remove promotional framing.",
  },
  neutrality: {
    label: "Neutrality is disputed",
    severity: "high",
    description:
      "The article may not fairly represent all significant viewpoints. Wikipedia requires balanced, impartial coverage.",
    action:
      "Identify one-sided language, add sourced alternative views, and remove promotional framing.",
  },
  advert: {
    label: "Reads like an advertisement",
    severity: "high",
    description:
      "The article is written in a promotional tone rather than an encyclopedic one.",
    action:
      "Remove superlatives and promotional phrasing; add critical or neutral third-party coverage.",
  },
  tone: {
    label: "Tone is not encyclopedic",
    severity: "medium",
    description:
      "The writing style does not match Wikipedia's formal, neutral register.",
    action:
      "Rewrite affected sections in a neutral, third-person encyclopedic style.",
  },
  peacock: {
    label: "Contains promotional language",
    severity: "medium",
    description:
      "The article uses vague, impressive-sounding adjectives (e.g. 'leading', 'renowned') that praise without evidence.",
    action:
      "Replace subjective praise with verifiable facts and attributed quotes from independent sources.",
  },
  weasel: {
    label: "Contains vague wording",
    severity: "medium",
    description:
      "The article uses vague attributions like 'some say' or 'many believe' without naming who says it.",
    action:
      "Replace vague attributions with specific, cited sources, or remove the unsupported claim.",
  },
  cleanup: {
    label: "Needs general cleanup",
    severity: "medium",
    description:
      "An editor flagged the article as needing improvement in writing quality, formatting, or organisation.",
    action:
      "Review for grammar, structure, consistent formatting, and compliance with the Wikipedia Manual of Style.",
  },
  "cleanup rewrite": {
    label: "Needs a significant rewrite",
    severity: "medium",
    description:
      "The article's quality is poor enough that it needs to be substantially rewritten.",
    action:
      "Rewrite the article using the existing content as a starting point, following Wikipedia's content policies.",
  },
  confusing: {
    label: "May be confusing or unclear",
    severity: "medium",
    description:
      "Parts of the article are difficult to understand due to poor explanation or disorganised structure.",
    action:
      "Simplify technical language, add context for specialist terms, and improve paragraph flow.",
  },
  update: {
    label: "Information may be out of date",
    severity: "medium",
    description:
      "Some content is likely no longer accurate due to events since it was last updated.",
    action:
      "Review each section for currency, update outdated statistics, and add recent reliable sources.",
  },
  "expand section": {
    label: "A section is too brief",
    severity: "low",
    description:
      "One or more sections contain only a sentence or two and need further development.",
    action: "Research and add well-sourced content to the underdeveloped sections.",
  },
  stub: {
    label: "Article is a stub",
    severity: "low",
    description:
      "The article is very short and covers the subject only superficially.",
    action:
      "Add well-sourced sections covering the subject's history, significance, and key details.",
  },
  orphan: {
    label: "Few other articles link here",
    severity: "low",
    description:
      "Fewer than three other articles link to this page, making it hard for readers to discover.",
    action:
      "Find related articles where a link to this page would be appropriate and add wikilinks.",
  },
  notability: {
    label: "Subject's notability is questioned",
    severity: "high",
    description:
      "An editor challenged whether the subject meets Wikipedia's notability standards.",
    action:
      "Add citations to multiple independent, reliable sources that cover the subject in depth.",
  },
  "dead link": {
    label: "Contains dead reference links",
    severity: "medium",
    description:
      "One or more external links no longer work, leaving cited claims without a verifiable source.",
    action:
      "Use the Wayback Machine to find archived versions, or replace with alternative reliable sources.",
  },
  "primary sources": {
    label: "Relies too heavily on primary sources",
    severity: "medium",
    description:
      "The article draws mainly from press releases, official websites, or corporate filings.",
    action:
      "Add citations from independent journalists, analysts, or academics.",
  },
  "one source": {
    label: "Relies on a single source",
    severity: "medium",
    description:
      "Nearly all content is sourced from a single reference, raising concerns about balance.",
    action:
      "Diversify sourcing by finding and citing additional independent, reliable publications.",
  },
  "more footnotes": {
    label: "Citations are not inline",
    severity: "medium",
    description:
      "The article has a bibliography but lacks inline footnotes, making it impossible to verify which source supports which claim.",
    action:
      "Convert general references to inline <ref> citations placed after the statements they support.",
  },
};

function normaliseTemplateName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function extractMaintenanceFlags(wikitext: string): MaintenanceFlag[] {
  const found = new Map<string, MaintenanceFlag>();
  const re = /\{\{\s*([^|{}\n]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(wikitext)) !== null) {
    const key = normaliseTemplateName(m[1]);
    if (MAINTENANCE_TEMPLATES[key] && !found.has(key)) {
      found.set(key, {
        template: m[1].trim(),
        ...MAINTENANCE_TEMPLATES[key],
      });
    }
  }
  const order = { high: 0, medium: 1, low: 2 };
  return [...found.values()].sort(
    (a, b) => order[a.severity] - order[b.severity]
  );
}

function countReferences(wikitext: string) {
  return (wikitext.match(/<ref[\s>/]/gi) ?? []).length;
}

function parseInput(raw: string): { title: string; project: string } {
  const s = raw.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) {
    const url = new URL(s);
    const project = url.hostname || DEFAULT_PROJECT;
    const path = url.pathname;
    const title = path.includes("/wiki/")
      ? decodeURIComponent(path.split("/wiki/")[1]).replace(/_/g, " ")
      : path.replace(/^\//, "");
    return { title: title || s, project };
  }
  return { title: s, project: DEFAULT_PROJECT };
}

// ── Network calls ─────────────────────────────────────────────────
async function wikiFetch(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    // Cloudflare Workers: no cache for dynamic data
    cache: "no-store",
  });
  return res;
}

export async function fetchArticle(raw: string) {
  const { title, project } = parseInput(raw);
  const api = `https://${project}/w/api.php`;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "revisions|extracts|info",
    titles: title,
    rvprop: "content|timestamp",
    rvslots: "main",
    explaintext: "1",
    exsectionformat: "plain",
    inprop: "url",
    redirects: "1",
    formatversion: "2",
  });

  let res = await wikiFetch(`${api}?${params}`);
  // Simple retry on 429
  if (res.status === 429) {
    const wait = parseInt(res.headers.get("retry-after") ?? "3", 10) * 1000;
    await new Promise((r) => setTimeout(r, wait));
    res = await wikiFetch(`${api}?${params}`);
  }
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);

  const data = await res.json();
  const pages: Record<string, unknown>[] = data?.query?.pages ?? [];
  if (!pages.length) return null;

  const page = pages[0] as Record<string, unknown>;
  if (page.missing) return null;

  const revisions = (page.revisions as Record<string, unknown>[] | undefined) ?? [];
  const rev = revisions[0] as Record<string, unknown> | undefined;
  const wikitext =
    (rev?.slots as Record<string, Record<string, string>> | undefined)?.main
      ?.content ?? "";
  const lastEdited = (rev?.timestamp as string) ?? null;
  const extract = (page.extract as string) ?? "";

  return {
    title: (page.title as string) ?? title,
    project,
    url:
      (page.fullurl as string) ??
      `https://${project}/wiki/${encodeURIComponent(title)}`,
    wikitext,
    extract,
    byteLength: (page.length as number) ?? 0,
    lastEdited,
    referenceCount: countReferences(wikitext),
    wordCount: extract.split(/\s+/).filter(Boolean).length,
    maintenanceFlags: extractMaintenanceFlags(wikitext),
  };
}

export async function fetchPageviews(
  title: string,
  project: string,
  startDate: string,
  endDate: string
) {
  const encoded = encodeURIComponent(title.replace(/ /g, "_"));
  const start = startDate.replace(/-/g, "");
  const end = endDate.replace(/-/g, "");
  const url = `${PAGEVIEWS_BASE}/${project}/all-access/user/${encoded}/daily/${start}/${end}`;

  const res = await wikiFetch(url);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Pageviews API error: ${res.status}`);

  const data = await res.json();
  return (data.items ?? []).map((item: Record<string, unknown>) => {
    const ts = String(item.timestamp ?? "").slice(0, 8);
    const date = ts
      ? `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`
      : "";
    return { date, views: (item.views as number) ?? 0 };
  }).filter((p: { date: string }) => p.date);
}

export function summarise(
  article: Awaited<ReturnType<typeof fetchArticle>>,
  series: { date: string; views: number }[]
) {
  const total = series.reduce((s, p) => s + p.views, 0);
  const avg = series.length ? Math.round(total / series.length) : 0;
  const peak = series.length ? Math.max(...series.map((p) => p.views)) : 0;
  return {
    total_views: total,
    avg_daily_views: avg,
    peak_views: peak,
    reference_count: article?.referenceCount ?? 0,
    word_count: article?.wordCount ?? 0,
    byte_length: article?.byteLength ?? 0,
    flag_count: article?.maintenanceFlags.length ?? 0,
    last_edited: article?.lastEdited ?? null,
  };
}
