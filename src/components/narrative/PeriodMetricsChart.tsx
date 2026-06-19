"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeekBucket } from "@/lib/narrative/types";
import { formatPercent } from "@/lib/metrics";
import { engagementRateAxisTicks } from "@/lib/narrative/chart-axis";

interface PeriodMetricsChartProps {
  title: string;
  dateRange: string;
  postCount: number;
  avgEngagementScore: number;
  avgEngagementRate: number;
  maxEngagementRate: number;
  avgReactions?: number;
  variant?: "current" | "prior";
  weeks?: WeekBucket[];
  emptyMessage?: string;
}

export function PeriodMetricsChart({
  title,
  dateRange,
  postCount,
  avgEngagementScore,
  avgEngagementRate,
  maxEngagementRate,
  avgReactions,
  variant = "current",
  weeks,
  emptyMessage = "No posts in this period.",
}: PeriodMetricsChartProps) {
  const shellClass =
    variant === "current"
      ? "border-indigo-200 bg-brand-indigo/8/40"
      : "border-brand-ink/10 bg-brand-off-white/60";
  const titleClass =
    variant === "current" ? "text-brand-indigo" : "text-brand-muted";
  const barColor = variant === "current" ? "#D32E27" : "#64748b";

  const hasPosts = postCount > 0;
  const weekRows = weeks?.filter((w) => w.postCount > 0) ?? [];
  const chartData =
    weekRows.length > 0
      ? weekRows.map((week) => ({
          label: week.label,
          engagementRate: week.avgEngagementRate,
          postCount: week.postCount,
        }))
      : [
          {
            label: "Overall",
            engagementRate: avgEngagementRate,
            postCount,
          },
        ];

  const yTicks = engagementRateAxisTicks(maxEngagementRate);

  return (
    <div className={`flex h-full flex-col rounded-xl border p-5 ${shellClass}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${titleClass}`}>
        {title}
      </p>
      <p className="mt-1 text-sm font-medium text-brand-ink/80">{dateRange}</p>

      {hasPosts ? (
        <>
          <p className="mt-3 text-sm text-brand-muted">
            {postCount} posts
            {avgReactions !== undefined && ` · avg ${avgReactions} reactions`}
            {" · "}
            {formatPercent(avgEngagementRate)} avg ER · score {avgEngagementScore}
          </p>

          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-brand-muted">
            Engagement rate (%)
          </p>

          <div className="mt-2 h-52 w-full min-w-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={chartData.length > 1 ? -18 : 0}
                  textAnchor={chartData.length > 1 ? "end" : "middle"}
                  height={chartData.length > 1 ? 52 : 28}
                />
                <YAxis
                  domain={[0, maxEngagementRate]}
                  ticks={yTicks}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.35)" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [
                    formatPercent(Number(value)),
                    "Engagement rate",
                  ]}
                  labelFormatter={(label) => String(label)}
                />
                <Bar
                  dataKey="engagementRate"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.label} fill={barColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-brand-muted">{emptyMessage}</p>
      )}
    </div>
  );
}
