import { format } from "date-fns";
import { engagementRate } from "@/lib/metrics";
import type { Platform, PostInsights, SocialPost, StoryBeat } from "@/lib/types";

interface ContentSignals {
  sportsMetaphor: boolean;
  oneSave: boolean;
  pressRelease: boolean;
  patientStory: boolean;
  congress: boolean;
  sponsored: boolean;
  hashtagHeavy: boolean;
  dataDrop: boolean;
  awarenessDay: boolean;
  teamCulture: boolean;
  policyAccess: boolean;
  videoContent: boolean;
  launchDate: string | null;
}

interface InsightContext {
  channelAvgEngagement: number;
  channelAvgShareRatio: number;
  channelAvgCommentRatio: number;
  chronologicalRank: number;
  totalOnPlatform: number;
  precedingBeat?: StoryBeat;
  followingBeat?: StoryBeat;
}

function reactionTotal(post: SocialPost): number {
  return Math.max(post.metrics.likes, 1);
}

function shareRatio(post: SocialPost): number {
  return (post.metrics.shares / reactionTotal(post)) * 100;
}

function commentRatio(post: SocialPost): number {
  return (post.metrics.comments / reactionTotal(post)) * 100;
}

function detectSignals(caption: string): ContentSignals {
  const launchMatch = caption.match(
    /\b(\d{2}\.\d{2}\.\d{2,4})\b|(\b(?:may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,?\s+\d{4})?)/i
  );

  return {
    sportsMetaphor:
      /goalkeeper|tournament|tim howard|world cup|one save|save changes|on the field/i.test(
        caption
      ),
    oneSave: /one save|save changes everything/i.test(caption),
    pressRelease:
      /#newsfor|#investors|press release|financial results|ir\.bestpharmacoco/i.test(
        caption
      ),
    patientStory:
      /patient story|richard|caregiver|advocacy council|you have cancer|living with/i.test(
        caption
      ),
    congress: /#asco|#eha|booth|fromfloortofeed|congress/i.test(caption),
    sponsored: /#sponsored|paid partnership/i.test(caption),
    hashtagHeavy: (caption.match(/#\w+/g) ?? []).length >= 5,
    dataDrop:
      /phase 3|78-month|long-term data|fda|approval|clinical trial|nejm/i.test(
        caption
      ),
    awarenessDay: /awareness day|awareness month|world day/i.test(caption),
    teamCulture: /#teambestpharma|meet \w+|general manager|great place to work/i.test(
      caption
    ),
    policyAccess: /access barrier|step therapy|insurance|cll care journey/i.test(
      caption
    ),
    videoContent: /0:\d{2}|reel|video|hear from/i.test(caption),
    launchDate: launchMatch?.[0] ?? null,
  };
}

function buildContext(posts: SocialPost[], post: SocialPost): InsightContext {
  const platformPosts = posts
    .filter((p) => p.platform === post.platform)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

  const avgEngagement =
    platformPosts.reduce((sum, p) => sum + engagementRate(p.metrics), 0) /
    (platformPosts.length || 1);

  const avgShare =
    platformPosts.reduce((sum, p) => sum + shareRatio(p), 0) /
    (platformPosts.length || 1);

  const avgComment =
    platformPosts.reduce((sum, p) => sum + commentRatio(p), 0) /
    (platformPosts.length || 1);

  const rank = platformPosts.findIndex((p) => p.id === post.id);
  const precedingBeat = platformPosts[rank - 1]?.storyBeat;
  const followingBeat = platformPosts[rank + 1]?.storyBeat;

  return {
    channelAvgEngagement: avgEngagement,
    channelAvgShareRatio: avgShare,
    channelAvgCommentRatio: avgComment,
    chronologicalRank: rank,
    totalOnPlatform: platformPosts.length,
    precedingBeat,
    followingBeat,
  };
}

