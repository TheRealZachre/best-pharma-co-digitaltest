"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ChannelSelector } from "@/components/dashboard/ChannelSelector";
import { ANALYTICS_CHANNEL_PLATFORMS } from "@/lib/analytics/channels";
import {
  ANALYTICS_CHANNELS_STORAGE_KEY,
  CHANNEL_LABELS,
  parseAnalyticsChannels,
} from "@/lib/analytics/channel-selection";
import { sanitizeUserFacingText } from "@/lib/format-display-provider";
import { formatFollowerCount } from "@/lib/social/followers";
import type { Platform } from "@/lib/types";

interface ChannelMeta {
  postCount: number;
  followers?: number;
  provider: string;
  dataSource: "live" | "seed" | "error";
  error?: string;
  syncedAt?: string;
}

interface SyncMeta {
  syncedAt: string;
  companySlug: string;
  postCount: number;
  channels?: Partial<Record<Platform, ChannelMeta>>;
}

interface DataSyncPanelProps {
  initialMeta?: SyncMeta | null;
  channelSources?: Partial<Record<Platform, "live" | "seed">>;
  showChannelSelector?: boolean;
  syncUrl?: string;
  availableChannels?: Platform[];
  note?: string;
}

function readSelectedChannels(): Platform[] {
  return parseAnalyticsChannels(
    localStorage.getItem(ANALYTICS_CHANNELS_STORAGE_KEY)
  );
}

export function DataSyncPanel({
  initialMeta,
  channelSources,
  showChannelSelector = true,
  syncUrl = "/api/sync/social",
  availableChannels,
  note,
}: DataSyncPanelProps) {
  const channelList = availableChannels ?? ANALYTICS_CHANNEL_PLATFORMS;
  const [meta, setMeta] = useState(initialMeta);
  const [sources, setSources] = useState(channelSources);
  const [selectedChannels, setSelectedChannels] = useState<Platform[]>(() => [
    ...(availableChannels ?? ANALYTICS_CHANNEL_PLATFORMS),
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only read from localStorage when no explicit channel list is provided
    if (!availableChannels) {
      setSelectedChannels(readSelectedChannels());
    }
  }, [availableChannels]);

  const liveCount = channelList.filter(
    (platform) => sources?.[platform] === "live"
  ).length;

  async function handleSync() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(syncUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels: selectedChannels }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Sync failed");
      }

      const channelMeta = data.meta?.channels as
        | Partial<Record<Platform, ChannelMeta>>
        | undefined;

      setMeta({
        syncedAt: data.meta.syncedAt,
        companySlug: data.meta.companySlug,
        postCount: data.postCount,
        channels: channelMeta,
      });

      const nextSources: Partial<Record<Platform, "live" | "seed">> = {};
      for (const platform of ANALYTICS_CHANNEL_PLATFORMS) {
        const source = channelMeta?.[platform]?.dataSource;
        if (source === "live") nextSources[platform] = "live";
        else if (source === "seed") nextSources[platform] = "seed";
      }
      setSources(nextSources);

      window.location.reload();
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
      setLoading(false);
    }
  }

  const syncLabel =
    selectedChannels.length === channelList.length
      ? "Pull Latest Data"
      : `Pull ${selectedChannels.length} Channel${selectedChannels.length === 1 ? "" : "s"}`;

  return (
    <div className="rounded-xl border border-brand-ink/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-ink">
            Social Data Source
          </h3>
          <p className="mt-1 text-sm text-brand-muted">
            {meta ? (
              <>
                {meta.postCount} posts from{" "}
                <span className="font-medium text-brand-ink/80">
                  {meta.companySlug}
                </span>{" "}
                · last synced {new Date(meta.syncedAt).toLocaleString()}
                {liveCount > 0 && (
                  <span className="text-emerald-700">
                    {" "}
                    · {liveCount} of {channelList.length}{" "}
                    channels live
                  </span>
                )}
              </>
            ) : (
              "Using seed data for most channels. Sync to pull live posts from connected channels."
            )}
          </p>
          {meta?.channels && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {channelList.map((platform) => {
                const channel = meta.channels?.[platform];
                const isLive =
                  channel?.dataSource === "live" ||
                  sources?.[platform] === "live";
                const failed = channel?.dataSource === "error";
                const isIncluded = selectedChannels.includes(platform);
                const details = [
                  channel?.postCount != null ? `${channel.postCount} posts` : null,
                  channel?.followers != null && channel.followers > 0
                    ? `${formatFollowerCount(channel.followers)} followers`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <li
                    key={platform}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      !isIncluded
                        ? "bg-brand-off-white text-brand-muted/60 line-through"
                        : isLive
                          ? "bg-emerald-100 text-emerald-800"
                          : failed
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {CHANNEL_LABELS[platform]}
                    {details ? ` (${details})` : ""}
                  </li>
                );
              })}
            </ul>
          )}
          {note && (
            <p className="mt-2 text-xs text-brand-muted/60">{note}</p>
          )}
          {error && (
            <p className="mt-2 text-sm text-rose-600">
              {sanitizeUserFacingText(error)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={loading || selectedChannels.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? `Syncing ${selectedChannels.length} channels…` : syncLabel}
        </button>
      </div>

      {showChannelSelector && (
        <ChannelSelector
          channelSources={sources}
          onChange={setSelectedChannels}
        />
      )}
    </div>
  );
}
