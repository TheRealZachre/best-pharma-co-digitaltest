import { CheckCircle2, HelpCircle } from "lucide-react";
import { BEAT_ORDER, BEATS } from "@/lib/narrative/beats";
import { ENGAGEMENT_SCORE_WEIGHTS } from "@/lib/narrative/scoring";
import type { StoryBeat } from "@/lib/types";

const EXAMPLE = {
  likes: 120,
  comments: 18,
  shares: 7,
};

const exampleScore =
  EXAMPLE.likes * ENGAGEMENT_SCORE_WEIGHTS.likes +
  EXAMPLE.comments * ENGAGEMENT_SCORE_WEIGHTS.comments +
  EXAMPLE.shares * ENGAGEMENT_SCORE_WEIGHTS.shares;

const beatExamples: Record<StoryBeat, string> = {
  "Brand Vision": "Brand campaigns, sponsorships, vision messaging",
  "Scientific Innovation":
    "Clinical data, FDA updates, conference abstracts, investor news",
  "Patient-Centered": "Patient stories, advocacy councils, caregiver content",
  "Disease Awareness": "Awareness days, polls, condition education",
  "Corporate Citizenship": "ESG, sustainability, partnerships, global impact",
  "People & Culture": "Hiring, culture, leadership voices, team spotlights",
  "Policy Advocacy": "Access barriers, payer policy, reimbursement advocacy",
};

