export type LinkedInDataProvider = "apify" | "linkedin" | "seed";

export interface RawLinkedInPost {
  id: string;
  url?: string;
  headline?: string;
  text: string;
  postType?: string;
  publishedAt: string;
  reactions: number;
  comments: number;
  reposts: number;
  imageUrl?: string;
}

export interface LinkedInSyncMeta {
  syncedAt: string;
  provider: LinkedInDataProvider;
  companySlug: string;
  postCount: number;
  followers?: number;
  note?: string;
}

export interface LinkedInPostCache {
  meta: LinkedInSyncMeta;
  posts: import("@/lib/types").SocialPost[];
}
