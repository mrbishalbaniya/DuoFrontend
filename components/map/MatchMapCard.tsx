"use client";

import { formatDistanceAway } from "@/lib/distance";
import { resolveProfilePhotoUrl } from "@/lib/mediaUrl";
import type { MapProfile } from "./types";

function profileKey(profile: MapProfile): string {
  return String(profile.user_id ?? profile.id ?? profile.full_name);
}

export function profilePhotoUrl(profile: MapProfile): string {
  return resolveProfilePhotoUrl(profile);
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
  const canFocusOnMap = profile.locationShared && profile.coordinates != null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canFocusOnMap}
      data-active={isActive || undefined}
      className={`map-list-row flex w-full items-center gap-3 px-4 py-3 text-left ${
        canFocusOnMap ? "" : "opacity-70"
      }`}
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-dim ring-2 ring-outline-variant/30">
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
          {profile.locationShared && profile.distanceMeters != null
            ? formatDistanceAway(profile.distanceMeters)
            : "Location hidden"}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-on-surface-variant">
          {profile.locationShared
            ? profile.location || "Nepal"
            : "Not sharing location with you"}
        </p>
      </div>
      <span className="material-symbols-outlined shrink-0 text-xl text-on-surface-variant/50">
        chevron_right
      </span>
    </button>
  );
}

export { profileKey };
