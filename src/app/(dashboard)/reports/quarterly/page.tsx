import { format, subDays } from "date-fns";
import { Header } from "@/components/layout/Header";
import { DataSyncPanel } from "@/components/dashboard/DataSyncPanel";
import { ReportDataBanner } from "@/components/dashboard/ReportDataBanner";
import { ExportButtons } from "@/components/dashboard/ExportButtons";
import { ReportStats } from "@/components/dashboard/ReportStats";
import { ReportPostsGrid } from "@/components/dashboard/ReportPostsGrid";
import { CategoryRanking } from "@/components/dashboard/CategoryRanking";
import { CompetitorBenchmark } from "@/components/dashboard/CompetitorBenchmark";
import { WhatWorkedAnalysis } from "@/components/dashboard/WhatWorkedAnalysis";
import { AudienceGrowthChart } from "@/components/dashboard/AudienceGrowthChart";
import { NarrativeSection } from "@/components/narrative/NarrativeSection";
import { QuarterlyMonthTrend } from "@/components/narrative/QuarterlyMonthTrend";
import { WeeklyPerformancePanel } from "@/components/narrative/WeeklyPerformancePanel";
import { getMonthPosts, groupByWeek } from "@/lib/narrative/aggregate";
import { getSelectedAnalyticsChannels } from "@/lib/analytics/channel-selection.server";
import { weekRowsFromBuckets, monthRowFromBucket, periodFromPosts } from "@/lib/export-pptx-types";
import {
  buildReportSummary,
  getAllPosts,
  getAudienceGrowth,
  getBrand,
  getMultiChannelPosts,
  getPostsForTimeframe,
} from "@/lib/data";
import {
  categoryPerformance,
  formatCurrency,
  formatPercent,
  whatWorkedAnalysis,
} from "@/lib/metrics";
import { Lightbulb, Target, TrendingUp } from "lucide-react";

