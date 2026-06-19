import { CEO, WIKIPEDIA } from "@/lib/client";

export type DemoArticle = {
  title: string;
  project: string;
  url: string;
  wikitext: string;
  extract: string;
  byteLength: number;
  lastEdited: string;
  referenceCount: number;
  wordCount: number;
  maintenanceFlags: {
    template: string;
    label: string;
    severity: "high" | "medium" | "low";
    description: string;
    action: string;
  }[];
};

function generatePageviews(days = 90): { date: string; views: number }[] {
  const series: { date: string; views: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split("T")[0];
    const base = 1200 + Math.sin(i / 7) * 200;
    const spike = i % 23 === 0 ? 2800 : 0;
    series.push({ date, views: Math.round(base + spike + (i % 5) * 40) });
  }
  return series;
}

const CORPORATE_ARTICLE: DemoArticle = {
  title: "Best Pharma Co.",
  project: "en.wikipedia.org",
  url: WIKIPEDIA.corporateUrl,
  wikitext: "{{more citations needed}}\n{{advert}}\n",
  extract: `Best Pharma Co. is a fictional multinational pharmaceutical and biotechnology company headquartered in Hartford, Connecticut. Founded in 1987, the company develops medicines and vaccines in oncology, immunology, vaccines, and rare diseases.

Best Pharma Co. is known in this demo environment for investigational programs including BPC-401, a PD-L1 inhibitor studied in non-small cell lung cancer, and BPC-227, an orphan drug candidate in a rare metabolic disorder. The company operates research sites in the United States, United Kingdom, and Singapore.

In 2026, the company reported first-quarter revenue of $14.2 billion in demo financial disclosures. Best Pharma Co. publishes an annual ESG and sustainability report covering clinical trial diversity, carbon reduction targets, and community health partnerships.

The Best Care Access program provides therapy initiation support for eligible patients in multiple countries while insurance coverage is confirmed.`,
  byteLength: 18420,
  lastEdited: "2026-03-12T14:22:00Z",
  referenceCount: 28,
  wordCount: 142,
  maintenanceFlags: [
    {
      template: "more citations needed",
      label: "Needs additional citations",
      severity: "high",
      description:
        "Several paragraphs lack inline citations to independent, third-party sources.",
      action:
        "Add footnotes to trade press, regulatory filings, and peer-reviewed literature for material claims.",
    },
    {
      template: "advert",
      label: "May read like an advertisement",
      severity: "medium",
      description:
        "Promotional language may outweigh neutral, encyclopedic tone.",
      action:
        "Rewrite product and program descriptions in neutral voice; remove superlatives.",
    },
  ],
};

const CEO_ARTICLE: DemoArticle = {
  title: "Elena Marshall (executive)",
  project: "en.wikipedia.org",
  url: CEO.wikipediaUrl,
  wikitext: "{{BLP sources}}\n",
  extract: `Elena Marshall is a fictional American business executive serving as chairman and chief executive officer of Best Pharma Co., a demo pharmaceutical company.

Marshall joined Best Pharma in 2004 and held leadership roles in global medical affairs and international markets before becoming CEO in 2019. She is credited in demo materials with expanding oncology and vaccine portfolios and launching the Best Care Access patient support initiative.

Marshall frequently speaks on patient access, clinical trial diversity, and responsible use of artificial intelligence in drug discovery. She serves on the board of a fictional global health nonprofit in this demonstration environment.

Marshall earned an M.D. from a fictional university program and an M.B.A. from Hartford Business School in this demo profile.`,
  byteLength: 9820,
  lastEdited: "2026-02-28T09:10:00Z",
  referenceCount: 14,
  wordCount: 118,
  maintenanceFlags: [
    {
      template: "BLP sources",
      label: "Biography needs better sources",
      severity: "high",
      description:
        "Biographies of living people require high-quality independent references.",
      action:
        "Replace primary company sources with major press, conference coverage, or regulatory filings.",
    },
  ],
};

export function isDemoWikipediaQuery(raw: string): boolean {
  const q = raw.toLowerCase();
  return (
    q.includes("best_pharma") ||
    q.includes("best-pharma") ||
    q.includes("elena_marshall") ||
    q.includes("elena-marshall") ||
    raw === WIKIPEDIA.corporateUrl ||
    raw === CEO.wikipediaUrl ||
    q.includes(WIKIPEDIA.corporateTitle.toLowerCase()) ||
    q.includes("elena marshall")
  );
}

export function getDemoArticle(raw: string): DemoArticle | null {
  const q = raw.toLowerCase();
  if (
    q.includes("elena") ||
    q.includes("marshall") ||
    raw === CEO.wikipediaUrl
  ) {
    return CEO_ARTICLE;
  }
  if (
    q.includes("best") ||
    q.includes("pharma") ||
    raw === WIKIPEDIA.corporateUrl
  ) {
    return CORPORATE_ARTICLE;
  }
  return CORPORATE_ARTICLE;
}

export function getDemoPageviews(): { date: string; views: number }[] {
  return generatePageviews(90);
}
