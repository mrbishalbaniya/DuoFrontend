"use client";

import { formatDistanceAway } from "@/lib/distance";
import type { MapProfile } from "./types";

function profileKey(profile: MapProfile): string {
  return String(profile.user_id ?? profile.id ?? profile.full_name);
}

function photoUrl(profile: MapProfile): string {
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
      className={`flex w-full items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all sm:gap-3 sm:p-3 ${
        isActive
          ? "border-primary bg-primary-fixed/40 shadow-md"
          : "border-outline-variant/40 bg-surface hover:border-primary/40 hover:shadow-sm"
      }`}
    >
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-surface-dim sm:h-14 sm:w-14">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl(profile)} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-[var(--font-headline)] text-sm font-bold text-on-surface">
          {profile.full_name}
          {profile.age != null ? `, ${profile.age}` : ""}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-primary">
          {formatDistanceAway(profile.distanceMeters)}
        </p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">location_on</span>
          {profile.location || "Nepal"}
        </p>
      </div>
    </button>
  );
}
