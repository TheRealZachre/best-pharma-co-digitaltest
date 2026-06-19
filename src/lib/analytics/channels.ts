import type { AnalyticsChannel, Platform } from "@/lib/types";
import { SOCIAL_DEFAULTS } from "@/lib/client";

export interface ChannelConfig {
  id: AnalyticsChannel;
  platform: Platform | null;
  label: string;
  href: string;
  color: string;
  handle: string;
  followers: number;
}

export const ANALYTICS_CHANNELS: ChannelConfig[] = [
  {
    id: "all",
    platform: null,
    label: "All Channels",
    href: "/reports/channels",
    color: "#0093D0",
    handle: `@${SOCIAL_DEFAULTS.instagramHandle}`,
    followers: 0,
  },
  {
    id: "linkedin",
    platform: "linkedin",
    label: "LinkedIn",
    href: "/reports/channels/linkedin",
    color: "#0A66C2",
    handle: `@${SOCIAL_DEFAULTS.linkedinCompanySlug}`,
    followers: 2100000,
  },
  {
    id: "instagram",
    platform: "instagram",
    label: "Instagram",
    href: "/reports/channels/instagram",
    color: "#E1306C",
    handle: `@${SOCIAL_DEFAULTS.instagramHandle}`,
    followers: 245000,
  },
  {
    id: "facebook",
    platform: "facebook",
    label: "Facebook",
    href: "/reports/channels/facebook",
    color: "#1877F2",
    handle: `@${SOCIAL_DEFAULTS.facebookUrl.split("/").filter(Boolean).pop()}`,
    followers: 420000,
  },
  {
    id: "x",
    platform: "x",
    label: "X",
    href: "/reports/channels/x",
    color: "#0F1419",
    handle: `@${SOCIAL_DEFAULTS.xHandle}`,
    followers: 385000,
  },
  {
    id: "youtube",
    platform: "youtube",
    label: "YouTube",
    href: "/reports/channels/youtube",
    color: "#FF0000",
    handle: SOCIAL_DEFAULTS.youtubeChannel,
    followers: 128000,
  },
  {
    id: "tiktok",
    platform: "tiktok",
    label: "TikTok",
    href: "/reports/channels/tiktok",
    color: "#010101",
    handle: `@${SOCIAL_DEFAULTS.tiktokHandle}`,
    followers: 250000,
  },
];

export const ANALYTICS_CHANNEL_PLATFORMS: Platform[] = [
  "linkedin",
  "instagram",
  "facebook",
  "x",
  "youtube",
  "tiktok",
];

export function getChannelConfig(
  channel: AnalyticsChannel
): ChannelConfig | undefined {
  return ANALYTICS_CHANNELS.find((c) => c.id === channel);
}

export function getChannelConfigByPlatform(
  platform: Platform
): ChannelConfig | undefined {
  return ANALYTICS_CHANNELS.find((c) => c.platform === platform);
}

export function isAnalyticsPlatform(value: string): value is Platform {
  return ANALYTICS_CHANNEL_PLATFORMS.includes(value as Platform);
}
