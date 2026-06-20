import { subDays } from "date-fns";
import { inferStoryBeat } from "@/lib/narrative/beats";
import type { Platform, PostType, SocialPost } from "@/lib/types";

const now = new Date();

const SEED_BY_PLATFORM: Record<
  Exclude<Platform, "linkedin">,
  { caption: string; category: SocialPost["category"] }[]
> = {
  instagram: [
    {
      caption:
        "ASCO season is here. 42 abstracts, four oral presentations — Best Pharma teams sharing data that moves practice forward. #TeamBestPharma #ASCO26",
      category: "behind-the-scenes",
    },
    {
      caption:
        "Maria's rheumatoid arthritis journey reminds us why access and support matter as much as science. #PatientsFirst #BestPharmaCo",
      category: "educational",
    },
    {
      caption:
        "BPC-401 Phase 3: 24-month OS data reinforcing durable benefit in first-line NSCLC. Swipe for the topline. #Oncology",
      category: "educational",
    },
    {
      caption:
        "Behind the scenes at our Hartford innovation campus — where vaccine and oncology R&D teams collaborate daily.",
      category: "behind-the-scenes",
    },
    {
      caption:
        "Rare disease R&D: fewer than 10% of rare conditions have an approved therapy. We're committed to closing that gap.",
      category: "educational",
    },
    {
      caption:
        "Our 2025 ESG report is live — carbon targets, trial diversity, and community partnerships across 40 countries.",
      category: "educational",
    },
    {
      caption:
        "#WorldImmunizationWeek — proud of colleagues advancing next-gen pneumococcal and RSV candidates.",
      category: "educational",
    },
    {
      caption:
        "Great Place to Work certified — the people behind Best Pharma Co. carry our mission every day.",
      category: "behind-the-scenes",
    },
    {
      caption:
        "Q1 2026 results: $14.2B revenue, oncology momentum, and pipeline progress. Link in bio.",
      category: "promotional",
    },
    {
      caption:
        "Reel: What Priority Review means for patients waiting on BPC-401 — our regulatory lead breaks it down.",
      category: "educational",
    },
    {
      caption:
        "Congress season recap — hematology depth and solid tumor acceleration across ASCO and EHA.",
      category: "promotional",
    },
    {
      caption:
        "Best Care Access program now in 14 new markets. Geography shouldn't determine who gets treatment.",
      category: "educational",
    },
  ],
  facebook: [
    {
      caption:
        "Best Pharma Co. at ASCO 2026 — visit our booth for lung, breast, and hematology data. Intended for healthcare professionals.",
      category: "educational",
    },
    {
      caption:
        "Maria's story: diagnosis, treatment, and life with rheumatoid arthritis — clarity and compassion from day one.",
      category: "educational",
    },
    {
      caption:
        "FDA Priority Review granted for BPC-401 in first-line NSCLC. Read the announcement on our newsroom.",
      category: "promotional",
    },
    {
      caption:
        "Long-term vaccine efficacy data presented at a major medical congress — reinforcing public health impact.",
      category: "educational",
    },
    {
      caption:
        "Live from our R&D leadership forum — advancing translational science across oncology and immunology.",
      category: "behind-the-scenes",
    },
    {
      caption:
        "World Health Day: colleagues share what #PatientsFirst means in their daily work.",
      category: "ugc",
    },
    {
      caption:
        "Best Pharma Q1 2026 financial results — strong execution across core therapeutic areas.",
      category: "promotional",
    },
    {
      caption:
        "Rare disease awareness: early diagnosis saves time to treatment. Test your knowledge in our short quiz.",
      category: "educational",
    },
    {
      caption:
        "Great Place to Work certification — culture that powers innovation at scale.",
      category: "behind-the-scenes",
    },
    {
      caption:
        "Video: Dr. James Okonkwo on moving from bench to bedside — urgency with rigor.",
      category: "educational",
    },
  ],
  x: [
    {
      caption:
        "At #ASCO26 we're sharing data that shifts the NSCLC conversation. BPC-401 durability matters. #TeamBestPharma",
      category: "educational",
    },
    {
      caption:
        "Priority Review for BPC-401 — a regulatory milestone for patients with advanced lung cancer. Press release ↓",
      category: "promotional",
    },
    {
      caption:
        "Q1 2026: $14.2B revenue, +8% YoY. Oncology and vaccines leading growth. #BestPharmaCo",
      category: "promotional",
    },
    {
      caption:
        "Patients First isn't a tagline — it's how we design trials, access programs, and support. Maria's story is why.",
      category: "educational",
    },
    {
      caption:
        "42 ASCO abstracts accepted. Hematology depth + solid tumor acceleration. #Oncology",
      category: "promotional",
    },
    {
      caption:
        "Best Care Access expanded to 14 markets. Eligible patients shouldn't wait on coverage paperwork.",
      category: "educational",
    },
    {
      caption:
        "2025 ESG report: carbon reduction, clinical diversity metrics, and community health — transparent progress.",
      category: "educational",
    },
    {
      caption:
        "AI in drug discovery: we're investing in tools that accelerate targets, not headlines. Thread 🧵",
      category: "educational",
    },
    {
      caption:
        "EHA 2026 — connect with our hematology team. Booth details for HCPs in our events hub.",
      category: "behind-the-scenes",
    },
    {
      caption:
        "Orphan drug designation for BPC-227 in a rare metabolic disorder — hope for underserved patients.",
      category: "educational",
    },
  ],
  youtube: [
    {
      caption:
        "ASCO 2026 Highlights | Best Pharma oncology data — congress recap for clinicians.",
      category: "educational",
    },
    {
      caption:
        "Maria's Story — Rheumatoid Arthritis | A patient perspective on diagnosis, treatment, and daily life.",
      category: "educational",
    },
    {
      caption:
        "BPC-401 Explained | Why 24-month OS data changes first-line NSCLC conversations.",
      category: "educational",
    },
    {
      caption:
        "Best Care Access Program | How we help eligible patients start therapy without delay.",
      category: "promotional",
    },
    {
      caption:
        "Pipeline Deep Dive | Dr. James Okonkwo on oncology and vaccine R&D priorities.",
      category: "educational",
    },
    {
      caption:
        "Q1 2026 Financial Results | CEO Elena Marshall on growth, pipeline, and patients first.",
      category: "educational",
    },
    {
      caption:
        "2025 ESG & Sustainability Report | Carbon, diversity, and community impact.",
      category: "educational",
    },
    {
      caption:
        "Behind the Science: mRNA platform | How our vaccine research teams approach next-gen candidates.",
      category: "educational",
    },
    {
      caption:
        "EHA 2026 Booth Tour | Hematology community and new data from Team Best Pharma.",
      category: "behind-the-scenes",
    },
    {
      caption:
        "Rare Disease Awareness | Why orphan drug investment matters — with Best Pharma medical leaders.",
      category: "educational",
    },
  ],
  tiktok: [
    {
      caption:
        "POV: ASCO booth setup at 6am ☕️ 42 abstracts, four oral presentations — Team Best Pharma is ready. #ASCO26 #PharmaTok",
      category: "behind-the-scenes",
    },
    {
      caption:
        "3 things Priority Review means for lung cancer patients (in 60 sec) 🫁 BPC-401 explainer #PatientsFirst",
      category: "educational",
    },
    {
      caption:
        "Day in the life: oncology medical liaison edition — congress floor, HCP conversations, zero downtime.",
      category: "behind-the-scenes",
    },
    {
      caption:
        "Maria's RA journey hit different 💙 Real patients. Real access programs. #BestPharmaCo #ChronicCare",
      category: "educational",
    },
    {
      caption:
        "When the Phase 3 topline drops and the whole R&D Slack goes 🔥 BPC-401 24-month OS data recap",
      category: "promotional",
    },
    {
      caption:
        "Rare disease facts that stopped our scroll — fewer than 10% of rare conditions have an approved therapy.",
      category: "educational",
    },
    {
      caption:
        "Hartford innovation campus tour 🧪 Where vaccine + oncology teams actually collaborate IRL",
      category: "behind-the-scenes",
    },
    {
      caption:
        "Q1 earnings in 45 seconds: $14.2B revenue, oncology momentum, pipeline wins 📈 #TeamBestPharma",
      category: "promotional",
    },
    {
      caption:
        "Best Care Access explained like you're texting a friend — 14 new markets, same mission.",
      category: "educational",
    },
    {
      caption:
        "World Immunization Week vibes 💉 Colleagues share why public health work matters to them",
      category: "ugc",
    },
    {
      caption:
        "CEO Elena Marshall on Patients First — leadership clip from our Q1 town hall #Leadership",
      category: "educational",
    },
    {
      caption:
        "ESG report drop 🌍 Carbon targets, trial diversity, community partnerships — link in bio",
      category: "educational",
    },
  ],
};

