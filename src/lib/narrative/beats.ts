import type { StoryBeat } from "@/lib/types";

/** Best Pharma Co. brand-adjacent categorical palette — hues spread for arc plot legibility. */
export const BEATS: Record<StoryBeat, { color: string }> = {
  "Brand Vision": { color: "#D32E27" },       // Punch red
  "Scientific Innovation": { color: "#0F2344" }, // Blue Zodiac navy
  "Patient-Centered": { color: "#c4571a" },    // Warm amber-red
  "Disease Awareness": { color: "#1a6b3c" },   // Deep green
  "Corporate Citizenship": { color: "#5a2b8a" }, // Deep violet
  "People & Culture": { color: "#0e6b8a" },    // Ocean blue
  "Policy Advocacy": { color: "#8a1a5a" },     // Deep rose
};

export const BEAT_ORDER: StoryBeat[] = [
  "Scientific Innovation",
  "People & Culture",
  "Corporate Citizenship",
  "Patient-Centered",
  "Brand Vision",
  "Disease Awareness",
  "Policy Advocacy",
];

const BEAT_RULES: { beat: StoryBeat; patterns: RegExp[] }[] = [
  {
    beat: "Brand Vision",
    patterns: [
      /one save|save changes|tournament|goalkeeper|tim howard|brand vision/i,
    ],
  },
  {
    beat: "Scientific Innovation",
    patterns: [
      /asco|eha\b|fda|clinical|trial|inhibitor|data|investor|media:|financial results|abstract|oncolog/i,
    ],
  },
  {
    beat: "Patient-Centered",
    patterns: [
      /patient story|you have cancer|advocacy council|caregiver|richard|meet \w+.*cancer/i,
    ],
  },
  {
    beat: "Disease Awareness",
    patterns: [
      /awareness day|awareness poll|world day|ecam|esophageal cancer|wm world|poll:/i,
    ],
  },
  {
    beat: "Corporate Citizenship",
    patterns: [
      /sustainability|responsible business|global impact|esg|partnership|293 patients/i,
    ],
  },
  {
    beat: "People & Culture",
    patterns: [
      /great place to work|team best pharma|voices of leadership|general manager|hiring|culture|thailand|malaysia|singapore/i,
    ],
  },
  {
    beat: "Policy Advocacy",
    patterns: [
      /step therapy|payer|pbm|insurer|access barrier|policy|medicare|reimbursement/i,
    ],
  },
];

export function inferStoryBeat(text: string): StoryBeat {
  for (const { beat, patterns } of BEAT_RULES) {
    if (patterns.some((p) => p.test(text))) return beat;
  }
  return "Scientific Innovation";
}
