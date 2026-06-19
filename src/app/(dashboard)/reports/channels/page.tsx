import { format } from "date-fns";
import { Header } from "@/components/layout/Header";
import { ChannelSubnav } from "@/components/analytics/ChannelSubnav";
import { ChannelComparisonChart } from "@/components/analytics/ChannelComparisonChart";
import { ChannelOverviewGrid } from "@/components/analytics/ChannelOverviewGrid";
import { ChannelStatsRow } from "@/components/analytics/ChannelStatsRow";
import { DataSyncPanel } from "@/components/dashboard/DataSyncPanel";
import { ReportPostsGrid } from "@/components/dashboard/ReportPostsGrid";
import {
  getAlignedMonthPeriodPosts,
  getPostDateRangeLabel,
} from "@/lib/analytics/periods";
import {
  buildCrossChannelActivityFromPosts,
  buildCrossChannelTotals,
  buildCrossChannelVolumeFromChannelSummaries,
  buildMonthlyChannelSummaries,
  filterPostsByPlatform,
} from "@/lib/analytics/summaries";
import { formatChannelList } from "@/lib/analytics/channel-selection";
import {
  getBrand,
  getChannelSummaries,
  getAllPosts,
} from "@/lib/data";
import type { ChannelSummary, Platform } from "@/lib/types";

function crossChannelAsSummary(
  followerTotals: ReturnType<typeof buildCrossChannelTotals>,
  volume: ReturnType<typeof buildCrossChannelVolumeFromChannelSummaries>,
  rates: ReturnType<typeof buildCrossChannelActivityFromPosts>
): ChannelSummary {
  return {
    platform: "linkedin",
    label: followerTotals.label,
    handle: followerTotals.handle,
    followers: followerTotals.followers,
    followerGrowth: followerTotals.followerGrowth,
    postCount: volume.postCount,
    avgEngagementRate: rates.avgEngagementRate,
    avgCTR: rates.avgCTR,
    totalReach: volume.totalReach,
    totalImpressions: volume.totalImpressions,
    totalSpend: followerTotals.totalSpend,
    dataSource: "live",
  };
}

export default async function AllChannelsPage() {
  const brand = await getBrand();
  const { channels, channelSources, meta, selectedChannels } =
    await getChannelSummaries();
  const posts = await getAllPosts();
  const liveChannelCount = channels.filter((c) => c.dataSource === "live").length;
  const followerTotals = buildCrossChannelTotals(channels);

  const { currentPosts, priorPosts, meta: alignedMeta } =
    getAlignedMonthPeriodPosts(posts);
  const currentPeriodChannels = buildMonthlyChannelSummaries(
    channels,
    currentPosts
  );
  const priorPeriodChannels = buildMonthlyChannelSummaries(
    channels,
    priorPosts
  );
  const currentVolume =
    buildCrossChannelVolumeFromChannelSummaries(currentPeriodChannels);
  const priorVolume =
    buildCrossChannelVolumeFromChannelSummaries(priorPeriodChannels);
  const currentRates = buildCrossChannelActivityFromPosts(currentPosts);
  const priorRates = buildCrossChannelActivityFromPosts(priorPosts);

  const channelSummary = crossChannelAsSummary(
    followerTotals,
    currentVolume,
    currentRates
  );
  const channelPostDateRanges = Object.fromEntries(
    currentPeriodChannels.map((channel) => [
      channel.platform,
      getPostDateRangeLabel(
        filterPostsByPlatform(currentPosts, channel.platform)
      ),
    ])
  ) as Partial<Record<Platform, string>>;

  return (
    <>
      <Header
        title="All Channels"
        subtitle={`${brand.name} · ${format(new Date(), "MMMM yyyy")} · Cross-platform social performance`}
      />
      <ChannelSubnav />

      <div className="space-y-8 p-8">
        <DataSyncPanel
          initialMeta={meta ?? null}
          channelSources={channelSources}
        />

        <section className="overflow-visible rounded-xl border border-indigo-200 bg-brand-indigo/8/50 p-6">
          <div>
            <h2 className="text-lg font-semibold text-brand-ink">
              Social picture
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-muted">
              Unified view across {formatChannelList(selectedChannels)} for{" "}
              {alignedMeta.currentDateRange} ({alignedMeta.dayCount} days).
              Posts, reach, and impressions are summed from posts published in
              that window and compared to {alignedMeta.priorDateRange}.
              Engagement and CTR use the same periods.
              {liveChannelCount === channels.length
                ? " All selected channels are connected via live sync."
                : ` ${liveChannelCount} of ${channels.length} selected channels are live — use Pull Latest Data to refresh.`}
            </p>
          </div>

          {channels.length === 0 ? (
            <p className="mt-6 text-sm text-brand-muted">
              No channels selected. Enable at least one channel in the sync
              panel above to see cross-platform totals.
            </p>
          ) : (
            <div className="mt-6">
              <ChannelStatsRow
                channel={channelSummary}
                priorMonth={priorRates}
                priorVolume={priorVolume}
                currentDateRange={alignedMeta.currentDateRange}
                priorDateRange={alignedMeta.priorDateRange}
              />
            </div>
          )}
        </section>

        <ChannelComparisonChart
          channels={currentPeriodChannels}
          channelPostDateRanges={channelPostDateRanges}
        />

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-brand-ink">
              Channel breakdown
            </h2>
            <p className="mt-1 text-sm text-brand-muted">
              Same period as Social picture · {alignedMeta.currentDateRange}
            </p>
          </div>
          <ChannelOverviewGrid channels={currentPeriodChannels} />
        </section>

        <ReportPostsGrid
          posts={posts}
          title="Posts across all channels"
          emptyMessage="No posts loaded yet. Pull latest data to refresh."
          defaultSort="date-desc"
        />
      </div>
    </>
  );
}
