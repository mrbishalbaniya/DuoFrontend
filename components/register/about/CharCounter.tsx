"use client";

import { cn } from "@/lib/utils";

export function CharCounter({
  count,
  max,
  id,
}: {
  count: number;
  max: number;
  id?: string;
}) {
  const nearLimit = count >= max * 0.9 && count <= max;
  const over = count > max;

  return (
    <p
      id={id}
      className={cn(
        "text-xs font-medium tabular-nums",
        over ? "text-error" : nearLimit ? "text-accent" : "text-on-surface-variant"
      )}
      aria-live="polite"
    >
      {count} / {max}
    </p>
  );
}