export default async function QuarterlyReportPage() {
  const [{ meta, channelSources }, selectedChannels] = await Promise.all([
    getMultiChannelPosts(),
    getSelectedAnalyticsChannels(),
  ]);
  const brand = await getBrand();
  const audienceGrowth = await getAudienceGrowth();
  const allPosts = await getAllPosts();
  const posts = await getPostsForTimeframe("quarterly");
  const summary = buildReportSummary(posts);
  const quarterMonths = [0, 1, 2].map((m) => getMonthPosts(allPosts, m));
  const quarterWeeks = groupByWeek(posts);
  const categories = categoryPerformance(posts);
  const analysis = whatWorkedAnalysis(posts, 0);
  const quarterStart = subDays(new Date(), 90);
  const priorQuarterStart = subDays(new Date(), 180);
  const priorQuarterEnd = quarterStart;
  const priorQuarterPosts = allPosts.filter((p) => {
    const d = new Date(p.publishedAt);
    return d >= priorQuarterStart && d < priorQuarterEnd;
  });
  const currentQuarterRange = `${format(quarterStart, "MMMM d")} – ${format(new Date(), "MMMM d, yyyy")}`;
  const priorQuarterRange = `${format(priorQuarterStart, "MMMM d")} – ${format(subDays(priorQuarterEnd, 1), "MMMM d, yyyy")}`;

  const recommendations = [
    `Increase investment in ${categories[0]?.category ?? "top"} content — highest engagement at ${formatPercent(categories[0]?.avgEngagementRate ?? 0)}`,
    `Allocate ${formatCurrency(2500)} toward boosting top 3 organic performers next quarter`,
    `Close the engagement gap with ${brand.competitors[3]?.name ?? "top competitor"} (${formatPercent(brand.competitors[3]?.avgEngagementRate ?? 0)} ER) through educational content`,
    `Reduce promotional post frequency — lowest category engagement this quarter`,
  ];

  return (
    <>
      <Header
        title="Quarterly One-Pager"
        subtitle={`${brand.name} · Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${format(new Date(), "yyyy")} · Executive Summary`}
        actions={
          <ExportButtons
            posts={posts}
            reportTitle="Quarterly Executive Summary"
            filenameBase="quarterly-report"
            pptxData={{
              timeframe: "quarterly",
              title: "Quarterly Executive Summary",
              subtitle: `${brand.name} · Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${format(new Date(), "yyyy")}`,
              brandName: brand.name,
              summary,
              posts,
              weeks: weekRowsFromBuckets(quarterWeeks),
              quarterMonths: quarterMonths.map((m) => monthRowFromBucket(m)),
              currentPeriod: periodFromPosts(
                "Current quarter",
                currentQuarterRange,
                posts
              ),
              priorPeriod: periodFromPosts(
                "Prior quarter",
                priorQuarterRange,
                priorQuarterPosts
              ),
              categories,
              whatWorked: analysis,
              recommendations,
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
          timeframe="Quarterly"
          postCount={posts.length}
          companyName={brand.name}
          provider={meta?.channels?.linkedin?.provider}
          selectedChannels={selectedChannels}
        />

        <QuarterlyMonthTrend months={quarterMonths} />

        <WeeklyPerformancePanel
          weeks={quarterWeeks}
          title="Weekly performance across the quarter"
        />

        <NarrativeSection
          posts={posts}
          maxDays={90}
          arcTitle={`${brand.name} quarterly narrative arc`}
          subtitle="Every post in the last 90 days plotted by date and engagement intensity, colored by story beat."
        />

        <div className="rounded-xl border-2 border-slate-900 bg-slate-900 p-8 text-white">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-muted/60">
            Executive Summary
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            {brand.name} — Social Performance at a Glance
          </h2>
          <p className="mt-3 max-w-3xl text-slate-300">
            {format(quarterStart, "MMMM d")} – {format(new Date(), "MMMM d, yyyy")}.
            Published {summary.totalPosts} posts across organic and paid channels,
            reaching {summary.totalReach.toLocaleString()} users with an average
            engagement rate of {formatPercent(summary.avgEngagementRate)}.
            Audience grew by {summary.audienceGrowth.toLocaleString()} followers
            this quarter.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <ExecutiveMetric
              icon={TrendingUp}
              label="Engagement Trend"
              value={formatPercent(summary.avgEngagementRate)}
              detail="Above industry avg (2.5%)"
            />
            <ExecutiveMetric
              icon={Target}
              label="Highest-ROI Category"
              value={categories[0]?.category ?? "—"}
              detail={`${formatPercent(categories[0]?.avgEngagementRate ?? 0)} avg ER`}
            />
            <ExecutiveMetric
              icon={Lightbulb}
              label="Total Invested"
              value={formatCurrency(summary.totalSpend)}
              detail={`${summary.paidPosts} paid/boosted posts`}
            />
          </div>
        </div>

        <ReportStats summary={summary} />

        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryRanking categories={categories} />
          <CompetitorBenchmark
            competitors={brand.competitors}
            brandEngagementRate={summary.avgEngagementRate}
            brandName={brand.name}
          />
        </div>

        <WhatWorkedAnalysis worked={analysis.worked} didNot={analysis.didNot} timeframeLabel={analysis.timeframeLabel} sunsetCandidates={analysis.sunsetCandidates} />

        <section className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-brand-ink">
            Strategic Recommendations
          </h3>
          <ol className="mt-4 space-y-3">
            {recommendations.map((rec, i) => (
              <li
                key={rec}
                className="flex items-start gap-3 text-sm text-brand-ink/80"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-indigo/12 text-xs font-bold text-brand-indigo">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ol>
        </section>

        <AudienceGrowthChart data={audienceGrowth} />

        <ReportPostsGrid
          posts={posts}
          title="Quarterly creative gallery"
          emptyMessage="No posts in the last 90 days. Pull latest data to populate this report."
          defaultSort="engagement"
        />
      </div>
    </>
  );
}

function ExecutiveMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg bg-white/10 p-4">
      <Icon className="h-5 w-5 text-indigo-300" />
      <p className="mt-2 text-xs uppercase tracking-wide text-brand-muted/60">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold capitalize">{value}</p>
      <p className="mt-1 text-xs text-brand-muted/60">{detail}</p>
    </div>
  );
}
