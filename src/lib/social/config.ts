import type { SocialChannel } from "./types";
import { SOCIAL_DEFAULTS } from "@/lib/client";

export function getSocialConfig() {
  const maxPosts = Number(process.env.SOCIAL_MAX_POSTS_PER_CHANNEL ?? "50");

  return {
    companySlug:
      process.env.LINKEDIN_COMPANY_SLUG ?? SOCIAL_DEFAULTS.linkedinCompanySlug,
    apifyToken: process.env.APIFY_TOKEN,
    maxPosts,
    channels: {
      linkedin: {
        handle:
          process.env.LINKEDIN_COMPANY_SLUG ??
          SOCIAL_DEFAULTS.linkedinCompanySlug,
      },
      instagram: {
        handle:
          process.env.SOCIAL_INSTAGRAM_HANDLE ?? SOCIAL_DEFAULTS.instagramHandle,
      },
      facebook: {
        url: process.env.SOCIAL_FACEBOOK_URL ?? SOCIAL_DEFAULTS.facebookUrl,
      },
      x: {
        handle: process.env.SOCIAL_X_HANDLE ?? SOCIAL_DEFAULTS.xHandle,
      },
      youtube: {
        channel:
          process.env.SOCIAL_YOUTUBE_CHANNEL ?? SOCIAL_DEFAULTS.youtubeChannel,
      },
      tiktok: {
        handle:
          process.env.SOCIAL_TIKTOK_HANDLE ?? SOCIAL_DEFAULTS.tiktokHandle,
      },
    } satisfies Record<SocialChannel, { handle?: string; url?: string; channel?: string }>,
  };
}