const PLATFORM_SPEND_BASE: Record<
  Exclude<Platform, "linkedin">,
  number
> = {
  instagram: 920,
  facebook: 780,
  x: 520,
  youtube: 2400,
  tiktok: 680,
};

function resolvePostType(
  index: number,
  category: SocialPost["category"]
): PostType {
  if (category === "promotional" && index % 2 === 0) return "paid";
  if (index % 4 === 1) return "boosted";
  if (index % 5 === 0) return "paid";
  return "organic";
}

function spendForPlatform(
  platform: Exclude<Platform, "linkedin">,
  type: PostType,
  index: number
): number | undefined {
  if (type === "organic") return undefined;
  const base = PLATFORM_SPEND_BASE[platform] + index * 175;
  return Math.round(type === "boosted" ? base * 0.42 : base);
}

function makeSeedPost(
  platform: Exclude<Platform, "linkedin">,
  index: number,
  template: { caption: string; category: SocialPost["category"] }
): SocialPost {
  const daysBack = 2 + index * 5;
  const postType = resolvePostType(index, template.category);
  const reachMultiplier =
    postType === "paid" ? 2.2 : postType === "boosted" ? 1.5 : 1;
  const reach = Math.round(
    (platform === "youtube"
      ? 15000 + index * 4200
      : platform === "tiktok"
        ? 18000 + index * 5200
        : platform === "instagram"
          ? 9000 + index * 2800
          : platform === "facebook"
            ? 7000 + index * 2100
            : 4000 + index * 1200) * reachMultiplier
  );
  const impressions = Math.round(
    reach *
      (platform === "tiktok"
        ? 1.8 + (index % 3) * 0.2
        : 1.3 + (index % 3) * 0.15)
  );
  const likes = Math.floor(
    reach *
      (platform === "youtube"
        ? 0.04
        : platform === "tiktok"
          ? 0.055 + (index % 4) * 0.008
          : 0.025 + (index % 4) * 0.005)
  );
  const comments = Math.floor(likes * (platform === "tiktok" ? 0.06 : 0.08));
  const shares = Math.floor(
    likes * (platform === "x" ? 0.15 : platform === "tiktok" ? 0.12 : 0.06)
  );
  const saves =
    platform === "instagram" || platform === "tiktok"
      ? Math.floor(likes * (platform === "tiktok" ? 0.28 : 0.2))
      : 0;
  const clicks = Math.floor(impressions * (postType === "paid" ? 0.018 : 0.012));

  return {
    id: `${platform}-seed-${index + 1}`,
    platform,
    category: template.category,
    storyBeat: inferStoryBeat(template.caption),
    type: postType,
    publishedAt: subDays(now, daysBack).toISOString(),
    caption: template.caption,
    imageUrl: `https://picsum.photos/seed/bpc-${platform}-${index}/600/600`,
    metrics: {
      impressions,
      reach,
      likes,
      comments,
      shares,
      saves,
      clicks,
      spend: spendForPlatform(platform, postType, index),
    },
  };
}

export function generateChannelSeedPosts(): SocialPost[] {
  const posts: SocialPost[] = [];
  for (const [platform, templates] of Object.entries(SEED_BY_PLATFORM)) {
    templates.forEach((template, index) => {
      posts.push(
        makeSeedPost(
          platform as Exclude<Platform, "linkedin">,
          index,
          template
        )
      );
    });
  }
  return posts;
}
