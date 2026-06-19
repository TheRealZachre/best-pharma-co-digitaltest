"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { PlatformIcon, PLATFORM_COLORS } from "@/components/ui/PlatformIcon";
import type { Platform } from "@/lib/types";

const FOUNDER_CHANNELS = [
  { id: "all" as const, label: "All Channels", href: "/founder/reports/channels", platform: null },
  { id: "linkedin" as const, label: "LinkedIn", href: "/founder/reports/channels/linkedin", platform: "linkedin" as Platform },
  { id: "x" as const, label: "X", href: "/founder/reports/channels/x", platform: "x" as Platform },
];

export function FounderChannelSubnav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-brand-ink/10 bg-white px-8">
      <nav className="flex gap-1 overflow-x-auto py-3">
        {FOUNDER_CHANNELS.map((channel) => {
          const active =
            channel.id === "all"
              ? pathname === "/founder/reports/channels"
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
                  ? "bg-brand-indigo/10 text-brand-indigo font-semibold"
                  : "text-brand-muted hover:bg-brand-off-white hover:text-brand-ink"
              )}
            >
              <span style={{ color: iconColor }}>
                <PlatformIcon platform={channel.platform ?? "all"} size={14} />
              </span>
              {channel.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
