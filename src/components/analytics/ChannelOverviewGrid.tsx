import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ChannelSummary } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/metrics";
import { metricDefinition } from "@/lib/metric-definitions";
import { MetricLabel } from "@/components/dashboard/MetricLabel";
import { getChannelConfigByPlatform } from "@/lib/analytics/channels";
import { PlatformIcon } from "@/components/ui/PlatformIcon";

interface ChannelOverviewGridProps {
  channels: ChannelSummary[];
  hrefPrefix?: string;
}

export function ChannelOverviewGrid({ channels, hrefPrefix = "/reports/channels" }: ChannelOverviewGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {channels.map((channel) => {
        const config = getChannelConfigByPlatform(channel.platform);
        const href = `${hrefPrefix}/${channel.platform}`;

        return (
          <Link
            key={channel.platform}
            href={href}
            className="group overflow-visible rounded-xl border border-brand-ink/10 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200 hover:bg-brand-indigo/8/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: config?.color ?? "#D32E27" }}
                >
                  <PlatformIcon platform={channel.platform} size={20} />
                </span>
                <div>
                  <h3 className="font-semibold text-brand-ink group-hover:text-brand-indigo">
                    {channel.label}
                  </h3>
                  <p className="text-xs text-brand-muted">{channel.handle}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  channel.dataSource === "live"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {channel.dataSource === "live" ? "Live sync" : "Seed data"}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-brand-muted">
                  <MetricLabel definition={metricDefinition("followers")}>
                    Followers
                  </MetricLabel>
                </dt>
                <dd className="font-semibold text-brand-ink">
                  {formatNumber(channel.followers)}
                </dd>
              </div>
              <div>
                <dt className="text-brand-muted">
                  <MetricLabel definition={metricDefinition("postCount")}>
                    Posts (loaded)
                  </MetricLabel>
                </dt>
                <dd className="font-semibold text-brand-ink">
                  {channel.postCount}
                </dd>
              </div>
              <div>
                <dt className="text-brand-muted">
                  <MetricLabel definition={metricDefinition("avgEngagementRate")}>
                    Avg. ER
                  </MetricLabel>
                </dt>
                <dd className={`font-semibold ${channel.postCount === 0 ? "text-brand-muted/60" : channel.avgEngagementRate > 0 ? "text-emerald-700" : "text-brand-muted/60"}`}>
                  {channel.postCount === 0 ? "—" : formatPercent(channel.avgEngagementRate)}
                </dd>
              </div>
              <div>
                <dt className="text-brand-muted">
                  <MetricLabel definition={metricDefinition("avgCTR")}>
                    Avg. CTR
                  </MetricLabel>
                </dt>
                <dd className="font-semibold text-brand-ink">
                  {formatPercent(channel.avgCTR)}
                </dd>
              </div>
              <div>
                <dt className="text-brand-muted">
                  <MetricLabel definition={metricDefinition("reach")}>
                    Reach
                  </MetricLabel>
                </dt>
                <dd className="font-semibold text-brand-ink">
                  {formatNumber(channel.totalReach)}
                </dd>
              </div>
              <div>
                <dt className="text-brand-muted">
                  <MetricLabel definition={metricDefinition("impressions")}>
                    Impressions
                  </MetricLabel>
                </dt>
                <dd className="font-semibold text-brand-ink">
                  {formatNumber(channel.totalImpressions)}
                </dd>
              </div>
            </dl>

            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-indigo">
              View channel
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
