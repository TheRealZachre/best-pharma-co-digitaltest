export const METRIC_DEFINITIONS = {
  followers:
    "The total number of people who follow or subscribe to this channel on the platform. Pulled from live sync when available.",
  postCount:
    "The number of posts included in the loaded dataset for this channel or report period.",
  totalPosts:
    "The total number of posts published across all channels in the selected report period.",
  avgEngagement:
    "Average engagement rate — the typical share of reach that led to an interaction (likes, comments, shares, or saves) across posts in this view.",
  avgEngagementRate:
    "Average engagement rate across all posts in the period. Calculated per post as (likes + comments + shares + saves) ÷ reach, then averaged.",
  totalReach:
    "The number of unique people who saw your content. Summed across all posts in the selected period.",
  reach:
    "The number of unique people who saw your content. Summed across all posts in the selected period.",
  impressions:
    "How many times your content was displayed, including when the same person saw it more than once.",
  totalImpressions:
    "How many times your content was displayed, including when the same person saw it more than once.",
  avgCTR:
    "Average click-through rate — the share of impressions that led to a click. Uses platform click data when available, otherwise a 1.2% industry estimate.",
  audienceGrowth:
    "Combined follower count across all connected social channels — LinkedIn, Instagram, Facebook, X, and YouTube. Totals are summed from live sync when available.",
} as const;

export type MetricDefinitionKey = keyof typeof METRIC_DEFINITIONS;

export function metricDefinition(key: MetricDefinitionKey): string {
  return METRIC_DEFINITIONS[key];
}
