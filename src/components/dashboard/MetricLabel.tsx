import type { ReactNode } from "react";

interface MetricLabelProps {
  children: ReactNode;
  definition?: string;
  className?: string;
}

export function MetricLabel({
  children,
  definition,
  className = "",
}: MetricLabelProps) {
  if (!definition) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      className={`group/metric relative inline-flex cursor-help border-b border-dotted border-current ${className}`}
      tabIndex={0}
    >
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-20 hidden w-52 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-left text-xs font-normal normal-case leading-snug text-white shadow-lg group-hover/metric:block group-focus-within/metric:block"
      >
        {definition}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </span>
    </span>
  );
}