function buildWhatWorked(
  post: SocialPost,
  signals: ContentSignals,
  ctx: InsightContext
): string {
  const er = engagementRate(post.metrics);
  const shares = shareRatio(post);
  const comments = commentRatio(post);
  const parts: string[] = [];

  if (shares >= 15 || shares >= ctx.channelAvgShareRatio * 1.8) {
    parts.push(
      `High repost-to-reaction ratio (${shares.toFixed(0)}% vs channel avg ${ctx.channelAvgShareRatio.toFixed(0)}%) shows this post traveled well beyond the immediate audience — a strong signal of shareability. → Lead the next post with a data hook: open with a concrete outcome stat or a provocative number in the first line to trigger the same distribution behavior.`
    );
  }

  if (signals.sportsMetaphor || signals.oneSave) {
    parts.push(
      `The sports metaphor (goalkeeper save = clinical save) made a complex oncology concept immediately accessible to non-scientific audiences without dumbing it down. → Use universal metaphors again: sport, family milestones, and everyday human moments are the most reliable entry points for difficult clinical narratives — they broaden reach while keeping the science credible.`
    );
  }

  if (signals.patientStory) {
    parts.push(
      `Patient-centered framing gave the brand a human voice that cuts through corporate broadcast noise. Real lived experience content consistently earns higher comment rates because it invites empathy, not passive reading. → Build a patient voice calendar: commit to at least one patient or caregiver perspective per month. Even a single quote works, and this is the most reliable driver of meaningful comment volume.`
    );
  }

  if (signals.dataDrop && er >= ctx.channelAvgEngagement) {
    parts.push(
      `Clinical data and regulatory milestones delivered above-average engagement (${er.toFixed(1)}% ER), confirming that HCP and investor audiences on ${post.platform} reward evidence over promotion. → Pair every data drop with plain language: one sentence explaining what the number means for patients bridges scientific and general audiences in the same post.`
    );
  }

  if (signals.congress && post.metrics.reach > 0) {
    parts.push(
      `Congress-timed content rode an active news cycle, making the post feel timely rather than evergreen filler — audiences already scanning for ASCO/EHA updates were primed to engage. → Plan a 3-post congress arc: pre-schedule preview, day-of, and recap posts to capture the full engagement window rather than a single spike.`
    );
  }

  if (comments >= 8 || comments >= ctx.channelAvgCommentRatio * 2) {
    parts.push(
      `Strong comment-to-reaction ratio (${comments.toFixed(1)}% vs channel avg ${ctx.channelAvgCommentRatio.toFixed(1)}%) shows the audience responded actively, not just scrolled past. Comment volume amplifies organic reach on ${post.platform}'s algorithm. → End with a question: even one genuine invite to share an experience — "What's been your takeaway?" — reliably increases comment volume and keeps the thread alive.`
    );
  } else if (er >= ctx.channelAvgEngagement * 1.25) {
    parts.push(
      `Engagement rate of ${er.toFixed(1)}% outperformed the ${post.platform} channel average (${ctx.channelAvgEngagement.toFixed(1)}%) by ${((er / ctx.channelAvgEngagement - 1) * 100).toFixed(0)}% — the creative format and message combination resonated with this audience. → Audit this post's structure: identify exactly what made it work (image type, caption length, opening hook) and use that as the template for future ${post.storyBeat} content.`
    );
  }

  if (signals.teamCulture) {
    parts.push(
      `People-and-culture storytelling built employer brand affinity while softening the corporate pharma tone — a combination that earns both high engagement and positive brand sentiment. → Rotate the spotlight monthly: feature a different team member or internal milestone each month. Culture content compounds over time into a recognizable narrative thread.`
    );
  }

  if (signals.policyAccess) {
    parts.push(
      `Policy and access framing positioned Best Pharma Co. as a systems-level advocate rather than a product marketer, which tends to attract shares from patient advocacy organizations and policymakers — a valuable secondary audience. → Ground each policy post in a patient: connect the systemic argument to a specific person or barrier (e.g., "X patients face this") to make abstract advocacy feel urgent and personal.`
    );
  }

  if (parts.length === 0) {
    parts.push(
      `${post.storyBeat} content on ${post.platform} met baseline performance expectations (${er.toFixed(1)}% ER vs channel avg ${ctx.channelAvgEngagement.toFixed(1)}%), confirming the narrative theme is resonating at a steady level. → Experiment with the format: swap a static image for short video or a carousel on the next ${post.storyBeat} post to test whether the theme can unlock higher engagement with a fresh creative treatment.`
    );
  }

  return parts.slice(0, 2).join("\n\n");
}

