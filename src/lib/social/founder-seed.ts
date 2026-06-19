import { subDays } from "date-fns";
import { inferStoryBeat } from "@/lib/narrative/beats";
import type { SocialPost } from "@/lib/types";

const now = new Date();

function makeFounderPost(
  id: string,
  platform: "linkedin" | "x",
  daysBack: number,
  caption: string,
  reach: number
): SocialPost {
  const impressions = Math.round(reach * 1.4);
  const likes = Math.floor(reach * 0.045);
  const comments = Math.floor(likes * 0.12);
  const shares = Math.floor(likes * (platform === "x" ? 0.18 : 0.08));
  const clicks = Math.floor(impressions * 0.015);

  return {
    id,
    platform,
    category: "educational",
    storyBeat: inferStoryBeat(caption),
    type: "organic",
    publishedAt: subDays(now, daysBack).toISOString(),
    caption,
    imageUrl: `https://picsum.photos/seed/founder-${id}/600/600`,
    metrics: {
      impressions,
      reach,
      likes,
      comments,
      shares,
      saves: 0,
      clicks,
    },
  };
}

/** Fictional CEO social posts for demo purposes. */
export function generateFounderSeedPosts(): SocialPost[] {
  return [
    makeFounderPost(
      "em-li-1",
      "linkedin",
      42,
      "Honored to share our Q1 results today: $14.2B in revenue, driven by colleagues who put patients at the center of every decision. Thank you to the Best Pharma team worldwide.",
      85000
    ),
    makeFounderPost(
      "em-li-2",
      "linkedin",
      35,
      "Priority Review for BPC-401 is a milestone years in the making. To every patient and investigator who made this possible — we don't take your trust lightly.",
      120000
    ),
    makeFounderPost(
      "em-li-3",
      "linkedin",
      28,
      "Spent the morning with our Patient Advisory Council. Their lived experience sharpens our trials, our access programs, and our accountability.",
      67000
    ),
    makeFounderPost(
      "em-li-4",
      "linkedin",
      21,
      "ASCO week reminds me why I chose this industry: science that changes outcomes, communicated with honesty and respect for the clinicians who deliver care.",
      94000
    ),
    makeFounderPost(
      "em-li-5",
      "linkedin",
      14,
      "Proud of our Great Place to Work certification. Culture isn't perks — it's psychological safety to challenge assumptions and do rigorous science.",
      78000
    ),
    makeFounderPost(
      "em-li-6",
      "linkedin",
      7,
      "Rare diseases affect 300 million people globally. We will keep investing where markets are small but human need is enormous.",
      56000
    ),
    makeFounderPost(
      "em-x-1",
      "x",
      40,
      "Q1 2026: strong results, stronger purpose. Grateful to Team Best Pharma. #PatientsFirst",
      42000
    ),
    makeFounderPost(
      "em-x-2",
      "x",
      32,
      "BPC-401 Priority Review — a step closer for patients with advanced NSCLC. Science + speed, never science vs. safety.",
      58000
    ),
    makeFounderPost(
      "em-x-3",
      "x",
      24,
      "Access isn't an afterthought. Best Care Access now in 14 new markets because delays cost lives.",
      35000
    ),
    makeFounderPost(
      "em-x-4",
      "x",
      16,
      "At ASCO with teams sharing data that matters. Congress season is our runway to earn clinician trust.",
      47000
    ),
    makeFounderPost(
      "em-x-5",
      "x",
      9,
      "Leaders listen first. Today's Patient Advisory Council session was a masterclass in humility.",
      31000
    ),
    makeFounderPost(
      "em-x-6",
      "x",
      3,
      "Congratulations to colleagues on our ESG report — transparency builds trust with patients, payers, and communities.",
      29000
    ),
  ];
}
