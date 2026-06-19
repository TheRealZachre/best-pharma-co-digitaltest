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
import type { ChannelSummary, Platform } from "@/lib/types";
import { formatNumber } from "@/lib/metrics";
import { getChannelConfigByPlatform } from "@/lib/analytics/channels";

interface ChannelComparisonChartProps {
  channels: ChannelSummary[];
  channelPostDateRanges?: Partial<Record<Platform, string>>;
}

interface ChartDatum {
  name: string;
  platform: Platform;
  reach: number;
  impressions: number;
  posts: number;
  postDateRange: string;
  color: string;
}

function ChannelComparisonTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-brand-ink/10 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-brand-ink">{data.name}</p>
      <p className="mt-1 text-xs text-brand-muted">{data.postDateRange}</p>
      <dl className="mt-2 space-y-1 text-xs text-brand-ink/80">
        <div className="flex justify-between gap-6">
          <dt>Posts loaded</dt>
          <dd className="font-medium">{data.posts.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt>Reach</dt>
          <dd className="font-medium">{formatNumber(data.reach)}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt>Impressions</dt>
          <dd className="font-medium">{formatNumber(data.impressions)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function ChannelComparisonChart({
  channels,
  channelPostDateRanges,
}: ChannelComparisonChartProps) {
  const chartData: ChartDatum[] = channels.map((channel) => ({
    name: channel.label,
    platform: channel.platform,
    reach: channel.totalReach,
    impressions: channel.totalImpressions,
    posts: channel.postCount,
    postDateRange:
      channelPostDateRanges?.[channel.platform] ??
      `${channel.postCount.toLocaleString()} posts loaded`,
    color: getChannelConfigByPlatform(channel.platform)?.color ?? "#D32E27",
  }));

  return (
    <div className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-brand-ink">
        Cross-channel reach &amp; impressions
      </h3>
      <p className="mt-1 text-sm text-brand-muted">
        All loaded posts across every selected channel
      </p>
      <p className="mt-0.5 text-sm font-medium text-brand-ink/80">
        Hover a bar for reach and impressions — post date ranges shown below
      </p>

      <div className="mt-6 h-80">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-brand-muted">
            No channel data loaded yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#5a6a82" }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#5a6a82" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatNumber(Number(value))}
                width={56}
              />
              <Tooltip content={<ChannelComparisonTooltip />} />
              <Legend />
              <Bar
                dataKey="reach"
                fill="#D32E27"
                name="Reach"
                radius={[4, 4, 0, 0]}
                minPointSize={2}
              />
              <Bar
                dataKey="impressions"
                fill="#0F2344"
                name="Impressions"
                radius={[4, 4, 0, 0]}
                minPointSize={2}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {chartData.map((channel) => (
          <li
            key={channel.platform}
            className="rounded-lg border border-brand-ink/8 bg-brand-off-white px-3 py-2 text-xs text-brand-muted"
          >
            <span className="font-semibold text-brand-ink">{channel.name}</span>
            <span className="mx-1">·</span>
            <span>
              {channel.posts === 0
                ? "No posts in this period"
                : channel.postDateRange}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
