"use client";

import { useEffect, useState } from "react";
import {
  ANALYTICS_CHANNELS_COOKIE,
  ANALYTICS_CHANNELS_STORAGE_KEY,
  CHANNEL_LABELS,
  parseAnalyticsChannels,
} from "@/lib/analytics/channel-selection";
import { ANALYTICS_CHANNEL_PLATFORMS } from "@/lib/analytics/channels";
import type { Platform } from "@/lib/types";
import clsx from "clsx";

interface ChannelSelectorProps {
  channelSources?: Partial<Record<Platform, "live" | "seed">>;
  onChange?: (channels: Platform[]) => void;
}

function readInitialChannels(): Platform[] {
  const stored = localStorage.getItem(ANALYTICS_CHANNELS_STORAGE_KEY);
  return parseAnalyticsChannels(stored);
}

function persistSelectedChannels(channels: Platform[]) {
  const encoded = encodeURIComponent(JSON.stringify(channels));
  localStorage.setItem(ANALYTICS_CHANNELS_STORAGE_KEY, JSON.stringify(channels));
  document.cookie = `${ANALYTICS_CHANNELS_COOKIE}=${encoded};path=/;max-age=31536000;SameSite=Lax`;
}

export function ChannelSelector({
  channelSources,
  onChange,
}: ChannelSelectorProps) {
  const [selected, setSelected] = useState<Platform[]>(() => [
    ...ANALYTICS_CHANNEL_PLATFORMS,
  ]);

  useEffect(() => {
    const initial = readInitialChannels();
    setSelected(initial);
    onChange?.(initial);
  }, [onChange]);

  function updateChannels(next: Platform[]) {
    setSelected(next);
    persistSelectedChannels(next);
    onChange?.(next);
  }

  function toggleChannel(platform: Platform) {
    const isSelected = selected.includes(platform);
    if (isSelected && selected.length === 1) return;

    const next = isSelected
      ? selected.filter((item) => item !== platform)
      : [...selected, platform];

    updateChannels(next);
    window.location.reload();
  }

  function selectAll() {
    updateChannels([...ANALYTICS_CHANNEL_PLATFORMS]);
    window.location.reload();
  }

  const allSelected =
    selected.length === ANALYTICS_CHANNEL_PLATFORMS.length;

  return (
    <div className="mt-4 border-t border-brand-ink/8 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-brand-ink">
            Channels for analytics
          </h4>
          <p className="mt-0.5 text-xs text-brand-muted">
            Select which channels to include in reports and sync. At least one
            channel must stay enabled.
          </p>
        </div>
        {!allSelected && (
          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-medium text-brand-indigo hover:text-indigo-800"
          >
            Select all
          </button>
        )}
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {ANALYTICS_CHANNEL_PLATFORMS.map((platform) => {
          const isSelected = selected.includes(platform);
          const isLive = channelSources?.[platform] === "live";

          return (
            <li key={platform}>
              <button
                type="button"
                onClick={() => toggleChannel(platform)}
                aria-pressed={isSelected}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  isSelected
                    ? "border-indigo-300 bg-brand-indigo/8 text-indigo-900"
                    : "border-brand-ink/10 bg-white text-brand-muted hover:border-slate-300"
                )}
              >
                <span
                  className={clsx(
                    "flex h-4 w-4 items-center justify-center rounded border text-[10px]",
                    isSelected
                      ? "border-brand-indigo bg-brand-indigo/80 text-white"
                      : "border-slate-300 bg-white text-transparent"
                  )}
                >
                  ✓
                </span>
                {CHANNEL_LABELS[platform]}
                {isLive && (
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Live
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-2 text-xs text-brand-muted/60">
        {selected.length} of {ANALYTICS_CHANNEL_PLATFORMS.length} channels
        selected for analytics
        {!allSelected && (
          <>
            {" "}
            ·{" "}
            <span className="text-brand-muted">
              Reports exclude deselected channels until you re-enable them.
            </span>
          </>
        )}
      </p>
    </div>
  );
}
