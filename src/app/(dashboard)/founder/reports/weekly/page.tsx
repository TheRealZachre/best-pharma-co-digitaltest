import { format, subDays, subMilliseconds } from "date-fns";
import { Header } from "@/components/layout/Header";
import { DataSyncPanel } from "@/components/dashboard/DataSyncPanel";
import { ReportDataBanner } from "@/components/dashboard/ReportDataBanner";
import { ExportButtons } from "@/components/dashboard/ExportButtons";
import { ReportStats } from "@/components/dashboard/ReportStats";
import { ReportPostsGrid } from "@/components/dashboard/ReportPostsGrid";
import { NarrativeSection } from "@/components/narrative/NarrativeSection";
import { WeekComparisonPanel } from "@/components/narrative/WeekComparisonPanel";
import { groupByWeek, summarizeWeekBuckets } from "@/lib/narrative/aggregate";
import {
  periodFromSummary,
  weekRowsFromBuckets,
} from "@/lib/export-pptx-types";
import {
  getFounderAllPosts,
  getFounderBrand,
  getFounderMultiChannelPosts,
  getFounderPostsForTimeframe,
  buildFounderReportSummary,
  FOUNDER_PLATFORMS,
} from "@/lib/data/founder";

export default async function FounderWeeklyReportPage() {
  const [{ meta, channelSources }] = await Promise.all([
    getFounderMultiChannelPosts(),
  ]);
  const brand = await getFounderBrand();
  const allPosts = await getFounderAllPosts();
  const posts = await getFounderPostsForTimeframe("weekly");
  const summary = buildFounderReportSummary(posts);
  const now = new Date();
  const currentStart = subDays(now, 7);
  const priorStart = subDays(now, 14);
  const priorEnd = currentStart;

  const priorWeekPosts = allPosts.filter((p) => {
    const d = new Date(p.publishedAt);
    return d >= priorStart && d < priorEnd;
  });

  const currentWeeks = groupByWeek(posts);
  const priorWeeks = groupByWeek(priorWeekPosts);
  const comparisonPosts = [...posts, ...priorWeekPosts];
  const currentWeekSummary = summarizeWeekBuckets(currentWeeks);
  const priorWeekSummary = summarizeWeekBuckets(priorWeeks);
  const currentDateRange = `${format(currentStart, "MMM d")} – ${format(now, "MMM d, yyyy")}`;
  const priorDateRange = `${format(priorStart, "MMM d")} – ${format(subMilliseconds(priorEnd, 1), "MMM d, yyyy")}`;

  return (
    <>
      <Header
        title="Weekly Report"
        subtitle={`${brand.name} · ${currentDateRange} · Rolling 7-day view`}
        actions={
          <ExportButtons
            posts={comparisonPosts}
            reportTitle={`${brand.name} — Weekly Social Media Report`}
            filenameBase="founder-weekly-report"
            pptxData={{
              timeframe: "weekly",
              title: `${brand.name} — Weekly Social Media Report`,
              subtitle: `${brand.name} · ${currentDateRange}`,
              brandName: brand.name,
              summary,
              posts,
              weeks: weekRowsFromBuckets(currentWeeks),
              priorWeeks: weekRowsFromBuckets(priorWeeks),
              currentPeriod: periodFromSummary(
                "Current week",
                currentDateRange,
                currentWeekSummary
              ),
              priorPeriod: periodFromSummary(
                "Prior week",
                priorDateRange,
                priorWeekSummary
              ),
            }}
          />
        }
      />

      <div className="space-y-8 p-8" id="report-content">
        <DataSyncPanel
          initialMeta={meta ?? null}
          channelSources={channelSources}
          syncUrl="/api/sync/founder"
          availableChannels={FOUNDER_PLATFORMS}
          showChannelSelector={false}
          note="Data is based on the latest 50 posts per channel."
        />

        <ReportDataBanner
          timeframe="Weekly"
          postCount={posts.length}
          companyName={brand.name}
          provider={meta?.channels?.linkedin?.provider}
          selectedChannels={FOUNDER_PLATFORMS}
        />

        <WeekComparisonPanel
          current={{
            weeks: currentWeeks,
            dateRange: currentDateRange,
            ...currentWeekSummary,
          }}
          prior={{
            weeks: priorWeeks,
            dateRange: priorDateRange,
            ...priorWeekSummary,
          }}
        />

        <NarrativeSection
          posts={comparisonPosts}
          maxDays={14}
          arcTitle={`${brand.name} narrative arc — this week vs prior week`}
          subtitle="Rolling two-week view. Hover any node to see the post, story beat, and engagement score."
        />

        <ReportStats summary={summary} />

        <ReportPostsGrid
          posts={posts}
          title="This week's posts"
          emptyMessage="No posts in the last 7 days. Pull latest data to refresh."
        />
      </div>
    </>
  );
}
