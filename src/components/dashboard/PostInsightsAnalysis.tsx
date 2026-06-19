import type { PostInsights } from "@/lib/types";

interface PostInsightsAnalysisProps {
  insights: PostInsights;
  layout?: "grid" | "stack";
  className?: string;
}

/** Split insight text on "→" and render the action callout with distinct styling. */
function InsightText({ text, actionColor }: { text: string; actionColor: string }) {
  const [observation, action] = text.split(/\s*→\s*/);
  return (
    <div className="space-y-2">
      {observation?.split("\n\n").map((para, i) => (
        <p key={i} className="text-[13.5px] leading-[1.65] text-[#0d1421]">
          {para.trim()}
        </p>
      ))}
      {action && (
        <p className={`text-[12.5px] font-medium leading-[1.6] ${actionColor}`}>
          → {action.trim()}
        </p>
      )}
    </div>
  );
}

export function PostInsightsAnalysis({
  insights,
  layout: _layout = "grid",
  className,
}: PostInsightsAnalysisProps) {
  return (
    <div className={className}>
      <div className="mt-1.5 space-y-5">
        <div>
          <h4 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            What Worked
          </h4>
          <InsightText text={insights.whatWorked} actionColor="text-emerald-700" />
        </div>
        <div>
          <h4 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-600">
            Improvements
          </h4>
          <InsightText text={insights.whatDiluted} actionColor="text-red-600" />
        </div>
        <div>
          <h4 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-indigo">
            Narrative Role
          </h4>
          <InsightText text={insights.narrativeRole} actionColor="text-brand-indigo" />
        </div>
      </div>
    </div>
  );
}
