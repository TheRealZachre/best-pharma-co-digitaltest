import { ChannelOverviewGrid } from "@/components/analytics/ChannelOverviewGrid";
import { buildAllChannelSummaries } from "@/lib/analytics/summaries";
import type { Platform, SocialPost } from "@/lib/types";

interface ReportChannelOverviewProps {
  posts: SocialPost[];
  channelSources: Partial<Record<Platform, "live" | "seed">>;
  channelFollowers?: Partial<Record<Platform, number>>;
  selectedChannels: Platform[];
  title?: string;
  subtitle?: string;
}

export function ReportChannelOverview({
  posts,
  channelSources,
  channelFollowers,
  selectedChannels,
  title = "Performance by channel",
  subtitle = "LinkedIn, Instagram, Facebook, X, YouTube, and TikTok for this report period",
}: ReportChannelOverviewProps) {
  const channels = buildAllChannelSummaries(
    posts,
    channelSources,
    channelFollowers
  ).filter((channel) => selectedChannels.includes(channel.platform));

  if (channels.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-brand-ink">{title}</h2>
        <p className="mt-1 text-sm text-brand-muted">{subtitle}</p>
      </div>
      <ChannelOverviewGrid channels={channels} />
    </section>
  );
}
