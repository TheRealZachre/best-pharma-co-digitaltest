import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  CHART_COLORS,
  comparisonTitle,
  drawBarChartPdf,
  drawComparisonChartPdf,
  drawPeriodDetailsPdf,
  engagementRateDelta,
  formatDeltaLabel,
  trendPointsFromMonths,
  trendPointsFromWeeks,
} from "./export-charts";
import type { ReportPptxPayload } from "./export-pptx-types";
import type { SocialPost } from "./types";
import {
  clickThroughRate,
  engagementRate,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "./metrics";

function postRows(posts: SocialPost[]) {
  return posts.map((p) => [
    p.id,
    p.platform,
    p.category,
    p.storyBeat,
    p.type,
    new Date(p.publishedAt).toLocaleDateString(),
    p.metrics.impressions,
    p.metrics.reach,
    p.metrics.likes,
    p.metrics.comments,
    p.metrics.shares,
    p.metrics.clicks,
    formatPercent(engagementRate(p.metrics)),
    formatPercent(clickThroughRate(p.metrics)),
    p.metrics.spend ? formatCurrency(p.metrics.spend) : "—",
  ]);
}

const HEADERS = [
  "ID",
  "Platform",
  "Category",
  "Narrative Arc",
  "Type",
  "Published",
  "Impressions",
  "Reach",
  "Likes",
  "Comments",
  "Shares",
  "Clicks",
  "Eng. Rate",
  "CTR",
  "Spend",
];

function addSummaryPage(doc: jsPDF, report: ReportPptxPayload) {
  doc.setFontSize(18);
  doc.setTextColor(24, 24, 32);
  doc.text(report.title, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(report.subtitle, 14, 28);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 34);

  autoTable(doc, {
    startY: 42,
    head: [["Metric", "Value"]],
    body: [
      ["Total Posts", String(report.summary.totalPosts)],
      ["Organic / Paid", `${report.summary.organicPosts} / ${report.summary.paidPosts}`],
      ["Avg. Engagement Rate", formatPercent(report.summary.avgEngagementRate)],
      ["Avg. CTR", formatPercent(report.summary.avgCTR)],
      ["Total Reach", formatNumber(report.summary.totalReach)],
      ["Total Impressions", formatNumber(report.summary.totalImpressions)],
      ["Total Spend", formatCurrency(report.summary.totalSpend)],
      ["Audience Growth", `+${formatNumber(report.summary.audienceGrowth)} followers`],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [20, 19, 25] },
    theme: "grid",
    margin: { left: 14, right: 14 },
  });
}

function addComparisonPage(doc: jsPDF, report: ReportPptxPayload) {
  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(24, 24, 32);
  doc.text(comparisonTitle(report.timeframe), 14, 20);

  const current =
    report.currentPeriod ??
    (report.currentMonth
      ? {
          label: report.currentMonth.label,
          dateRange: report.currentMonth.dateRange ?? report.currentMonth.label,
          postCount: report.currentMonth.postCount,
          avgEngagementScore: report.currentMonth.avgEngagementScore,
          avgEngagementRate: report.currentMonth.avgEngagementRate,
        }
      : null);
  const prior =
    report.priorPeriod ??
    (report.priorMonth
      ? {
          label: report.priorMonth.label,
          dateRange: report.priorMonth.dateRange ?? report.priorMonth.label,
          postCount: report.priorMonth.postCount,
          avgEngagementScore: report.priorMonth.avgEngagementScore,
          avgEngagementRate: report.priorMonth.avgEngagementRate,
        }
      : null);

  if (!current || !prior) return;

  const delta = engagementRateDelta(current, prior);
  doc.setFontSize(10);
  doc.setTextColor(delta !== null && delta < 0 ? 225 : 5, delta !== null && delta < 0 ? 29 : 150, delta !== null && delta < 0 ? 72 : 105);
  doc.text(formatDeltaLabel(delta), 14, 28);

  drawComparisonChartPdf(doc, {
    title: "Engagement rate comparison",
    currentLabel: current.label,
    priorLabel: prior.label,
    currentRate: current.avgEngagementRate,
    priorRate: prior.avgEngagementRate,
    currentPosts: current.postCount,
    priorPosts: prior.postCount,
    x: 14,
    y: 34,
    width: 180,
    height: 90,
  });

  drawPeriodDetailsPdf(doc, current, 14, 150, 85);
  drawPeriodDetailsPdf(doc, prior, 110, 150, 85);
}

function addTrendPage(
  doc: jsPDF,
  title: string,
  subtitle: string,
  points: ReturnType<typeof trendPointsFromWeeks>
) {
  if (points.length === 0) return;

  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(24, 24, 32);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, 14, 28);

  let nextY = drawBarChartPdf(doc, {
    title: "Engagement rate by period (%)",
    labels: points.map((p) => p.label),
    values: points.map((p) => p.engagementRate),
    valueSuffix: "%",
    color: CHART_COLORS.current,
    x: 14,
    y: 36,
    width: 180,
    height: 70,
  });

  nextY = drawBarChartPdf(doc, {
    title: "Post volume by period",
    labels: points.map((p) => p.label),
    values: points.map((p) => p.postCount),
    color: CHART_COLORS.prior,
    x: 14,
    y: nextY + 6,
    width: 180,
    height: 55,
  });

  autoTable(doc, {
    startY: nextY + 8,
    head: [["Period", "Posts", "Avg. ER", "Score"]],
    body: points.map((p) => [
      p.label,
      String(p.postCount),
      formatPercent(p.engagementRate),
      String(p.engagementScore),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [20, 19, 25] },
    margin: { left: 14, right: 14 },
  });
}

function addQuarterTrendPage(doc: jsPDF, report: ReportPptxPayload) {
  const points = trendPointsFromMonths(report.quarterMonths ?? []);
  if (points.length === 0) return;

  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(24, 24, 32);
  doc.text("Quarterly Month Trend", 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Month-over-month progress across the quarter",
    14,
    28
  );

  let nextY = drawBarChartPdf(doc, {
    title: "Engagement rate by month (%)",
    labels: points.map((p) => p.label),
    values: points.map((p) => p.engagementRate),
    valueSuffix: "%",
    color: CHART_COLORS.current,
    x: 14,
    y: 36,
    width: 180,
    height: 70,
  });

  nextY = drawBarChartPdf(doc, {
    title: "Engagement score by month",
    labels: points.map((p) => p.label),
    values: points.map((p) => p.engagementScore),
    color: CHART_COLORS.accent,
    x: 14,
    y: nextY + 6,
    width: 180,
    height: 55,
  });

  autoTable(doc, {
    startY: nextY + 8,
    head: [["Month", "Posts", "Avg. ER", "Score"]],
    body: points.map((p) => [
      p.label,
      String(p.postCount),
      formatPercent(p.engagementRate),
      String(p.engagementScore),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [20, 19, 25] },
    margin: { left: 14, right: 14 },
  });
}

export function exportToExcel(
  posts: SocialPost[],
  filename: string,
  sheetName = "Report"
) {
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...postRows(posts)]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export function exportToPDF(
  posts: SocialPost[],
  title: string,
  filename: string,
  report?: ReportPptxPayload
) {
  const doc = new jsPDF({ orientation: "landscape" });

  if (report) {
    addSummaryPage(doc, report);

    if (
      (report.currentPeriod && report.priorPeriod) ||
      (report.currentMonth && report.priorMonth)
    ) {
      addComparisonPage(doc, report);
    }

    if (report.quarterMonths?.length) {
      addQuarterTrendPage(doc, report);
    }

    if (report.weeks?.length) {
      const trendTitle =
        report.timeframe === "quarterly"
          ? "Weekly Performance Across the Quarter"
          : report.timeframe === "monthly"
            ? "Weekly Performance — Current Month"
            : "Weekly Performance";
      addTrendPage(
        doc,
        trendTitle,
        report.currentPeriod?.dateRange ?? report.subtitle,
        trendPointsFromWeeks(report.weeks)
      );
    }

    if (report.priorWeeks?.length) {
      addTrendPage(
        doc,
        report.timeframe === "monthly"
          ? "Weekly Performance — Prior Month"
          : "Prior Period — Weekly Breakdown",
        report.priorPeriod?.dateRange ?? "Prior period",
        trendPointsFromWeeks(report.priorWeeks)
      );
    }

    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(24, 24, 32);
    doc.text("Post Performance Detail", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`${posts.length} posts`, 14, 28);

    autoTable(doc, {
      startY: 34,
      head: [HEADERS],
      body: postRows(posts),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59] },
    });
  } else {
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated ${new Date().toLocaleString()}`, 14, 28);

    autoTable(doc, {
      startY: 34,
      head: [HEADERS],
      body: postRows(posts),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59] },
    });
  }

  doc.save(filename);
}
