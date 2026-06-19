import "server-only";

import pptxgen from "pptxgenjs";
import { resolvePostImageData } from "./export-pptx-images";
import {
  CHART_COLORS,
  comparisonTitle,
  engagementRateDelta,
  formatDeltaLabel,
  shortChartLabel,
  trendPointsFromMonths,
  trendPointsFromWeeks,
} from "./export-charts";
import type {
  MonthSummaryRow,
  PeriodComparisonExport,
  ReportPptxPayload,
  WeekSummaryRow,
} from "./export-pptx-types";
import type { BeatPerformance } from "./narrative/types";
import type {
  CategoryPerformance,
  CompetitorBrand,
  ReportSummary,
  SocialPost,
} from "./types";
import { PLATFORM_NAME } from "./company";
import {
  clickThroughRate,
  engagementRate,
  formatCurrency,
  formatNumber,
  formatPercent,
  rankByEngagement,
} from "./metrics";

export type {
  MonthSummaryRow,
  ReportPptxPayload,
  ReportTimeframeExport,
  WeekSummaryRow,
} from "./export-pptx-types";

const C = {
  stage: "141319",
  ink: "181820",
  indigo: "7C78FF",
  muted: "6F6E7A",
  white: "FFFFFF",
  paper: "FAF7F1",
  emerald: "059669",
  rose: "E11D48",
};

function tableCell(text: string, header = false): pptxgen.TableCell {
  return header
    ? { text, options: { bold: true, fill: { color: C.stage }, color: C.white } }
    : { text };
}

function tableRow(...cells: string[]): pptxgen.TableRow {
  return cells.map((text) => ({ text }));
}