export function ScoringMethodology() {
  return (
    <div className="space-y-8 px-8 py-8">

      {/* Plain-English overview */}
      <section className="rounded-xl border border-indigo-200 bg-brand-indigo/8/60 p-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-brand-indigo" />
          <h2 className="text-base font-bold text-indigo-900">
            Why does scoring work this way?
          </h2>
        </div>
        <ul className="mt-4 space-y-3">
          {[
            {
              title: "Not all engagement is equal.",
              body: "A share takes more effort than a like. A comment takes more effort than a share. The scoring system rewards the actions that signal genuine audience connection — so a post with 10 comments outranks a post with 100 likes.",
            },
            {
              title: "Reach-normalized rates let you compare across channels.",
              body: "LinkedIn has 249K followers. X has 5K. Raw like counts would make LinkedIn look dominant by default. Dividing by reach (people who actually saw the post) levels the playing field so you can fairly compare performance.",
            },
            {
              title: "Story beats show you what topics your audience cares about.",
              body: "Every post gets classified into one of seven narrative categories based on its caption. Over time, the beat rankings reveal which topics consistently earn engagement — and which ones you should retire.",
            },
            {
              title: "The arc plot shows momentum over time.",
              body: "Placing posts on a time × score chart reveals whether you're building an audience narrative or publishing in isolation. A healthy arc has peaks that cluster around key moments (approvals, conferences, awareness days).",
            },
            {
              title: "'What Worked' is based on the top and bottom performers in the window.",
              body: "The analysis looks at the top 3 and bottom 3 posts by engagement rate within the selected timeframe. The story beats, platforms, and dates of those posts become the 'What Worked' and 'Improvements' bullets.",
            },
          ].map(({ title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-indigo" />
              <div className="text-sm text-indigo-900">
                <strong className="font-semibold">{title}</strong>{" "}
                <span className="text-indigo-800/80">{body}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-ink">
          Narrative engagement score
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-muted">
          The narrative arc uses a weighted engagement index to rank posts by
          impact. It favors higher-effort interactions (comments and shares)
          over passive reactions. This score powers the Y-axis on narrative arc
          charts and the averages shown in beat and weekly performance panels.
        </p>

        <div className="mt-6 rounded-lg border border-indigo-100 bg-brand-indigo/8/50 p-5">
          <p className="font-mono text-sm text-brand-ink">
            score = (likes × {ENGAGEMENT_SCORE_WEIGHTS.likes}) + (comments ×{" "}
            {ENGAGEMENT_SCORE_WEIGHTS.comments}) + (shares ×{" "}
            {ENGAGEMENT_SCORE_WEIGHTS.shares})
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-brand-ink/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-off-white text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Metric</th>
                <th className="px-4 py-3 font-medium">Source field</th>
                <th className="px-4 py-3 font-medium">Weight</th>
                <th className="px-4 py-3 font-medium">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-brand-ink/80">
              <tr>
                <td className="px-4 py-3 font-medium">Likes</td>
                <td className="px-4 py-3 text-brand-muted">metrics.likes</td>
                <td className="px-4 py-3">×{ENGAGEMENT_SCORE_WEIGHTS.likes}</td>
                <td className="px-4 py-3 text-brand-muted">
                  Baseline reaction signal
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Comments</td>
                <td className="px-4 py-3 text-brand-muted">metrics.comments</td>
                <td className="px-4 py-3">
                  ×{ENGAGEMENT_SCORE_WEIGHTS.comments}
                </td>
                <td className="px-4 py-3 text-brand-muted">
                  Conversation and depth of engagement
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Shares</td>
                <td className="px-4 py-3 text-brand-muted">metrics.shares</td>
                <td className="px-4 py-3">×{ENGAGEMENT_SCORE_WEIGHTS.shares}</td>
                <td className="px-4 py-3 text-brand-muted">
                  Amplification — highest weight
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-lg border border-brand-ink/10 bg-brand-off-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
            Worked example
          </p>
          <p className="mt-2 font-mono text-sm text-brand-ink">
            ({EXAMPLE.likes} × {ENGAGEMENT_SCORE_WEIGHTS.likes}) + (
            {EXAMPLE.comments} × {ENGAGEMENT_SCORE_WEIGHTS.comments}) + (
            {EXAMPLE.shares} × {ENGAGEMENT_SCORE_WEIGHTS.shares}) ={" "}
            <span className="font-semibold text-brand-indigo">{exampleScore}</span>
          </p>
        </div>

        <p className="mt-4 text-xs text-brand-muted">
          Not included in this score: impressions, reach, clicks, saves, or
          spend. Posts with zero weighted interactions receive score 0 and appear
          lower on the arc plot.
        </p>
      </section>

      <section className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-ink">
          How this differs from Eng. Rate on post cards
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-muted">
          Post cards show <strong>Eng. Rate</strong>, a reach-normalized
          percentage used for cross-post comparison in reports.
        </p>

        <div className="mt-4 rounded-lg border border-brand-ink/10 bg-brand-off-white p-5">
          <p className="font-mono text-sm text-brand-ink">
            eng. rate = ((likes + comments + shares + saves) / reach) × 100
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-brand-ink/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-off-white text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Aspect</th>
                <th className="px-4 py-3 font-medium">Narrative score</th>
                <th className="px-4 py-3 font-medium">Eng. rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-brand-ink/80">
              <tr>
                <td className="px-4 py-3 font-medium">Output</td>
                <td className="px-4 py-3">Absolute weighted count</td>
                <td className="px-4 py-3">Percentage of reach</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Includes saves</td>
                <td className="px-4 py-3">No</td>
                <td className="px-4 py-3">Yes</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Weights interactions</td>
                <td className="px-4 py-3">Yes (1 / 3 / 5)</td>
                <td className="px-4 py-3">No — all count equally</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Primary use</td>
                <td className="px-4 py-3">Narrative arc & beat trends</td>
                <td className="px-4 py-3">Report cards & rankings</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-ink">
          Narrative arc plot positioning
        </h2>
        <ul className="mt-4 space-y-3 text-sm text-brand-muted">
          <li>
            <span className="font-medium text-brand-ink">X-axis (time):</span>{" "}
            Days since publish, relative to the report window (7, 14, 60, or 90
            days).
          </li>
          <li>
            <span className="font-medium text-brand-ink">Y-axis (score):</span>{" "}
            Each post&apos;s engagement score normalized against the highest
            score in that window. Higher score = higher on the chart.
          </li>
          <li>
            <span className="font-medium text-brand-ink">Color:</span> Story
            beat category (see below).
          </li>
          <li>
            <span className="font-medium text-brand-ink">Aggregates:</span> Beat
            and weekly panels show the average narrative score across posts in
            each group.
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-ink">
          Story beat classification
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-muted">
          Each post is assigned one of seven narrative beats by scanning its
          caption for keyword patterns. The first matching rule wins. If nothing
          matches, the default is Scientific Innovation.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {BEAT_ORDER.map((beat) => (
            <div
              key={beat}
              className="flex items-start gap-3 rounded-lg border border-brand-ink/10 p-4"
            >
              <span
                className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: BEATS[beat].color }}
              />
              <div>
                <p className="text-sm font-semibold text-brand-ink">{beat}</p>
                <p className="mt-1 text-xs text-brand-muted">
                  {beatExamples[beat]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-ink">Source code</h2>
        <p className="mt-2 text-sm text-brand-muted">
          Weights and score logic live in{" "}
          <code className="rounded bg-brand-off-white px-1.5 py-0.5 text-xs">
            src/lib/narrative/scoring.ts
          </code>
          . Beat rules live in{" "}
          <code className="rounded bg-brand-off-white px-1.5 py-0.5 text-xs">
            src/lib/narrative/beats.ts
          </code>
          . Engagement rate for report cards is in{" "}
          <code className="rounded bg-brand-off-white px-1.5 py-0.5 text-xs">
            src/lib/metrics.ts
          </code>
          .
        </p>
      </section>
    </div>
  );
}
