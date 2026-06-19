"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SocialPost } from "@/lib/types";
import { engagementRate } from "@/lib/metrics";
import { format } from "date-fns";

interface SpendPerformanceChartProps {
  posts: SocialPost[];
}

export function SpendPerformanceChart({ posts }: SpendPerformanceChartProps) {
  const paidPosts = posts
    .filter((p) => p.metrics.spend && p.metrics.spend > 0)
    .slice(0, 8)
    .map((p) => ({
      name: format(new Date(p.publishedAt), "MMM d"),
      spend: p.metrics.spend ?? 0,
      engagement: Math.round(engagementRate(p.metrics) * 10) / 10,
    }));

  if (paidPosts.length === 0) {
    return (
      <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-brand-ink">
          Spend vs. Performance
        </h3>
        <p className="mt-2 text-sm text-brand-muted">
          No paid posts in this period.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-brand-ink">
        Spend vs. Performance
      </h3>
      <p className="mt-1 text-sm text-brand-muted">
        Paid spend correlation with engagement rate
      </p>

      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={paidPosts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#5a6a82" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="spend"
              tick={{ fontSize: 11, fill: "#5a6a82" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <YAxis
              yAxisId="engagement"
              orientation="right"
              tick={{ fontSize: 11, fill: "#5a6a82" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
              }}
            />
            <Legend />
            <Bar
              yAxisId="spend"
              dataKey="spend"
              name="Spend ($)"
              fill="#818cf8"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="engagement"
              dataKey="engagement"
              name="Eng. Rate (%)"
              fill="#34d399"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
