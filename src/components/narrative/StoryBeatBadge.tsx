import { BEATS } from "@/lib/narrative/beats";
import type { StoryBeat } from "@/lib/types";

interface StoryBeatBadgeProps {
  beat: StoryBeat;
  size?: "sm" | "md";
}

export function StoryBeatBadge({ beat, size = "sm" }: StoryBeatBadgeProps) {
  const color = BEATS[beat].color;

  return (
    <span
      className={
        size === "sm"
          ? "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          : "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold"
      }
      style={{
        backgroundColor: `${color}18`,
        color,
      }}
    >
      {beat}
    </span>
  );
}
