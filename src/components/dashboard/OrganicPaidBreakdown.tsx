"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ReportSummary } from "@/lib/types";

interface OrganicPaidBreakdownProps {
  summary: ReportSummary;
}

const COLORS = ["#D32E27", "#f59e0b"];

export function OrganicPaidBreakdown({ summary }: OrganicPaidBreakdownProps) {
  const data = [
    { name: "Organic", value: summary.organicPosts },
    { name: "Paid / Boosted", value: summary.paidPosts },
  ];

  return (
    <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-brand-ink">
        Organic vs. Paid
      </h3>
      <p className="mt-1 text-sm text-brand-muted">Post distribution by type</p>

      <div className="mt-4 flex items-center gap-6">
        <div className="h-40 w-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {data.map((entry, i) => (
            <div key={entry.name} className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[i] }}
              />
              <div>
                <p className="text-sm font-medium text-brand-ink/80">
                  {entry.name}
                </p>
                <p className="text-lg font-semibold text-brand-ink">
                  {entry.value} posts
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
