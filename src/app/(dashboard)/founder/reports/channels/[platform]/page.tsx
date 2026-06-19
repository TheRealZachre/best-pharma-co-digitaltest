import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { FounderChannelSubnav } from "@/components/analytics/FounderChannelSubnav";
import { ChannelStatsRow } from "@/components/analytics/ChannelStatsRow";
import { BeatRanking } from "@/components/narrative/BeatRanking";
import { DataSyncPanel } from "@/components/dashboard/DataSyncPanel";
import { ExportButtons } from "@/components/dashboard/ExportButtons";
import { OrganicPaidBreakdown } from "@/components/dashboard/OrganicPaidBreakdown";
import { PostDeepDivesSection } from "@/components/dashboard/PostDeepDivesSection";
import { ReportPostsGrid } from "@/components/dashboard/ReportPostsGrid";
import { WhatWorkedAnalysis } from "@/components/dashboard/WhatWorkedAnalysis";
import { NarrativeSection } from "@/components/narrative/NarrativeSection";
import { buildChannelSummary } from "@/lib/analytics/summaries";
import {
  getFounderBrand,
  getFounderMultiChannelPosts,
  getFounderPostsByPlatform,
  buildFounderReportSummary,
  FOUNDER_PLATFORMS,
} from "@/lib/data/founder";
import { beatPerformance, whatWorkedAnalysis } from "@/lib/metrics";
import { CEO } from "@/lib/client";
import type { Platform } from "@/lib/types";

interface ChannelPageProps {
  params: Promise<{ platform: string }>;
}

const FOUNDER_CHANNEL_PLATFORMS: Platform[] = ["linkedin", "x"];

function isFounderPlatform(value: string): value is Platform {
  return FOUNDER_CHANNEL_PLATFORMS.includes(value as Platform);
}

export default async function FounderChannelReportPage({ params }: ChannelPageProps) {
  const { platform: platformParam } = await params;

  if (!isFounderPlatform(platformParam)) {
    notFound();
  }

  const platform = platformParam as Platform;
  const brand = await getFounderBrand();
  const { channelSources, channelFollowers, meta } =
    await getFounderMultiChannelPosts();
  const posts = await getFounderPostsByPlatform(platform);
  const summary = buildFounderReportSummary(posts);
  const FOUNDER_HANDLES: Partial<Record<Platform, string>> = {
    linkedin: `@${CEO.linkedinSlug}`,
    x: `@${CEO.xHandle}`,
  };

  const channelSummary = {
    ...buildChannelSummary(
      platform,
      posts,
      channelSources[platform] ?? "seed",
      channelFollowers[platform]
    ),
    handle: FOUNDER_HANDLES[platform] ?? brand.handle,
  };
  const beats = beatPerformance(posts);
  const analysis = whatWorkedAnalysis(posts, 90);

  return (
    <>
      <Header
        title={channelSummary.label}
        subtitle={`${brand.name} · ${channelSummary.handle} · ${format(new Date(), "MMMM yyyy")}`}
        actions={
          <ExportButtons
            posts={posts}
            reportTitle={`${channelSummary.label} Social Report — ${brand.name}`}
            filenameBase={`founder-${platform}-channel-report`}
          />
        }
      />
      <FounderChannelSubnav />

      <div className="space-y-8 p-8" id="report-content">
        <DataSyncPanel
          initialMeta={meta ?? null}
          channelSources={channelSources}
          syncUrl="/api/sync/founder"
          availableChannels={FOUNDER_PLATFORMS}
          showChannelSelector={false}
          note="Data is based on the latest 50 posts per channel."
        />

        <section className="rounded-xl border border-brand-ink/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-brand-ink">
                {channelSummary.label} performance
              </h2>
              {channelSummary.dataSource !== "live" && (
                <p className="mt-1 text-sm text-brand-muted">
                  No data yet — click Pull Latest Data to sync{" "}
                  {platform === "linkedin" ? "LinkedIn" : "X"} posts.
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
              {channelSummary.dataSource === "live" ? "Live data" : "No data"}
            </span>
          </div>
        </section>

        <ChannelStatsRow channel={channelSummary} />

        <OrganicPaidBreakdown summary={summary} />

        {beats.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <BeatRanking beats={beats} />
          </div>
        )}

        {posts.length >= 4 && (
          <NarrativeSection
            posts={posts}
            maxDays={90}
            arcTitle={`${channelSummary.label} narrative arc`}
            subtitle="Posts mapped by date and engagement, colored by story beat."
          />
        )}

        <WhatWorkedAnalysis worked={analysis.worked} didNot={analysis.didNot} timeframeLabel={analysis.timeframeLabel} sunsetCandidates={analysis.sunsetCandidates} />

        {posts.length >= 3 && <PostDeepDivesSection posts={posts} />}

        <ReportPostsGrid
          posts={posts}
          title={`${channelSummary.label} posts`}
          emptyMessage="No posts for this channel yet. Pull latest data to sync."
        />
      </div>
    </>
  );
}