function truncate(text: string, max = 120): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max - 1)}…`;
}

function addSlideHeader(slide: pptxgen.Slide, title: string) {
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.65,
    fill: { color: C.stage },
  });
  slide.addText(title, {
    x: 0.5,
    y: 0.15,
    w: 12,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: C.white,
    fontFace: "Arial",
  });
}

function addTitleSlide(pptx: pptxgen, data: ReportPptxPayload) {
  const slide = pptx.addSlide();
  slide.background = { color: C.stage };

  slide.addText(data.brandName, {
    x: 0.75,
    y: 1.4,
    w: 11,
    h: 0.5,
    fontSize: 14,
    color: C.indigo,
    fontFace: "Arial",
    charSpacing: 3,
  });

  slide.addText(data.title, {
    x: 0.75,
    y: 2,
    w: 11,
    h: 1,
    fontSize: 36,
    bold: true,
    color: C.white,
    fontFace: "Arial",
  });

  slide.addText(data.subtitle, {
    x: 0.75,
    y: 3.1,
    w: 11,
    h: 0.6,
    fontSize: 16,
    color: C.muted,
    fontFace: "Arial",
  });

  slide.addText(`Generated ${new Date().toLocaleString()} · ${PLATFORM_NAME}`, {
    x: 0.75,
    y: 6.8,
    w: 11,
    h: 0.4,
    fontSize: 10,
    color: C.muted,
    fontFace: "Arial",
  });
}

function addKpiSlide(pptx: pptxgen, summary: ReportSummary) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addSlideHeader(slide, "Performance Summary");

  const rows: pptxgen.TableRow[] = [
    [tableCell("Metric", true), tableCell("Value", true)],
    tableRow("Total Posts", String(summary.totalPosts)),
    tableRow("Organic / Paid", `${summary.organicPosts} / ${summary.paidPosts}`),
    tableRow("Avg. Engagement Rate", formatPercent(summary.avgEngagementRate)),
    tableRow("Avg. CTR", formatPercent(summary.avgCTR)),
    tableRow("Total Reach", formatNumber(summary.totalReach)),
    tableRow("Total Impressions", formatNumber(summary.totalImpressions)),
    tableRow("Total Spend", formatCurrency(summary.totalSpend)),
    tableRow("Audience Growth", `+${formatNumber(summary.audienceGrowth)} followers`),
  ];

  slide.addTable(rows, {
    x: 0.75,
    y: 1.1,
    w: 11.5,
    colW: [4.5, 7],
    fontSize: 12,
    fontFace: "Arial",
    color: C.ink,
    border: { type: "solid", color: "E5E7EB", pt: 0.5 },
    autoPage: false,
  });
}

function addEngagementBarChart(
  slide: pptxgen.Slide,
  pptx: pptxgen,
  title: string,
  labels: string[],
  values: number[],
  color: string,
  layout: { x: number; y: number; w: number; h: number },
  valueFormat = "0.0"
) {
  if (labels.length === 0) return;

  slide.addChart(
    pptx.ChartType.bar,
    [
      {
        name: title,
        labels: labels.map((label) => shortChartLabel(label, 18)),
        values,
      },
    ],
    {
      ...layout,
      barDir: "col",
      showTitle: true,
      title,
      titleFontSize: 11,
      titleColor: C.ink,
      chartColors: [color],
      showLegend: false,
      showValue: true,
      dataLabelPosition: "outEnd",
      dataLabelColor: C.ink,
      dataLabelFormatCode: valueFormat,
      catAxisLabelColor: C.muted,
      valAxisLabelColor: C.muted,
      valGridLine: { color: CHART_COLORS.grid, size: 0.5 },
      catGridLine: { style: "none" },
      chartArea: { fill: { color: C.white }, roundedCorners: true },
    }
  );
}

function addPeriodComparisonSlide(
  pptx: pptxgen,
  timeframe: ReportPptxPayload["timeframe"],
  current: PeriodComparisonExport,
  prior: PeriodComparisonExport
) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addSlideHeader(slide, comparisonTitle(timeframe));

  const delta = engagementRateDelta(current, prior);
  const deltaLabel = formatDeltaLabel(delta);
  const positive = delta === null || delta >= 0;

  slide.addText(deltaLabel, {
    x: 0.75,
    y: 0.85,
    w: 11.5,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: positive ? C.emerald : C.rose,
    fontFace: "Arial",
  });

  addEngagementBarChart(
    slide,
    pptx,
    "Engagement rate (%)",
    [current.label, prior.label],
    [current.avgEngagementRate, prior.avgEngagementRate],
    CHART_COLORS.current,
    { x: 0.5, y: 1.25, w: 5.8, h: 2.8 }
  );

  addEngagementBarChart(
    slide,
    pptx,
    "Post volume",
    [current.label, prior.label],
    [current.postCount, prior.postCount],
    CHART_COLORS.prior,
    { x: 6.7, y: 1.25, w: 5.8, h: 2.8 },
    "0"
  );

  const rows: pptxgen.TableRow[] = [
    [
      tableCell("Period", true),
      tableCell("Date range", true),
      tableCell("Posts", true),
      tableCell("Avg. ER", true),
      tableCell("Score", true),
    ],
    tableRow(
      current.label,
      current.dateRange,
      String(current.postCount),
      formatPercent(current.avgEngagementRate),
      String(current.avgEngagementScore)
    ),
    tableRow(
      prior.label,
      prior.dateRange,
      String(prior.postCount),
      formatPercent(prior.avgEngagementRate),
      String(prior.avgEngagementScore)
    ),
  ];

  slide.addTable(rows, {
    x: 0.75,
    y: 4.35,
    w: 11.5,
    colW: [2.2, 3.5, 1.5, 2, 2.3],
    fontSize: 10,
    fontFace: "Arial",
    color: C.ink,
    border: { type: "solid", color: "E5E7EB", pt: 0.5 },
  });
}

function addTrendSlide(
  pptx: pptxgen,
  title: string,
  subtitle: string,
  weeks: WeekSummaryRow[],
  color: string = CHART_COLORS.current
) {
  const points = trendPointsFromWeeks(weeks);
  if (points.length === 0) return;

  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addSlideHeader(slide, title);

  slide.addText(subtitle, {
    x: 0.75,
    y: 0.85,
    w: 11.5,
    h: 0.35,
    fontSize: 11,
    color: C.muted,
    fontFace: "Arial",
  });

  addEngagementBarChart(
    slide,
    pptx,
    "Engagement rate by period (%)",
    points.map((p) => p.label),
    points.map((p) => p.engagementRate),
    color,
    { x: 0.5, y: 1.25, w: 7.5, h: 3.2 }
  );

  addEngagementBarChart(
    slide,
    pptx,
    "Post volume by period",
    points.map((p) => p.label),
    points.map((p) => p.postCount),
    CHART_COLORS.prior,
    { x: 8.2, y: 1.25, w: 4.3, h: 3.2 },
    "0"
  );

  const rows: pptxgen.TableRow[] = [
    [
      tableCell("Period", true),
      tableCell("Posts", true),
      tableCell("Avg. ER", true),
      tableCell("Score", true),
    ],
    ...points.map((p) =>
      tableRow(
        p.label,
        String(p.postCount),
        formatPercent(p.engagementRate),
        String(p.engagementScore)
      )
    ),
  ];

  slide.addTable(rows, {
    x: 0.75,
    y: 4.65,
    w: 11.5,
    colW: [4.5, 2, 2.5, 2.5],
    fontSize: 10,
    fontFace: "Arial",
    color: C.ink,
    border: { type: "solid", color: "E5E7EB", pt: 0.5 },
  });
}

function addQuarterTrendSlide(
  pptx: pptxgen,
  months: MonthSummaryRow[]
) {
  const points = trendPointsFromMonths(months);
  if (points.length === 0) return;

  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addSlideHeader(slide, "Quarterly Month Trend");

  slide.addText(
    "Month-over-month progress across the quarter — engagement rate, volume, and score",
    {
      x: 0.75,
      y: 0.85,
      w: 11.5,
      h: 0.35,
      fontSize: 11,
      color: C.muted,
      fontFace: "Arial",
    }
  );

  addEngagementBarChart(
    slide,
    pptx,
    "Engagement rate by month (%)",
    points.map((p) => p.label),
    points.map((p) => p.engagementRate),
    CHART_COLORS.current,
    { x: 0.5, y: 1.25, w: 7.5, h: 3.2 }
  );

  addEngagementBarChart(
    slide,
    pptx,
    "Engagement score by month",
    points.map((p) => p.label),
    points.map((p) => p.engagementScore),
    CHART_COLORS.accent,
    { x: 8.2, y: 1.25, w: 4.3, h: 3.2 },
    "0"
  );

  const rows: pptxgen.TableRow[] = [
    [
      tableCell("Month", true),
      tableCell("Posts", true),
      tableCell("Avg. ER", true),
      tableCell("Score", true),
    ],
    ...points.map((p) =>
      tableRow(
        p.label,
        String(p.postCount),
        formatPercent(p.engagementRate),
        String(p.engagementScore)
      )
    ),
  ];

  slide.addTable(rows, {
    x: 0.75,
    y: 4.65,
    w: 11.5,
    colW: [4.5, 2, 2.5, 2.5],
    fontSize: 10,
    fontFace: "Arial",
    color: C.ink,
    border: { type: "solid", color: "E5E7EB", pt: 0.5 },
  });
}

function addBeatSlide(pptx: pptxgen, beats: BeatPerformance[]) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addSlideHeader(slide, "Story Beat Performance");

  const rows: pptxgen.TableRow[] = [
    [
      tableCell("Story Beat", true),
      tableCell("Posts", true),
      tableCell("Avg. ER", true),
      tableCell("Reach", true),
    ],
    ...beats.map((b) =>
      tableRow(
        b.beat,
        String(b.postCount),
        formatPercent(b.avgEngagementRate),
        formatNumber(b.totalReach)
      )
    ),
  ];

  slide.addTable(rows, {
    x: 0.75,
    y: 1.1,
    w: 11.5,
    colW: [4.5, 1.5, 2, 3.5],
    fontSize: 11,
    fontFace: "Arial",
    color: C.ink,
    border: { type: "solid", color: "E5E7EB", pt: 0.5 },
  });
}

function addCategorySlide(pptx: pptxgen, categories: CategoryPerformance[]) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addSlideHeader(slide, "Content Category Performance");

  const rows: pptxgen.TableRow[] = [
    [
      tableCell("Category", true),
      tableCell("Posts", true),
      tableCell("Avg. ER", true),
      tableCell("Reach", true),
    ],
    ...categories.map((c) =>
      tableRow(
        c.category,
        String(c.postCount),
        formatPercent(c.avgEngagementRate),
        formatNumber(c.totalReach)
      )
    ),
  ];

  slide.addTable(rows, {
    x: 0.75,
    y: 1.1,
    w: 11.5,
    colW: [4, 1.5, 2, 4],
    fontSize: 11,
    fontFace: "Arial",
    color: C.ink,
    border: { type: "solid", color: "E5E7EB", pt: 0.5 },
  });
}

function addInsightsSlide(
  pptx: pptxgen,
  insights: { worked: string[]; didNot: string[] }
) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addSlideHeader(slide, "What Worked / What Didn't");

  const workedBullets = insights.worked.map((item) => ({
    text: item,
    options: { bullet: true, breakLine: true },
  }));
  const didNotBullets = insights.didNot.map((item) => ({
    text: item,
    options: { bullet: true, breakLine: true },
  }));

  slide.addText("What worked", {
    x: 0.75,
    y: 1,
    w: 5.5,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: C.emerald,
    fontFace: "Arial",
  });
  slide.addText(workedBullets.length ? workedBullets : [{ text: "—" }], {
    x: 0.75,
    y: 1.45,
    w: 5.5,
    h: 5,
    fontSize: 11,
    color: C.ink,
    fontFace: "Arial",
    valign: "top",
  });

  slide.addText("What didn't", {
    x: 6.75,
    y: 1,
    w: 5.5,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: C.rose,
    fontFace: "Arial",
  });
  slide.addText(didNotBullets.length ? didNotBullets : [{ text: "—" }], {
    x: 6.75,
    y: 1.45,
    w: 5.5,
    h: 5,
    fontSize: 11,
    color: C.ink,
    fontFace: "Arial",
    valign: "top",
  });
}

function addRecommendationsSlide(pptx: pptxgen, recommendations: string[]) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addSlideHeader(slide, "Strategic Recommendations");

  slide.addText(
    recommendations.map((rec, i) => ({
      text: `${i + 1}. ${rec}`,
      options: { bullet: false, breakLine: true, paraSpaceAfter: 8 },
    })),
    {
      x: 0.75,
      y: 1.2,
      w: 11.5,
      h: 5.5,
      fontSize: 12,
      color: C.ink,
      fontFace: "Arial",
      valign: "top",
    }
  );
}

function addCompetitorSlide(
  pptx: pptxgen,
  competitors: CompetitorBrand[],
  brandEr: number,
  brandName: string
) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addSlideHeader(slide, "Competitor Benchmark");

  const rows: pptxgen.TableRow[] = [
    [
      tableCell("Brand", true),
      tableCell("Followers", true),
      tableCell("Avg. ER", true),
      tableCell("Posts / Week", true),
    ],
    [
      { text: brandName, options: { bold: true, fill: { color: "EEF2FF" } } },
      { text: "—" },
      { text: formatPercent(brandEr) },
      { text: "—" },
    ],
    ...competitors.map((c) =>
      tableRow(
        c.name,
        formatNumber(c.followers),
        formatPercent(c.avgEngagementRate),
        String(c.avgPostsPerWeek)
      )
    ),
  ];

  slide.addTable(rows, {
    x: 0.75,
    y: 1.1,
    w: 11.5,
    colW: [3.5, 2.5, 2.5, 3],
    fontSize: 11,
    fontFace: "Arial",
    color: C.ink,
    border: { type: "solid", color: "E5E7EB", pt: 0.5 },
  });
}

function addPostGalleryIntroSlide(pptx: pptxgen, postCount: number) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addSlideHeader(slide, "Post Gallery");

  slide.addText(`${postCount} posts`, {
    x: 0.75,
    y: 2.2,
    w: 11.5,
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: C.ink,
    fontFace: "Arial",
  });

  slide.addText(
    "Each post includes its creative and full performance analytics — engagement rate, CTR, reach, impressions, and interactions.",
    {
      x: 0.75,
      y: 3.1,
      w: 11,
      h: 1.2,
      fontSize: 14,
      color: C.muted,
      fontFace: "Arial",
      valign: "top",
    }
  );
}

function addSinglePostSlide(
  pptx: pptxgen,
  post: SocialPost,
  index: number,
  total: number,
  imageData: string | null
) {
  const er = engagementRate(post.metrics);
  const ctr = clickThroughRate(post.metrics);
  const engagements =
    post.metrics.likes +
    post.metrics.comments +
    post.metrics.shares +
    post.metrics.saves;
  const dateLabel = new Date(post.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addSlideHeader(slide, `Post ${index} of ${total}`);

  slide.addShape("rect", {
    x: 0.5,
    y: 0.85,
    w: 5.6,
    h: 6.15,
    fill: { color: "FFFFFF" },
    line: { color: "E5E7EB", pt: 1 },
  });

  if (imageData) {
    slide.addImage({
      data: imageData,
      x: 0.55,
      y: 0.9,
      w: 5.5,
      h: 6.05,
      sizing: { type: "contain", w: 5.5, h: 6.05 },
      altText: truncate(post.caption, 80),
    });
  } else {
    slide.addText("Image unavailable", {
      x: 0.55,
      y: 3.4,
      w: 5.5,
      h: 0.5,
      fontSize: 12,
      color: C.muted,
      fontFace: "Arial",
      align: "center",
    });
  }

  const metaX = 6.35;
  slide.addText(
    `${post.platform.toUpperCase()} · ${post.type} · ${dateLabel}`,
    {
      x: metaX,
      y: 0.95,
      w: 6.4,
      h: 0.35,
      fontSize: 11,
      bold: true,
      color: C.indigo,
      fontFace: "Arial",
      charSpacing: 0.5,
    }
  );

  slide.addText(`${post.storyBeat} · ${post.category}`, {
    x: metaX,
    y: 1.35,
    w: 6.4,
    h: 0.35,
    fontSize: 12,
    color: C.ink,
    fontFace: "Arial",
  });

  slide.addText(truncate(post.caption, 220), {
    x: metaX,
    y: 1.85,
    w: 6.4,
    h: 1.35,
    fontSize: 11,
    color: C.muted,
    fontFace: "Arial",
    valign: "top",
  });

  const metricRows: pptxgen.TableRow[] = [
    [tableCell("Metric", true), tableCell("Value", true)],
    tableRow("Engagement Rate", formatPercent(er)),
    tableRow("CTR", formatPercent(ctr)),
    tableRow("Reach", formatNumber(post.metrics.reach)),
    tableRow("Impressions", formatNumber(post.metrics.impressions)),
    tableRow("Total Interactions", formatNumber(engagements)),
    tableRow(
      "Likes / Comments",
      `${formatNumber(post.metrics.likes)} / ${formatNumber(post.metrics.comments)}`
    ),
    tableRow(
      "Shares / Saves",
      `${formatNumber(post.metrics.shares)} / ${formatNumber(post.metrics.saves)}`
    ),
    tableRow("Clicks", formatNumber(post.metrics.clicks)),
  ];

  if (post.metrics.spend && post.metrics.spend > 0) {
    metricRows.push(tableRow("Spend", formatCurrency(post.metrics.spend)));
  }

  slide.addTable(metricRows, {
    x: metaX,
    y: 3.35,
    w: 6.4,
    colW: [3.2, 3.2],
    fontSize: 11,
    fontFace: "Arial",
    color: C.ink,
    border: { type: "solid", color: "E5E7EB", pt: 0.5 },
    autoPage: false,
  });
}

export async function generatePowerPointBuffer(
  data: ReportPptxPayload,
  options?: {
    onProgress?: (message: string) => void;
    imageOrigin?: string;
  }
): Promise<Buffer> {
  const pptx = await buildPresentation(
    data,
    options?.onProgress,
    options?.imageOrigin
  );
  const output = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(output as ArrayBuffer);
}

async function buildPresentation(
  data: ReportPptxPayload,
  onProgress?: (message: string) => void,
  imageOrigin?: string
): Promise<pptxgen> {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = PLATFORM_NAME;
  pptx.title = data.title;
  pptx.subject = data.subtitle;

  addTitleSlide(pptx, data);
  addKpiSlide(pptx, data.summary);

  if (data.currentPeriod && data.priorPeriod) {
    addPeriodComparisonSlide(
      pptx,
      data.timeframe,
      data.currentPeriod,
      data.priorPeriod
    );
  } else if (data.currentMonth && data.priorMonth) {
    addPeriodComparisonSlide(pptx, "monthly", {
      label: data.currentMonth.label,
      dateRange: data.currentMonth.dateRange ?? data.currentMonth.label,
      postCount: data.currentMonth.postCount,
      avgEngagementScore: data.currentMonth.avgEngagementScore,
      avgEngagementRate: data.currentMonth.avgEngagementRate,
    }, {
      label: data.priorMonth.label,
      dateRange: data.priorMonth.dateRange ?? data.priorMonth.label,
      postCount: data.priorMonth.postCount,
      avgEngagementScore: data.priorMonth.avgEngagementScore,
      avgEngagementRate: data.priorMonth.avgEngagementRate,
    });
  }

  if (data.quarterMonths?.length) {
    addQuarterTrendSlide(pptx, data.quarterMonths);
  }

  if (data.weeks?.length) {
    const trendTitle =
      data.timeframe === "quarterly"
        ? "Weekly Performance Across the Quarter"
        : data.timeframe === "monthly"
          ? "Weekly Performance — Current Month"
          : "Weekly Performance";
    addTrendSlide(
      pptx,
      trendTitle,
      data.currentPeriod?.dateRange ?? data.subtitle,
      data.weeks
    );
  }

  if (data.priorWeeks?.length) {
    addTrendSlide(
      pptx,
      data.timeframe === "monthly"
        ? "Weekly Performance — Prior Month"
        : "Prior Period — Weekly Breakdown",
      data.priorPeriod?.dateRange ?? "Prior period",
      data.priorWeeks,
      CHART_COLORS.prior
    );
  }

  if (data.beats?.length) {
    addBeatSlide(pptx, data.beats);
  }

  if (data.categories?.length) {
    addCategorySlide(pptx, data.categories);
  }

  if (data.competitors?.length) {
    addCompetitorSlide(
      pptx,
      data.competitors,
      data.summary.avgEngagementRate,
      data.brandName
    );
  }

  if (data.whatWorked) {
    addInsightsSlide(pptx, data.whatWorked);
  }

  if (data.recommendations?.length) {
    addRecommendationsSlide(pptx, data.recommendations);
  }

  if (data.posts.length > 0) {
    onProgress?.(`Loading post images (0/${data.posts.length})…`);
    const ranked = rankByEngagement(data.posts);
    addPostGalleryIntroSlide(pptx, ranked.length);

    for (let i = 0; i < ranked.length; i++) {
      onProgress?.(`Building slides (${i + 1}/${ranked.length})…`);
      const imageData = await resolvePostImageData(ranked[i], imageOrigin);
      addSinglePostSlide(pptx, ranked[i], i + 1, ranked.length, imageData);
    }
  }

  onProgress?.("Finalizing deck…");
  return pptx;
}