function buildWhatDiluted(
  post: SocialPost,
  signals: ContentSignals,
  ctx: InsightContext
): string {
  const comments = commentRatio(post);
  const likes = post.metrics.likes;
  const parts: string[] = [];

  if (comments < 2 && likes >= 50) {
    parts.push(
      `${post.metrics.comments === 0 ? "No" : `Only ${post.metrics.comments}`} comment${post.metrics.comments === 1 ? "" : "s"} for ${likes} reactions points to passive viewership — the audience liked it but didn't feel compelled to respond. This is a missed amplification opportunity since comments significantly boost ${post.platform} algorithmic reach. → Add a conversation starter: rewrite the last line of the next similar post as a direct question or "share your experience" prompt. A single question reliably lifts comment volume by 2–4×.`
    );
  }

  if (signals.pressRelease) {
    parts.push(
      `Press-release framing (#Newsfor, #Investors) reads as a broadcast to markets and media — it limits personal connection and suppresses comment velocity because the audience doesn't see an entry point to respond. → Create a companion post: pair every formal announcement with a separate human-language version ("here's what this approval means for patients") on the same day. The companion consistently outperforms the announcement.`
    );
  }

  if (signals.sponsored) {
    parts.push(
      `The #Sponsored label signals paid reach, which reduces organic trust — audiences filter sponsored content differently and are less likely to share or comment on it. → Shift to owned storytelling: where possible, convert sponsored messages into organic posts driven by patient voice, scientific milestones, or employee perspective. Reserve #Sponsored only for regulatory-required disclosures.`
    );
  }

  if (signals.hashtagHeavy) {
    parts.push(
      `High hashtag density (5+ tags) competes with the core message and makes the post feel keyword-optimized rather than written for a human reader. On LinkedIn in particular, hashtag clutter is associated with lower engagement rates. → Cut to 2–3 targeted hashtags: choose only the most specific and relevant, and redirect that copy space toward a sharper headline or a concrete takeaway.`
    );
  }

  if (signals.launchDate) {
    parts.push(
      `The explicit ${signals.launchDate} date stamp creates urgency that becomes a liability once the date passes — the post ages quickly and can feel outdated in a feed. → Use event framing instead: "at ASCO this week" ages better than a hard date stamp. Reserve specific dates only for regulatory milestones where the date itself is the news.`
    );
  }

  if (
    shareRatio(post) < ctx.channelAvgShareRatio * 0.4 &&
    post.metrics.likes > 20
  ) {
    parts.push(
      `Low share rate (${shareRatio(post).toFixed(1)}% vs channel avg ${ctx.channelAvgShareRatio.toFixed(1)}%) despite solid reactions means the content resonated privately but did not travel — the audience processed it internally rather than forwarding it. This limits organic reach expansion. → Build in a shareable moment: include a surprising stat, a quotable line, or an insight that makes readers feel smarter for having shared it with their network.`
    );
  }

  if (post.caption.length > 600 && !signals.patientStory) {
    parts.push(
      `Caption length (${post.caption.length} characters) works against mobile scan behavior — the key insight is likely buried below the fold, and most readers won't reach it. → Move the key line to the top: lead with the single most important sentence before the "see more" cut. Aim for 300 characters or fewer above the fold for non-story content.`
    );
  }

  if (parts.length === 0) {
    const er = engagementRate(post.metrics);
    if (er < ctx.channelAvgEngagement * 0.75) {
      parts.push(
        `Below-average engagement (${er.toFixed(1)}% ER vs channel avg ${ctx.channelAvgEngagement.toFixed(1)}%) suggests the creative or copy did not break through on ${post.platform} this cycle. The topic may be right but the format or hook needs rethinking. → Test a new opening line: replacing a corporate statement opener with a question, a stat, or a patient-facing claim typically lifts engagement by 20–40% on an otherwise identical post.`
      );
    } else {
      parts.push(
        `No major dilution signals detected — performance is consistent with channel norms. The post is doing its job, though there is headroom to drive more conversation. → Prompt participation: add a specific call-to-action in the next similar post ("What question would you ask?", "Tag a colleague who should see this") to convert passive readers into active participants.`
      );
    }
  }

  return parts.slice(0, 2).join("\n\n");
}

