import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ChannelSubnav } from "@/components/analytics/ChannelSubnav";
import { ChannelStatsRow } from "@/components/analytics/ChannelStatsRow";
import { BeatRanking } from "@/components/narrative/BeatRanking";
import { DataSyncPanel } from "@/components/dashboard/DataSyncPanel";
import { ExportButtons } from "@/components/dashboard/ExportButtons";
import { OrganicPaidBreakdown } from "@/components/dashboard/OrganicPaidBreakdown";
import { PostDeepDivesSection } from "@/components/dashboard/PostDeepDivesSection";
import { ReportPostsGrid } from "@/components/dashboard/ReportPostsGrid";
import { SpendPerformanceChart } from "@/components/dashboard/SpendPerformanceChart";
import { WhatWorkedAnalysis } from "@/components/dashboard/WhatWorkedAnalysis";
import { NarrativeSection } from "@/components/narrative/NarrativeSection";
import { isAnalyticsPlatform } from "@/lib/analytics/channels";
import { buildChannelSummary } from "@/lib/analytics/summaries";
import {
  buildReportSummary,
  getBrand,
  getMultiChannelPosts,
  getPostsByPlatform,
} from "@/lib/data";
import {
  beatPerformance,
  whatWorkedAnalysis,
} from "@/lib/metrics";
import type { Platform } from "@/lib/types";

interface ChannelPageProps {
  params: Promise<{ platform: string }>;
}

export default async function ChannelReportPage({ params }: ChannelPageProps) {
  const { platform: platformParam } = await params;

  if (!isAnalyticsPlatform(platformParam)) {
    notFound();
  }

  const platform = platformParam as Platform;
  const brand = await getBrand();
  const { channelSources, channelFollowers, meta } =
    await getMultiChannelPosts();
  const posts = await getPostsByPlatform(platform);
  const summary = buildReportSummary(posts);
  const channelSummary = buildChannelSummary(
    platform,
    posts,
    channelSources[platform] ?? "seed",
    channelFollowers[platform]
  );
  const beats = beatPerformance(posts);
  const analysis = whatWorkedAnalysis(posts);

  return (
    <>
      <Header
        title={channelSummary.label}
        subtitle={`${brand.name} · ${channelSummary.handle} · ${format(new Date(), "MMMM yyyy")}`}
        actions={
          <ExportButtons
            posts={posts}
            reportTitle={`${channelSummary.label} Social Report`}
            filenameBase={`${platform}-channel-report`}
          />
        }
      />
      <ChannelSubnav />

      <div className="space-y-8 p-8" id="report-content">
        <DataSyncPanel
          initialMeta={meta ?? null}
          channelSources={channelSources}
        />

        <section className="rounded-xl border border-brand-ink/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-brand-ink">
                {channelSummary.label} performance
              </h2>
              {channelSummary.dataSource !== "live" && (
                <p className="mt-1 text-sm text-brand-muted">
                  Representative seed data — run Pull Latest Data to connect this
                  channel.
                </p>
              )}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                channelSummary.dataSource === "live"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {channelSummary.dataSource === "live" ? "Live data" : "Seed data"}
            </span>
          </div>
        </section>

        <ChannelStatsRow channel={channelSummary} />

        <div className="grid gap-6 lg:grid-cols-2">
          <OrganicPaidBreakdown summary={summary} />
          {beats.length > 0 && <BeatRanking beats={beats} />}
        </div>

        {posts.length >= 4 && (
          <NarrativeSection
            posts={posts}
            maxDays={90}
            arcTitle={`${channelSummary.label} narrative arc`}
            subtitle="Posts mapped by date and engagement, colored by story beat."
          />
        )}

        <WhatWorkedAnalysis
          worked={analysis.worked}
          didNot={analysis.didNot}
          timeframeLabel={analysis.timeframeLabel}
          sunsetCandidates={analysis.sunsetCandidates}
        />

        {posts.length >= 3 && <PostDeepDivesSection posts={posts} />}

        <SpendPerformanceChart posts={posts} />

        <ReportPostsGrid
          posts={posts}
          title={`${channelSummary.label} posts`}
          emptyMessage="No posts for this channel yet."
          showBudget
        />
      </div>
    </>
  );
}
