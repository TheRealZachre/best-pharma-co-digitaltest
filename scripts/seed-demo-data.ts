#!/usr/bin/env tsx
/**
 * Writes demo cache JSON files for Best Pharma Co.
 * Run: npx tsx scripts/seed-demo-data.ts
 */
import { writeFileSync } from "fs";
import { join } from "path";
import { CLIENT_SLUG, CEO } from "../src/lib/client";
import { generateChannelSeedPosts } from "../src/lib/analytics/channel-seed";
import { normalizeLinkedInPost } from "../src/lib/linkedin/normalize";
import { fetchPostsFromSeed } from "../src/lib/linkedin/providers/seed";
import { generateFounderSeedPosts } from "../src/lib/social/founder-seed";
import type { SocialPost } from "../src/lib/types";

const dataDir = join(process.cwd(), "data");
const syncedAt = new Date().toISOString();

async function main() {
  const linkedInRaw = await fetchPostsFromSeed();
  const linkedInPosts = linkedInRaw.map(normalizeLinkedInPost);
  const channelPosts = generateChannelSeedPosts();
  const allPosts: SocialPost[] = [...linkedInPosts, ...channelPosts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const linkedinCache = {
    meta: {
      syncedAt,
      companySlug: CLIENT_SLUG,
      provider: "seed",
      dataSource: "seed",
      postCount: linkedInPosts.length,
      followers: 2100000,
    },
    posts: linkedInPosts,
  };

  const socialCache = {
    meta: {
      syncedAt,
      companySlug: CLIENT_SLUG,
      channels: {
        linkedin: {
          postCount: linkedInPosts.length,
          followers: 2100000,
          provider: "seed",
          dataSource: "seed",
          syncedAt,
        },
        instagram: {
          postCount: channelPosts.filter((p) => p.platform === "instagram")
            .length,
          followers: 245000,
          provider: "seed",
          dataSource: "seed",
          syncedAt,
        },
        facebook: {
          postCount: channelPosts.filter((p) => p.platform === "facebook")
            .length,
          followers: 420000,
          provider: "seed",
          dataSource: "seed",
          syncedAt,
        },
        x: {
          postCount: channelPosts.filter((p) => p.platform === "x").length,
          followers: 385000,
          provider: "seed",
          dataSource: "seed",
          syncedAt,
        },
        youtube: {
          postCount: channelPosts.filter((p) => p.platform === "youtube")
            .length,
          followers: 128000,
          provider: "seed",
          dataSource: "seed",
          syncedAt,
        },
        tiktok: {
          postCount: channelPosts.filter((p) => p.platform === "tiktok").length,
          followers: 250000,
          provider: "seed",
          dataSource: "seed",
          syncedAt,
        },
      },
    },
    posts: allPosts,
  };

  const founderPosts = generateFounderSeedPosts();
  const founderCache = {
    meta: {
      syncedAt,
      companySlug: CEO.slug,
      channels: {
        linkedin: {
          postCount: founderPosts.filter((p) => p.platform === "linkedin")
            .length,
          followers: 185000,
          provider: "seed",
          dataSource: "seed",
          syncedAt,
        },
        x: {
          postCount: founderPosts.filter((p) => p.platform === "x").length,
          followers: 92000,
          provider: "seed",
          dataSource: "seed",
          syncedAt,
        },
      },
    },
    posts: founderPosts,
  };

  writeFileSync(
    join(dataDir, "linkedin-posts.json"),
    JSON.stringify(linkedinCache, null, 2)
  );
  writeFileSync(
    join(dataDir, "social-posts.json"),
    JSON.stringify(socialCache, null, 2)
  );
  writeFileSync(
    join(dataDir, "founder-social-posts.json"),
    JSON.stringify(founderCache, null, 2)
  );

  console.log("Demo data written:");
  console.log(`  linkedin-posts.json — ${linkedInPosts.length} posts`);
  console.log(`  social-posts.json — ${allPosts.length} posts`);
  console.log(`  founder-social-posts.json — ${founderPosts.length} posts`);
}

void main();
