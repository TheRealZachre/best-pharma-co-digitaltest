import { runApifyActor } from "@/lib/social/apify";

const ACTOR = "apimaestro/linkedin-company-detail";

function parseFollowerCount(record: Record<string, unknown>): number | undefined {
  const stats = record.stats as Record<string, unknown> | undefined;
  const basicInfo = record.basic_info as Record<string, unknown> | undefined;
  const companyInfo = record.company as Record<string, unknown> | undefined;

  const candidates = [
    stats?.follower_count,
    stats?.followers,
    stats?.followerCount,
    basicInfo?.follower_count,
    basicInfo?.followers,
    companyInfo?.follower_count,
    companyInfo?.followers,
    record.follower_count,
    record.followers,
    record.followerCount,
  ];

  for (const value of candidates) {
    const count = Number(value);
    if (Number.isFinite(count) && count > 0) return Math.round(count);
  }

  return undefined;
}

export function parseFollowersFromApifyPostRecords(
  records: Record<string, unknown>[]
): number | undefined {
  for (const record of records) {
    const author = record.author as Record<string, unknown> | undefined;
    const company = record.company as Record<string, unknown> | undefined;

    const candidates = [
      author?.follower_count,
      author?.followers,
      author?.followerCount,
      company?.follower_count,
      company?.followers,
      record.follower_count,
      record.followers,
    ];

    for (const value of candidates) {
      const count = Number(value);
      if (Number.isFinite(count) && count > 0) return Math.round(count);
    }
  }

  return undefined;
}

export async function fetchLinkedInCompanyFollowers(
  companySlug: string,
  token: string
): Promise<number | undefined> {
  const identifiers = [
    `https://www.linkedin.com/company/${companySlug}/`,
    companySlug,
  ];

  for (const identifier of identifiers) {
    try {
      const records = await runApifyActor<Record<string, unknown>>(
        ACTOR,
        { identifier: [identifier] },
        token,
        90_000
      );

      for (const record of records) {
        const count = parseFollowerCount(record);
        if (count) return count;
      }
    } catch {
      // Try the next identifier format.
    }
  }

  return undefined;
}
