"use client";

import { memo } from "react";

export const ReactionBadge = memo(function ReactionBadge({ emoji }: { emoji: string }) {
  return (
    <span
      role="img"
      aria-label={`Reaction ${emoji}`}
      className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-background px-1.5 text-[17px] leading-none shadow-sm"
    >
      {emoji}
    </span>
  );
});
