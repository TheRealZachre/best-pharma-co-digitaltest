import type { SocialPost, StoryBeat } from "@/lib/types";

export type { StoryBeat };

export interface BeatConfig {
  color: string;
}

export interface NarrativePost extends SocialPost {
  storyBeat: StoryBeat;
  engagementScore: number;
  daysAgo: number;
}

export interface BeatStats {
  beat: StoryBeat;
  postCount: number;
  avgReactions: number;
  totalReposts: number;
  totalComments: number;
  avgEngagementScore: number;
}

export interface BeatPerformance {
  beat: StoryBeat;
  postCount: number;
  avgEngagementRate: number;
  totalReach: number;
  totalImpressions: number;
}

export interface WeekBucket {
  label: string;
  start: string;
  end: string;
  posts: NarrativePost[];
  postCount: number;
  avgReactions: number;
  avgEngagementScore: number;
  avgEngagementRate: number;
}

export interface MonthBucket {
  label: string;
  monthKey: string;
  dateRange: string;
  start: string;
  end: string;
  posts: NarrativePost[];
  postCount: number;
  avgEngagementScore: number;
  avgEngagementRate: number;
}
