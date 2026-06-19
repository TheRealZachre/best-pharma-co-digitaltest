import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { MetricLabel } from "./MetricLabel";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  changeTone?: "positive" | "negative" | "neutral";
  periodHint?: string;
  icon: LucideIcon;
  accent?: "indigo" | "emerald" | "amber" | "rose";
  definition?: string;
}

const accents = {
  indigo: "bg-brand-indigo/8 text-brand-indigo",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
};

const changeTones = {
  positive: "text-emerald-600",
  negative: "text-rose-600",
  neutral: "text-brand-muted",
};

export function StatCard({
  label,
  value,
  change,
  positive,
  changeTone,
  periodHint,
  icon: Icon,
  accent = "indigo",
  definition,
}: StatCardProps) {
  const resolvedTone =
    changeTone ??
    (positive === undefined ? undefined : positive ? "positive" : "negative");

  return (
    <div className="overflow-visible rounded-xl border border-brand-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-brand-muted">
            <MetricLabel definition={definition}>{label}</MetricLabel>
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink">
            {value}
          </p>
          {periodHint && (
            <p className="mt-1 text-xs text-brand-muted">{periodHint}</p>
          )}
          {change && resolvedTone && (
            <p className={clsx("mt-1 text-xs font-medium", changeTones[resolvedTone])}>
              {change}
            </p>
          )}
        </div>
        <div
          className={clsx(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            accents[accent]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
