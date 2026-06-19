import { formatChannelList } from "@/lib/analytics/channel-selection";
import { formatDisplayProvider } from "@/lib/format-display-provider";
import type { Platform } from "@/lib/types";

interface ReportDataBannerProps {
  timeframe: string;
  postCount: number;
  companyName: string;
  provider?: string;
  selectedChannels?: Platform[];
}

export function ReportDataBanner({
  timeframe,
  postCount,
  companyName,
  provider,
  selectedChannels,
}: ReportDataBannerProps) {
  const channelScope = selectedChannels
    ? formatChannelList(selectedChannels)
    : "all channels";
  const providerLabel = formatDisplayProvider(provider);

  return (
    <p className="rounded-lg border border-indigo-100 bg-brand-indigo/8 px-4 py-3 text-sm text-indigo-800">
      {timeframe} report for <strong>{companyName}</strong> — {postCount}{" "}
      {postCount === 1 ? "post" : "posts"} from {channelScope}
      {providerLabel ? ` (${providerLabel})` : ""}. Metrics include reactions, comments,
      and reposts from public posts.
    </p>
  );
}
