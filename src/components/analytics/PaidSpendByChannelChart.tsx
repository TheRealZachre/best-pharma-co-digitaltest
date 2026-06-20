"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PaidChannelMetrics } from "@/lib/analytics/paid-social";
import { formatCurrency, formatPercent } from "@/lib/metrics";

interface PaidSpendByChannelChartProps {
  channels: PaidChannelMetrics[];
}

export function PaidSpendByChannelChart({ channels }: PaidSpendByChannelChartProps) {
  const data = channels
    .filter((channel) => channel.totalSpend > 0)
    .map((channel) => ({
      name: channel.label,
      spend: channel.totalSpend,
      paidER: channel.avgPaidEngagementRate,
    }));

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" vertical={false} />
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
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
          />
          <YAxis
            yAxisId="er"
            orientation="right"
            tick={{ fontSize: 11, fill: "#5a6a82" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
            }}
            formatter={(value, name) => {
              if (name === "Spend") return [formatCurrency(Number(value)), "Spend"];
              return [formatPercent(Number(value)), "Paid avg ER"];
            }}
          />
          <Bar
            yAxisId="spend"
            dataKey="spend"
            name="Spend"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="er"
            dataKey="paidER"
            name="Paid avg ER"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
