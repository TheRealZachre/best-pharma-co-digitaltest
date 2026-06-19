import { CheckCircle2, AlertTriangle, TrendingDown, Clock } from "lucide-react";

interface WhatWorkedAnalysisProps {
  worked: string[];
  didNot: string[];
  timeframeLabel?: string;
  sunsetCandidates?: string[];
}

export function WhatWorkedAnalysis({
  worked,
  didNot,
  timeframeLabel,
  sunsetCandidates,
}: WhatWorkedAnalysisProps) {
  return (
    <div className="space-y-4">
      {timeframeLabel && (
        <div className="flex items-center gap-2 text-xs text-brand-muted">
          <Clock className="h-3.5 w-3.5" />
          <span>
            Analysis based on <strong className="text-brand-ink/80">{timeframeLabel}</strong>
          </span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* What Worked — green */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-800">
              What Worked
            </h3>
          </div>
          <ul className="mt-3 space-y-2.5">
            {worked.length === 0 ? (
              <li className="text-sm text-emerald-700 opacity-60">Not enough data yet.</li>
            ) : (
              worked.map((item, index) => (
                <li
                  key={`worked-${index}`}
                  className="flex items-start gap-2 text-sm leading-snug text-emerald-900"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Improvements — red */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-red-700">
              Improvements
            </h3>
          </div>
          <ul className="mt-3 space-y-2.5">
            {didNot.length === 0 ? (
              <li className="text-sm text-red-700 opacity-60">Not enough data yet.</li>
            ) : (
              didNot.map((item, index) => (
                <li
                  key={`did-not-${index}`}
                  className="flex items-start gap-2 text-sm leading-snug text-red-900"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  <span>{item}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Sunset candidates */}
      {sunsetCandidates && sunsetCandidates.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800">
              Consider Sunsetting
            </h3>
          </div>
          <p className="mt-1 text-xs text-amber-700">
            These content types or story beats have consistently underperformed. Consider
            reducing or retiring them to free up capacity for higher-impact formats.
          </p>
          <ul className="mt-3 space-y-2">
            {sunsetCandidates.map((item, index) => (
              <li
                key={`sunset-${index}`}
                className="flex items-start gap-2 text-sm leading-snug text-amber-900"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
