import { Eye, Heart, MousePointerClick, TrendingUp, Users } from "lucide-react";
import type { ChannelSummary } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/metrics";
import { metricDefinition } from "@/lib/metric-definitions";
import {
  formatMonthOverMonthChange,
  type CrossChannelActivityTotals,
  type CrossChannelVolumeTotals,
} from "@/lib/analytics/summaries";
import { StatCard } from "@/components/dashboard/StatCard";

const SAME_PERIOD_LABEL = "vs same period last month";

interface ChannelStatsRowProps {
  channel: ChannelSummary;
  priorMonth?: CrossChannelActivityTotals;
  priorVolume?: CrossChannelVolumeTotals;
  currentDateRange?: string;
  priorDateRange?: string;
}

function formatVolumePeriodComparison(
  current: number,
  prior: number,
  priorDateRange: string,
  formatter: (value: number) => string
): { text: string; tone: "positive" | "negative" | "neutral" } {
  const delta = current - prior;

  if (delta === 0) {
    return {
      text: `${formatter(prior)} prior period · ${priorDateRange}`,
      tone: "neutral",
    };
  }

  const sign = delta > 0 ? "+" : "-";
  return {
    text: `${sign}${formatter(Math.abs(delta))} vs ${formatter(prior)} prior · ${priorDateRange}`,
    tone: delta > 0 ? "positive" : "negative",
  };
}

export function ChannelStatsRow({
  channel,
  priorMonth,
  priorVolume,
  currentDateRange,
  priorDateRange,
}: ChannelStatsRowProps) {
  const postChange = priorVolume
    ? formatMonthOverMonthChange(
        channel.postCount - priorVolume.postCount,
        (value) => String(value),
        SAME_PERIOD_LABEL
      )
    : null;
  const engagementChange = priorMonth
    ? formatMonthOverMonthChange(
        channel.avgEngagementRate - priorMonth.avgEngagementRate,
        (value) => formatPercent(value)
      )
    : null;
  const ctrChange = priorMonth
    ? formatMonthOverMonthChange(
        channel.avgCTR - priorMonth.avgCTR,
        (value) => formatPercent(value)
      )
    : null;
  const reachChange =
    priorVolume && priorDateRange
      ? formatVolumePeriodComparison(
          channel.totalReach,
          priorVolume.totalReach,
          priorDateRange,
          formatNumber
        )
      : null;
  const impressionsChange =
    priorVolume && priorDateRange
      ? formatVolumePeriodComparison(
          channel.totalImpressions,
          priorVolume.totalImpressions,
          priorDateRange,
          formatNumber
        )
      : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label="Followers"
        value={formatNumber(channel.followers)}
        change={`+${formatNumber(channel.followerGrowth)} this month`}
        positive
        icon={Users}
        accent="indigo"
        definition={metricDefinition("followers")}
      />
      <StatCard
        label="Posts"
        value={String(channel.postCount)}
        change={postChange?.text}
        changeTone={postChange?.tone}
        icon={TrendingUp}
        accent="indigo"
        definition={metricDefinition("postCount")}
      />
      <StatCard
        label="Avg. Engagement"
        value={formatPercent(channel.avgEngagementRate)}
        change={engagementChange?.text}
        changeTone={engagementChange?.tone}
        definition={metricDefinition("avgEngagement")}
        icon={Heart}
        accent="rose"
      />
      <StatCard
        label="Avg. CTR"
        value={formatPercent(channel.avgCTR)}
        change={ctrChange?.text}
        changeTone={ctrChange?.tone}
        definition={metricDefinition("avgCTR")}
        icon={MousePointerClick}
        accent="emerald"
      />
      <StatCard
        label="Total Reach"
        value={formatNumber(channel.totalReach)}
        periodHint={currentDateRange}
        change={reachChange?.text}
        changeTone={reachChange?.tone}
        definition={`${metricDefinition("totalReach")} Current period total compared to the same day-range in the prior month.`}
        icon={Users}
        accent="emerald"
      />
      <StatCard
        label="Impressions"
        value={formatNumber(channel.totalImpressions)}
        periodHint={currentDateRange}
        change={impressionsChange?.text}
        changeTone={impressionsChange?.tone}
        definition={`${metricDefinition("impressions")} Current period total compared to the same day-range in the prior month.`}
        icon={Eye}
        accent="amber"
      />
    </div>
  );
}
