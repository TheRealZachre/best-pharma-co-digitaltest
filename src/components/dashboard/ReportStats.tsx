import {
  DollarSign,
  Eye,
  Heart,
  MousePointerClick,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ReportSummary } from "@/lib/types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/metrics";
import { metricDefinition } from "@/lib/metric-definitions";
import { StatCard } from "./StatCard";

interface ReportStatsProps {
  summary: ReportSummary;
}

export function ReportStats({ summary }: ReportStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label="Total Posts"
        value={String(summary.totalPosts)}
        icon={TrendingUp}
        accent="indigo"
        definition={metricDefinition("totalPosts")}
      />
      <StatCard
        label="Avg. Engagement Rate"
        value={formatPercent(summary.avgEngagementRate)}
        definition={metricDefinition("avgEngagementRate")}
        icon={Heart}
        accent="rose"
      />
      <StatCard
        label="Avg. CTR"
        value={formatPercent(summary.avgCTR)}
        definition={metricDefinition("avgCTR")}
        icon={MousePointerClick}
        accent="emerald"
      />
      <StatCard
        label="Total Reach"
        value={formatNumber(summary.totalReach)}
        definition={metricDefinition("totalReach")}
        icon={Users}
        accent="indigo"
      />
      <StatCard
        label="Total Impressions"
        value={formatNumber(summary.totalImpressions)}
        definition={metricDefinition("totalImpressions")}
        icon={Eye}
        accent="amber"
      />
      <StatCard
        label="Total Spend"
        value={formatCurrency(summary.totalSpend)}
        change={`+${summary.audienceGrowth.toLocaleString()} followers`}
        positive
        icon={DollarSign}
        accent="emerald"
      />
    </div>
  );
}
