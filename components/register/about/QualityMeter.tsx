"use client";

import { cn } from "@/lib/utils";
import type { ProfileQuality } from "@/lib/register/aboutQuality";

export function QualityMeter({ quality }: { quality: ProfileQuality }) {
  const tone =
    quality.level === "excellent"
      ? "text-emerald-400"
      : quality.level === "good"
        ? "text-accent"
        : "text-on-surface-variant";

  const bar =
    quality.level === "excellent"
      ? "bg-emerald-400"
      : quality.level === "good"
        ? "bg-accent"
        : "bg-outline/50";

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
          Profile Quality
        </p>
        <p className={cn("text-xs font-bold", tone)}>{quality.label}</p>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-surface-container"
        role="progressbar"
        aria-valuenow={quality.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Profile quality ${quality.label}`}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-300", bar)}
          style={{ width: `${Math.max(6, quality.score)}%` }}
        />
      </div>
    </div>
  );
}
