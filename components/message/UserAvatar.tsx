"use client";

import { memo } from "react";
import Image from "next/image";
import { resolveAvatarUrl } from "@/lib/mediaUrl";

const sizePx = { sm: 32, md: 48 } as const;

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
  const px = sizePx[size];
  const resolved = src ? resolveAvatarUrl(src) ?? src : null;
  const label = name?.trim() || "User avatar";

  return (
    <div
      className={`${dim} rounded-full overflow-hidden bg-surface-container border border-primary/15 shrink-0 relative ${className}`}
    >
      {resolved ? (
        <Image
          className="object-cover"
          alt={label}
          src={resolved}
          fill
          sizes={`${px}px`}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className={`material-symbols-outlined ${iconSize} text-primary/30`} aria-hidden>
            person
          </span>
        </div>
      )}
    </div>
  );
});
