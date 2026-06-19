"use client";

import { formatDistanceAway } from "@/lib/distance";
import type { MapProfile } from "./types";

function profileKey(profile: MapProfile): string {
  return String(profile.user_id ?? profile.id ?? profile.full_name);
}

export function profilePhotoUrl(profile: MapProfile): string {
  const id = profileKey(profile);
  return (
    profile.photo_url ||
    (Array.isArray(profile.photo_urls) && profile.photo_urls[0]) ||
    `https://picsum.photos/seed/${id}/400/500`
  );
}

interface MatchMapCardProps {
  profile: MapProfile;
  isActive?: boolean;
  onClick: () => void;
}

export default function MatchMapCard({
  profile,
  isActive = false,
  onClick,
}: MatchMapCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-white/[0.06] ${
        isActive ? "bg-primary/15" : "bg-transparent"
      }`}
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-dim ring-[2px] ring-white/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={profilePhotoUrl(profile)} alt="" className="h-full w-full object-cover" />
        {isActive ? (
          <span className="absolute inset-0 rounded-full ring-2 ring-primary ring-offset-1 ring-offset-transparent" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-semibold leading-tight text-on-surface">
          {profile.full_name}
          {profile.age != null ? `, ${profile.age}` : ""}
        </p>
        <p className="mt-0.5 text-[13px] font-medium text-primary">
          {formatDistanceAway(profile.distanceMeters)}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-on-surface-variant">
          {profile.location || "Nepal"}
        </p>
      </div>
      <span className="material-symbols-outlined shrink-0 text-xl text-on-surface-variant/50">
        chevron_right
      </span>
    </button>
  );
}