function buildNarrativeRole(
  post: SocialPost,
  signals: ContentSignals,
  ctx: InsightContext
): string {
  const dateLabel = format(new Date(post.publishedAt), "MM.dd.yy");
  const beat = post.storyBeat;

  if (signals.oneSave || signals.sportsMetaphor) {
    return `This post opens a new chapter in Best Pharma Co.'s story arc — the "One Save Changes Everything" metaphor sets an explicit before/after anchor moment around ${signals.launchDate ?? dateLabel}. It commits the brand to a narrative promise: something tangible must be delivered to earn the comparison, which raises the stakes for all subsequent ${beat} content. → Close the loop with proof: within 2–3 weeks, publish a concrete outcome (a patient result, a data milestone, a real-world access story) that validates what this post promised. An unresolved anchor erodes credibility.`;
  }

  if (signals.patientStory) {
    return `This post humanizes the ${beat.toLowerCase()} thread with lived experience, acting as an essential emotional counterweight to data-heavy content${ctx.precedingBeat ? ` like the preceding ${ctx.precedingBeat} post` : ""}. Without posts like this, the channel risks feeling like a press wire — all signal, no soul. Patient stories are also the most likely content type to be shared by disease advocacy communities, extending reach to audiences Best Pharma Co. cannot buy. → Commit to a monthly patient cadence: build a content library of patient voice (quotes, video clips, written stories) so the narrative doesn't dry up between clinical milestones. One post per month is enough to hold the emotional thread.`;
  }

  if (signals.congress && signals.dataDrop) {
    return `This post validates scientific credibility during an active congress window, anchoring the ${beat} beat with peer-reviewed evidence that stakeholders can cite long after the event ends. Congress content has a longer shelf life than most — it becomes a reference point in follow-up conversations with HCPs, investors, and media. → Extend it into a series: repurpose this post's key data point into a visual summary, a patient-impact interpretation, and a long-form explainer. A 3-part congress thread captures 3× the engagement window of a single spike post.`;
  }

  if (signals.pressRelease) {
    return `This post fulfills the investor-and-media lane of the narrative — it signals material news to markets and press rather than building community engagement. This is a necessary but low-resonance content type; it performs a compliance function more than a brand-building one. → Publish a patient companion post within 24 hours: take the same news and reframe it around what it means for a specific type of patient. The companion post consistently captures the emotional engagement the formal announcement misses.`;
  }

  if (signals.policyAccess) {
    return `This post extends Best Pharma Co.'s story from science to systems — it argues that innovation only matters if patients can access it, bridging ${beat} content to policy advocacy. This positioning is rare in pharma social and attracts shares from patient advocacy groups and healthcare policy influencers who don't typically engage with product content. → Build a 3-post access arc: (1) name the barrier, (2) show Best Pharma Co.'s response, (3) feature a patient whose access improved. The arc format turns a one-time policy post into a sustained narrative thread.`;
  }

  if (signals.awarenessDay) {
    return `This post participates in a shared cultural moment to keep Best Pharma Co. visible in disease communities without leading with product claims — a credibility move that often outperforms direct brand posts in organic reach. → Plan 30 days out: the most effective awareness day posts incorporate patient voices, purposeful visuals, and a clear action (a resource link, a hashtag) rather than a last-minute text-only post. Set a calendar reminder now for the next relevant awareness date.`;
  }

  if (signals.teamCulture) {
    return `This post reinforces the People & Culture dimension of Best Pharma Co.'s arc — it shows who carries the mission, not just what the company ships. Culture content signals organizational health to investors and prospective employees simultaneously. → Go deeper in the org: profile team members across different functions (R&D, patient access, regulatory, clinical ops) rather than concentrating on leadership. Cross-functional culture content reaches a wider internal-referral network when employees share it.`;
  }

  if (ctx.chronologicalRank === 0) {
    return `This is the most recent expression of ${beat} on ${post.platform}, setting the current tone for everything that follows — it defines the "state of the narrative" for anyone landing on the profile today. → Audit what this post says first: consider whether this is the message Best Pharma Co. most wants leading the channel right now. If a higher-priority beat (e.g., a clinical milestone) should greet new visitors, plan the next post accordingly.`;
  }

  if (ctx.chronologicalRank >= ctx.totalOnPlatform - 3) {
    return `This is an early-chapter post on ${post.platform} — ${beat} content that helped establish themes the channel has since built on. Its narrative function has largely been fulfilled, but it remains part of the brand's content heritage. → Publish an "update" that references this: "Since we shared this in ${dateLabel}, here's what's changed" performs well because it rewards returning audiences while onboarding new followers to the brand's history.`;
  }

  if (ctx.followingBeat && ctx.followingBeat !== beat) {
    return `This post sits at a pivot point in the ${post.platform} arc — it transitions from ${ctx.followingBeat} content toward ${beat}, signaling a deliberate (or accidental) shift in narrative emphasis. Pivot posts set audience expectations for what comes next. → Confirm the pivot with consistency: make the next 2–3 posts consistently ${beat} so the shift reads as intentional strategy, not reactive posting. Inconsistent pivots erode the audience's sense of who Best Pharma Co. is on this channel.`;
  }

  return `This post sustains the ${beat} beat on ${post.platform} — not a pivot, but a necessary reinforcement that keeps the through-line visible between bigger narrative moments. Consistent beat repetition builds audience recognition: over time, followers associate Best Pharma Co. with this theme. → Mix up the format within the beat: try a question-led post, a stat-first post, and a story-led post in succession. Format variety is the most efficient way to keep a content theme fresh without changing the narrative direction.`;
}

export function analyzePostInsights(
  post: SocialPost,
  allPosts: SocialPost[]
): PostInsights {
  const signals = detectSignals(post.caption);
  const ctx = buildContext(allPosts, post);

  return {
    whatWorked: buildWhatWorked(post, signals, ctx),
    whatDiluted: buildWhatDiluted(post, signals, ctx),
    narrativeRole: buildNarrativeRole(post, signals, ctx),
  };
}

export function enrichPostsWithInsights(posts: SocialPost[]): SocialPost[] {
  return posts.map((post) => ({
    ...post,
    insights: analyzePostInsights(post, posts),
  }));
}
