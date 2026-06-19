"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ANALYTICS_CHANNELS } from "@/lib/analytics/channels";
import { PlatformIcon, PLATFORM_COLORS } from "@/components/ui/PlatformIcon";
import type { Platform } from "@/lib/types";

export function ChannelSubnav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-brand-ink/10 bg-white px-8">
      <nav className="flex gap-1 overflow-x-auto py-3">
        {ANALYTICS_CHANNELS.map((channel) => {
          const active =
            channel.id === "all"
              ? pathname === "/reports/channels"
              : pathname === channel.href;
          const iconColor = active
            ? PLATFORM_COLORS[channel.platform ?? "all"]
            : "#5a6a82";

          return (
            <Link
              key={channel.id}
              href={channel.href}
              className={clsx(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-indigo/8 text-brand-indigo"
                  : "text-brand-muted hover:bg-brand-off-white hover:text-brand-ink"
              )}
            >
              <span style={{ color: iconColor }}>
                <PlatformIcon
                  platform={(channel.platform as Platform) ?? "all"}
                  size={14}
                />
              </span>
              {channel.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
