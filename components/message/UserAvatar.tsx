"use client";

import { memo } from "react";
import { resolveMediaUrl } from "@/lib/mediaUrl";

export const UserAvatar = memo(function UserAvatar({
  src,
  name,
  size = "md",
  className = "",
}: {
  src?: string | null;
  name?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const dim = size === "sm" ? "w-8 h-8" : "w-12 h-12";
  const iconSize = size === "sm" ? "text-xs" : "text-sm";
  const resolved = src ? resolveMediaUrl(src) ?? src : null;
  return (
    <div
      className={`${dim} rounded-full overflow-hidden bg-surface-container border border-primary/15 shrink-0 ${className}`}
    >
      {resolved ? (
        <img
          className="w-full h-full object-cover"
          alt=""
          src={resolved}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className={`material-symbols-outlined ${iconSize} text-primary/30`}>person</span>
        </div>
      )}
    </div>
  );
});
