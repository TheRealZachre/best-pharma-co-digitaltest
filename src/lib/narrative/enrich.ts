import type { SocialPost } from "@/lib/types";
import { inferStoryBeat } from "./beats";
import { enrichPostsWithInsights } from "./post-insights";

type CachedPost = Omit<SocialPost, "storyBeat" | "insights"> & {
  storyBeat?: SocialPost["storyBeat"];
  insights?: SocialPost["insights"];
};

export function enrichPostWithStoryBeat(post: CachedPost): SocialPost {
  return {
    ...post,
    storyBeat: post.storyBeat ?? inferStoryBeat(post.caption),
  };
}

export function enrichPostsWithStoryBeat(posts: CachedPost[]): SocialPost[] {
  const withBeats = posts.map(enrichPostWithStoryBeat);
  return enrichPostsWithInsights(withBeats);
}
