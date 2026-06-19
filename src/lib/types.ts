export type ReportTimeframe = "weekly" | "monthly" | "quarterly";

export type Platform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "linkedin"
  | "x"
  | "youtube";

/** Primary analytics channels shown in corporate reporting. */
export type AnalyticsChannel =
  | "all"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "x"
  | "youtube"
  | "tiktok";

export interface ChannelSummary {
  platform: Platform;
  label: string;
  handle: string;
  followers: number;
  followerGrowth: number;
  postCount: number;
  avgEngagementRate: number;
  avgCTR: number;
  totalReach: number;
  totalImpressions: number;
  totalSpend: number;
  dataSource: "live" | "seed";
}

export type ContentCategory =
  | "product"
  | "lifestyle"
  | "educational"
  | "promotional"
  | "ugc"
  | "behind-the-scenes";

export type PostType = "organic" | "paid" | "boosted";

export type StoryBeat =
  | "Brand Vision"
  | "Scientific Innovation"
  | "Patient-Centered"
  | "Disease Awareness"
  | "Corporate Citizenship"
  | "People & Culture"
  | "Policy Advocacy";

export interface PostMetrics {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  spend?: number;
}

export interface PostInsights {
  whatWorked: string;
  whatDiluted: string;
  narrativeRole: string;
}

export interface SocialPost {
  id: string;
  platform: Platform;
  category: ContentCategory;
  storyBeat: StoryBeat;
  type: PostType;
  publishedAt: string;
  caption: string;
  imageUrl: string;
  metrics: PostMetrics;
  insights?: PostInsights;
}

export interface CompetitorBrand {
  name: string;
  followers: number;
  avgEngagementRate: number;
  avgPostsPerWeek: number;
  topCategory: ContentCategory;
}

export interface AudienceSnapshot {
  date: string;
  followers: number;
  growth: number;
}

export interface CategoryPerformance {
  category: ContentCategory;
  postCount: number;
  avgEngagementRate: number;
  totalReach: number;
  totalImpressions: number;
}

export interface BudgetRecommendation {
  postId: string;
  eligible: boolean;
  recommendedBudget: number;
  projectedEngagementRate: number;
  projectedReach: number;
  rationale: string;
}

export interface BrandProfile {
  name: string;
  handle: string;
  competitors: CompetitorBrand[];
}

export interface ReportSummary {
  totalPosts: number;
  organicPosts: number;
  paidPosts: number;
  totalSpend: number;
  avgEngagementRate: number;
  avgCTR: number;
  totalReach: number;
  totalImpressions: number;
  audienceGrowth: number;
}
