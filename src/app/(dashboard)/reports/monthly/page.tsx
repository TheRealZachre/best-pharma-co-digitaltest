import { Header } from "@/components/layout/Header";
import { DataSyncPanel } from "@/components/dashboard/DataSyncPanel";
import { ReportDataBanner } from "@/components/dashboard/ReportDataBanner";
import { ExportButtons } from "@/components/dashboard/ExportButtons";
import { ReportStats } from "@/components/dashboard/ReportStats";
import { BeatRanking } from "@/components/narrative/BeatRanking";
import { CompetitorBenchmark } from "@/components/dashboard/CompetitorBenchmark";
import { BudgetRecommendations } from "@/components/dashboard/BudgetRecommendations";
import { WhatWorkedAnalysis } from "@/components/dashboard/WhatWorkedAnalysis";
import { OrganicPaidBreakdown } from "@/components/dashboard/OrganicPaidBreakdown";
import { AudienceGrowthChart } from "@/components/dashboard/AudienceGrowthChart";
import { SpendPerformanceChart } from "@/components/dashboard/SpendPerformanceChart";
import { MonthComparisonPanel } from "@/components/narrative/MonthComparisonPanel";
import { NarrativeSection } from "@/components/narrative/NarrativeSection";
import { SplitWeeklyPerformancePanel } from "@/components/narrative/SplitWeeklyPerformancePanel";
import { getMonthPosts, groupByWeek } from "@/lib/narrative/aggregate";
import { getSelectedAnalyticsChannels } from "@/lib/analytics/channel-selection.server";
import {
  monthRowFromBucket,
  periodFromSummary,
  weekRowsFromBuckets,
} from "@/lib/export-pptx-types";
import { summarizeWeekBuckets } from "@/lib/narrative/aggregate";
import {
  buildReportSummary,
  getAllPosts,
  getAudienceGrowth,
  getBrand,
  getMultiChannelPosts,
} from "@/lib/data";
import {
  beatPerformance,
  budgetRecommendation,
  whatWorkedAnalysis,
} from "@/lib/metrics";

export default async function MonthlyReportPage() {
  const [{ meta, channelSources }, selectedChannels] = await Promise.all([
    getMultiChannelPosts(),
    getSelectedAnalyticsChannels(),
  ]);
  const brand = await getBrand();
  const audienceGrowth = await getAudienceGrowth();
  const allPosts = await getAllPosts();

  const currentMonth = getMonthPosts(allPosts, 0);
  const priorMonth = getMonthPosts(allPosts, 1);
  const posts = currentMonth.posts;
  const priorAndCurrent = [...currentMonth.posts, ...priorMonth.posts];

  const summary = buildReportSummary(posts);
  const beats = beatPerformance(posts);
  const recommendations = posts.map(budgetRecommendation);
  const analysis = whatWorkedAnalysis(posts, 0);
  const currentWeeks = groupByWeek(posts);
  const priorWeeks = groupByWeek(priorMonth.posts);

  const currentWeekSummary = summarizeWeekBuckets(currentWeeks);
  const priorWeekSummary = summarizeWeekBuckets(priorWeeks);

  return (
    <>
      <Header
        title="Monthly Report"
        subtitle={`${brand.name} · ${currentMonth.label} · Full-month performance summary`}
        actions={
          <ExportButtons
            posts={priorAndCurrent}
            reportTitle="Monthly Social Media Report"
            filenameBase="monthly-report"
            pptxData={{
              timeframe: "monthly",
              title: "Monthly Social Media Report",
              subtitle: `${brand.name} · ${currentMonth.label}`,
              brandName: brand.name,
              summary,
              posts,
              weeks: weekRowsFromBuckets(currentWeeks),
              priorWeeks: weekRowsFromBuckets(priorWeeks),
              currentMonth: monthRowFromBucket(currentMonth),
              priorMonth: monthRowFromBucket(priorMonth),
              currentPeriod: periodFromSummary(
                "Current month",
                currentMonth.dateRange,
                currentMonth
              ),
              priorPeriod: periodFromSummary(
                "Prior month",
                priorMonth.dateRange,
                priorMonth
              ),
              beats,
              whatWorked: analysis,
              competitors: brand.competitors,
            }}
          />
        }
      />

      <div className="space-y-8 p-8" id="report-content">
        <DataSyncPanel
          initialMeta={meta ?? null}
          channelSources={channelSources}
        />

        <ReportDataBanner
          timeframe="Monthly"
          postCount={posts.length}
          companyName={brand.name}
          provider={meta?.channels?.linkedin?.provider}
          selectedChannels={selectedChannels}
        />

        <MonthComparisonPanel current={currentMonth} prior={priorMonth} />

        <SplitWeeklyPerformancePanel
          current={{
            label: `Current month · ${currentMonth.label}`,
            dateRange: currentMonth.dateRange,
            weeks: currentWeeks,
          }}
          prior={{
            label: `Prior month · ${priorMonth.label}`,
            dateRange: priorMonth.dateRange,
            weeks: priorWeeks,
          }}
        />

        <NarrativeSection
          posts={priorAndCurrent}
          maxDays={60}
          arcTitle={`${brand.name} narrative arc — current & prior month`}
          subtitle="Every post mapped by date and engagement intensity. Each node is colored by story beat: Brand Vision, Scientific Innovation, Patient-Centered, Disease Awareness, Corporate Citizenship, People & Culture, and Policy Advocacy."
        />

        <ReportStats summary={summary} />

        <div className="grid gap-6 lg:grid-cols-2">
          <OrganicPaidBreakdown summary={summary} />
          <BeatRanking beats={beats} />
        </div>

        <CompetitorBenchmark
          competitors={brand.competitors}
          brandEngagementRate={summary.avgEngagementRate}
          brandName={brand.name}
        />

        <BudgetRecommendations posts={posts} recommendations={recommendations} />

        <WhatWorkedAnalysis worked={analysis.worked} didNot={analysis.didNot} timeframeLabel={analysis.timeframeLabel} sunsetCandidates={analysis.sunsetCandidates} />

        <div className="grid gap-6 lg:grid-cols-2">
          <AudienceGrowthChart data={audienceGrowth} />
          <SpendPerformanceChart posts={posts} />
        </div>

      </div>
    </>
  );
}
