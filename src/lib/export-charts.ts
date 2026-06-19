import type jsPDF from "jspdf";
import { engagementRateAxisMax } from "./narrative/chart-axis";
import { formatPercent } from "./metrics";
import type { MonthSummaryRow, PeriodComparisonExport, WeekSummaryRow } from "./export-pptx-types";

export const CHART_COLORS = {
  current: "6366F1",
  prior: "64748B",
  accent: "7C78FF",
  grid: "E2E8F0",
  ink: "181820",
  muted: "64748B",
  emerald: "059669",
  rose: "E11D48",
} as const;

export interface TrendChartPoint {
  label: string;
  engagementRate: number;
  postCount: number;
  engagementScore: number;
}

export function trendPointsFromWeeks(weeks: WeekSummaryRow[]): TrendChartPoint[] {
  return weeks
    .filter((w) => w.postCount > 0)
    .map((w) => ({
      label: w.label,
      engagementRate: w.avgEngagementRate,
      postCount: w.postCount,
      engagementScore: w.avgEngagementScore,
    }));
}

export function trendPointsFromMonths(months: MonthSummaryRow[]): TrendChartPoint[] {
  return months
    .filter((m) => m.postCount > 0)
    .map((m) => ({
      label: m.label,
      engagementRate: m.avgEngagementRate,
      postCount: m.postCount,
      engagementScore: m.avgEngagementScore,
    }));
}

export function engagementRateDelta(
  current: PeriodComparisonExport,
  prior: PeriodComparisonExport
): number | null {
  if (current.postCount === 0 || prior.postCount === 0) return null;
  return (
    Math.round((current.avgEngagementRate - prior.avgEngagementRate) * 10) / 10
  );
}

export function comparisonTitle(timeframe: "weekly" | "monthly" | "quarterly"): string {
  switch (timeframe) {
    case "weekly":
      return "Week-over-Week Comparison";
    case "monthly":
      return "Month-over-Month Comparison";
    case "quarterly":
      return "Quarter-over-Quarter Comparison";
  }
}

export function formatDeltaLabel(delta: number | null, unit = "engagement rate"): string {
  if (delta === null) return "Insufficient data for comparison";
  if (delta === 0) return `Flat ${unit} vs prior period`;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${formatPercent(delta, 1)} ${unit} vs prior period`;
}

export function shortChartLabel(label: string, max = 14): string {
  if (label.length <= max) return label;
  return `${label.slice(0, max - 1)}…`;
}

function axisMax(values: number[]): number {
  return engagementRateAxisMax(values);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const value = parseInt(clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export interface PdfBarChartOptions {
  title: string;
  subtitle?: string;
  labels: string[];
  values: number[];
  valueSuffix?: string;
  color?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  maxValue?: number;
}

export function drawBarChartPdf(
  doc: jsPDF,
  {
    title,
    subtitle,
    labels,
    values,
    valueSuffix = "",
    color = CHART_COLORS.current,
    x,
    y,
    width,
    height,
    maxValue,
  }: PdfBarChartOptions
): number {
  const [r, g, b] = hexToRgb(color);
  const peak = maxValue ?? Math.max(...values, 1);
  const plotX = x + 14;
  const plotY = y + (subtitle ? 16 : 12);
  const plotW = width - 16;
  const plotH = height - 22;

  doc.setFontSize(11);
  doc.setTextColor(24, 24, 32);
  doc.text(title, x, y + 5);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, x, y + 11);
  }

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.rect(plotX, plotY, plotW, plotH);

  const barGap = 6;
  const barCount = Math.max(labels.length, 1);
  const barWidth = Math.min(
    28,
    (plotW - barGap * (barCount + 1)) / barCount
  );

  values.forEach((value, index) => {
    const barH = peak > 0 ? (value / peak) * (plotH - 8) : 0;
    const barX =
      plotX + barGap + index * (barWidth + barGap);
    const barY = plotY + plotH - barH;

    doc.setFillColor(r, g, b);
    doc.rect(barX, barY, barWidth, barH, "F");

    doc.setFontSize(7);
    doc.setTextColor(24, 24, 32);
    doc.text(
      `${value}${valueSuffix}`,
      barX + barWidth / 2,
      barY - 2,
      { align: "center" }
    );

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const label = shortChartLabel(labels[index] ?? "", 12);
    doc.text(label, barX + barWidth / 2, plotY + plotH + 5, {
      align: "center",
    });
  });

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("0", plotX - 2, plotY + plotH + 1, { align: "right" });
  doc.text(
    `${peak}${valueSuffix}`,
    plotX - 2,
    plotY + 4,
    { align: "right" }
  );

  return plotY + plotH + 12;
}

export interface PdfComparisonChartOptions {
  title: string;
  subtitle?: string;
  currentLabel: string;
  priorLabel: string;
  currentRate: number;
  priorRate: number;
  currentPosts: number;
  priorPosts: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function drawComparisonChartPdf(
  doc: jsPDF,
  opts: PdfComparisonChartOptions
): number {
  const maxRate = axisMax([opts.currentRate, opts.priorRate]);
  let nextY = drawBarChartPdf(doc, {
    title: opts.title,
    subtitle: opts.subtitle,
    labels: [opts.currentLabel, opts.priorLabel],
    values: [opts.currentRate, opts.priorRate],
    valueSuffix: "%",
    color: CHART_COLORS.current,
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height * 0.55,
    maxValue: maxRate,
  });

  nextY = drawBarChartPdf(doc, {
    title: "Post volume",
    labels: [opts.currentLabel, opts.priorLabel],
    values: [opts.currentPosts, opts.priorPosts],
    color: CHART_COLORS.prior,
    x: opts.x,
    y: nextY + 4,
    width: opts.width,
    height: opts.height * 0.4,
    maxValue: Math.max(opts.currentPosts, opts.priorPosts, 1),
  });

  return nextY;
}

export function drawPeriodDetailsPdf(
  doc: jsPDF,
  period: PeriodComparisonExport,
  x: number,
  y: number,
  width: number
): number {
  doc.setFontSize(10);
  doc.setTextColor(24, 24, 32);
  doc.text(period.label, x, y);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(period.dateRange, x, y + 5);

  const lines = [
    `Posts: ${period.postCount}`,
    `Avg. engagement rate: ${formatPercent(period.avgEngagementRate)}`,
    `Engagement score: ${period.avgEngagementScore}`,
  ];
  if (period.avgReactions !== undefined) {
    lines.push(`Avg. reactions: ${period.avgReactions}`);
  }

  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  lines.forEach((line, index) => {
    doc.text(line, x, y + 12 + index * 5);
  });

  return y + 12 + lines.length * 5;
}

export function trendChartMaxRate(points: TrendChartPoint[]): number {
  return axisMax(points.map((p) => p.engagementRate));
}
