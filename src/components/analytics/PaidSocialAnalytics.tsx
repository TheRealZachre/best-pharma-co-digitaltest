import { DollarSign, Megaphone, MousePointerClick, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import {
  buildPaidSocialOverview,
  paidEngagementDelta,
} from "@/lib/analytics/paid-social";
import { formatCurrency, formatPercent } from "@/lib/metrics";
import { metricDefinition } from "@/lib/metric-definitions";
import type { SocialPost } from "@/lib/types";
import { PaidSpendByChannelChart } from "./PaidSpendByChannelChart";

interface PaidSocialAnalyticsProps {
  posts: SocialPost[];
  title?: string;
  subtitle?: string;
}

export function PaidSocialAnalytics({
  posts,
  title = "Paid Social Analytics",
  subtitle = "Spend, delivery mix, and efficiency across corporate channels",
}: PaidSocialAnalyticsProps) {
  const overview = buildPaidSocialOverview(posts);
  const { totals, channels } = overview;
  const hasPaidActivity = totals.totalSpend > 0;

  return (
    <section className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-brand-ink">{title}</h2>
        <p className="mt-1 text-sm text-brand-muted">{subtitle}</p>
      </div>

      {!hasPaidActivity ? (
        <p className="mt-6 text-sm text-brand-muted">
          No paid or boosted posts in this period.
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Paid Spend"
              value={formatCurrency(totals.totalSpend)}
              icon={DollarSign}
              accent="indigo"
              change={`${totals.paidPosts} paid · ${totals.boostedPosts} boosted`}
              changeTone="neutral"
            />
            <StatCard
              label="Paid Avg. ER"
              value={formatPercent(totals.avgPaidEngagementRate)}
              icon={TrendingUp}
              accent="rose"
              change={`Organic avg ${formatPercent(totals.avgOrganicEngagementRate)}`}
              changeTone="neutral"
            />
            <StatCard
              label="Cost per Engagement"
              value={
                totals.costPerEngagement
                  ? formatCurrency(totals.costPerEngagement)
                  : "—"
              }
              icon={Megaphone}
              accent="amber"
            />
            <StatCard
              label="Cost per Click"
              value={
                totals.costPerClick ? formatCurrency(totals.costPerClick) : "—"
              }
              icon={MousePointerClick}
              accent="emerald"
              definition={metricDefinition("avgCTR")}
            />
          </div>

          <PaidSpendByChannelChart channels={channels} />

          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-ink/10 text-xs uppercase tracking-wide text-brand-muted">
                  <th className="py-3 pr-4 font-medium">Channel</th>
                  <th className="py-3 pr-4 font-medium">Paid / Boosted</th>
                  <th className="py-3 pr-4 font-medium">Spend</th>
                  <th className="py-3 pr-4 font-medium">Paid ER</th>
                  <th className="py-3 pr-4 font-medium">Organic ER</th>
                  <th className="py-3 pr-4 font-medium">CPE</th>
                  <th className="py-3 pr-4 font-medium">CPC</th>
                  <th className="py-3 font-medium">Paid reach</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel) => {
                  const delta = paidEngagementDelta(channel);

                  return (
                    <tr
                      key={channel.platform}
                      className="border-b border-brand-ink/5 last:border-0"
                    >
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: channel.color }}
                          >
                            <PlatformIcon platform={channel.platform} size={16} />
                          </span>
                          <div>
                            <p className="font-medium text-brand-ink">
                              {channel.label}
                            </p>
                            <p className="text-xs text-brand-muted">
                              {channel.handle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-brand-ink/80">
                        {channel.paidPosts} paid · {channel.boostedPosts} boosted
                        <span className="block text-xs text-brand-muted">
                          {channel.organicPosts} organic
                        </span>
                      </td>
                      <td className="py-4 pr-4 font-semibold text-brand-ink">
                        {channel.totalSpend > 0
                          ? formatCurrency(channel.totalSpend)
                          : "—"}
                      </td>
                      <td className="py-4 pr-4 font-semibold text-brand-ink">
                        {channel.avgPaidEngagementRate > 0
                          ? formatPercent(channel.avgPaidEngagementRate)
                          : "—"}
                      </td>
                      <td className="py-4 pr-4 text-brand-ink/80">
                        {channel.avgOrganicEngagementRate > 0
                          ? formatPercent(channel.avgOrganicEngagementRate)
                          : "—"}
                        {delta !== null && (
                          <span
                            className={`mt-0.5 block text-xs font-medium ${
                              delta >= 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {delta >= 0 ? "+" : ""}
                            {formatPercent(delta, 1)} vs organic
                          </span>
                        )}
                      </td>
                      <td className="py-4 pr-4 text-brand-ink/80">
                        {channel.costPerEngagement
                          ? formatCurrency(channel.costPerEngagement)
                          : "—"}
                      </td>
                      <td className="py-4 pr-4 text-brand-ink/80">
                        {channel.costPerClick
                          ? formatCurrency(channel.costPerClick)
                          : "—"}
                      </td>
                      <td className="py-4 text-brand-ink/80">
                        {channel.paidReach.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
