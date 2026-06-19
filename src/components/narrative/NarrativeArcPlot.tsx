"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { BEATS } from "@/lib/narrative/beats";
import type { NarrativePost } from "@/lib/narrative/types";

interface NarrativeArcPlotProps {
  posts: NarrativePost[];
  maxDays: number;
  title?: string;
}

const W = 1100;
const H = 280;
const PAD_L = 60;
const PAD_R = 30;
const PAD_T = 30;
const PAD_B = 60;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

export function NarrativeArcPlot({
  posts,
  maxDays,
  title,
}: NarrativeArcPlotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    post: NarrativePost;
    x: number;
    y: number;
  } | null>(null);

  const maxEng = useMemo(() => {
    const scores = posts
      .filter((p) => p.engagementScore > 0)
      .map((p) => p.engagementScore);
    return Math.max(...scores, 1);
  }, [posts]);

  const nodes = useMemo(
    () =>
      posts.map((post) => {
        const x =
          PAD_L + PLOT_W * (1 - Math.min(post.daysAgo, maxDays) / maxDays);
        const y =
          post.engagementScore > 0
            ? PAD_T +
              PLOT_H * (1 - Math.min(post.engagementScore / maxEng, 1))
            : PAD_T + PLOT_H * 0.92;
        const r = post.engagementScore > 0 ? 8 : 6;
        const opacity = post.engagementScore > 0 ? 1 : 0.5;
        return {
          post,
          x,
          y,
          r,
          opacity,
          color: BEATS[post.storyBeat].color,
        };
      }),
    [posts, maxDays, maxEng]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, post: NarrativePost) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({
        post,
        x: e.clientX - rect.left + 16,
        y: e.clientY - rect.top - 10,
      });
    },
    []
  );

  const dayMarkers = useMemo(() => {
    const steps =
      maxDays <= 7
        ? [0, 7]
        : maxDays <= 30
          ? [0, 7, 14, 21, 28, 30]
          : [0, 30, 60, 90];
    return steps.filter((d) => d <= maxDays);
  }, [maxDays]);

  if (posts.length === 0) {
    return (
      <p className="text-sm text-brand-muted">No posts in this period to plot.</p>
    );
  }

  return (
    <div>
      {title && (
        <h3 className="mb-4 text-base font-semibold text-brand-ink">{title}</h3>
      )}
      <div className="relative rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-3 text-xs">
          {Object.entries(BEATS).map(([name, conf]) => (
            <span
              key={name}
              className="flex items-center gap-1.5 text-brand-muted"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: conf.color }}
              />
              {name}
            </span>
          ))}
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 280 }}
          onMouseLeave={() => setTooltip(null)}
        >
          <line
            x1={PAD_L}
            y1={H - PAD_B}
            x2={W - PAD_R}
            y2={H - PAD_B}
            stroke="#e2e8f0"
          />
          <line
            x1={PAD_L}
            y1={PAD_T}
            x2={PAD_L}
            y2={H - PAD_B}
            stroke="#e2e8f0"
          />

          {[0.25, 0.5, 0.75].map((p) => {
            const y = PAD_T + PLOT_H * (1 - p);
            return (
              <line
                key={p}
                x1={PAD_L}
                y1={y}
                x2={W - PAD_R}
                y2={y}
                stroke="#e8edf5"
                strokeDasharray="2 4"
              />
            );
          })}

          {dayMarkers.map((d) => {
            const x = PAD_L + PLOT_W * (1 - d / maxDays);
            return (
              <text
                key={d}
                x={x}
                y={H - PAD_B + 22}
                textAnchor="middle"
                fill="#5a6a82"
                fontSize={10}
                fontWeight={500}
              >
                {d === 0 ? "NOW" : `${d}D AGO`}
              </text>
            );
          })}

          <text
            x={PAD_L - 46}
            y={PAD_T + PLOT_H / 2}
            transform={`rotate(-90, ${PAD_L - 46}, ${PAD_T + PLOT_H / 2})`}
            textAnchor="middle"
            fill="#5a6a82"
            fontSize={10}
            fontWeight={500}
          >
            ENGAGEMENT
          </text>
          <text
            x={(W - PAD_R + PAD_L) / 2}
            y={H - 8}
            textAnchor="middle"
            fill="#5a6a82"
            fontSize={10}
            fontWeight={500}
          >
            TIME
          </text>

          {nodes.map(({ post, x, y, r, opacity, color }) => (
            <circle
              key={post.id}
              cx={x}
              cy={y}
              r={r}
              fill={color}
              stroke="#ffffff"
              strokeWidth={2}
              opacity={opacity}
              className="cursor-pointer transition-all hover:r-[12]"
              onMouseEnter={(e) => handleMouseMove(e, post)}
              onMouseMove={(e) => handleMouseMove(e, post)}
            />
          ))}
        </svg>

        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 max-w-xs rounded bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <p className="font-semibold">{tooltip.post.storyBeat}</p>
            <p className="mt-1 text-slate-300 line-clamp-2">
              {tooltip.post.caption}
            </p>
            <p className="mt-1 text-brand-muted/60">
              {tooltip.post.daysAgo === 0
                ? "Today"
                : `${tooltip.post.daysAgo}d ago`}{" "}
              · {tooltip.post.engagementScore} engagement score
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
