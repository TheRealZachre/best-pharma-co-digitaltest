import type { LinkedInDataProvider } from "./types";
import { SOCIAL_DEFAULTS } from "@/lib/client";

export function getLinkedInConfig() {
  const provider = (process.env.LINKEDIN_DATA_PROVIDER ??
    "apify") as LinkedInDataProvider;
  const companySlug =
    process.env.LINKEDIN_COMPANY_SLUG ?? SOCIAL_DEFAULTS.linkedinCompanySlug;

  return {
    provider,
    companySlug,
    apifyToken: process.env.APIFY_TOKEN,
    linkedinAccessToken: process.env.LINKEDIN_ACCESS_TOKEN,
    linkedinOrganizationId: process.env.LINKEDIN_ORGANIZATION_ID,
    maxPosts: Number(process.env.LINKEDIN_MAX_POSTS ?? "30"),
  };
}
