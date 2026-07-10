"use client";

import Link from "next/link";
import { useMemo } from "react";

import { profilePhotoUrl } from "@/components/map/MatchMapCard";
import { profileKey } from "@/components/map/utils";
import { formatDistanceAway } from "@/lib/distance";
import { presenceLabel } from "@/lib/globeAvatars/presence";
import { useGlobeAvatarStore } from "@/lib/globeAvatars/store";

type AvatarPopupProps = {
  onProfileFocus?: (profileId: string) => void;
};

function matchPercent(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return 72 + (h % 24);
}

export function AvatarPopup({ onProfileFocus }: AvatarPopupProps) {
  const selectedProfile = useGlobeAvatarStore((s) => s.selectedProfile);
  const popupAnchor = useGlobeAvatarStore((s) => s.popupAnchor);
  const presence = useGlobeAvatarStore((s) => s.presence);
  const setSelected = useGlobeAvatarStore((s) => s.setSelected);

  const profile = selectedProfile;
  const userKey = profile ? String(profile.user_id ?? profile.id ?? "") : "";
  const status = userKey ? presence[userKey] ?? "online" : "offline";
  const lifestyleTags = profile?.lifestyle_tags;

  const mutualInterests = useMemo(() => {
    if (!lifestyleTags?.length) return [];
    return lifestyleTags.slice(0, 3);
  }, [lifestyleTags]);

  if (!profile) return null;

  const id = profileKey(profile);
  const compatibility = matchPercent(id);
  const relationshipGoal =
    profile.relationship_goal ||
    profile.pref_relationship_goal ||
    "Open to connection";

  const style =
    popupAnchor && typeof window !== "undefined"
      ? {
          left: Math.min(window.innerWidth - 320, Math.max(16, popupAnchor.x - 160)),
          top: Math.max(80, popupAnchor.y - 24),
        }
      : { left: "50%", top: "40%", transform: "translateX(-50%)" };

  return (
    <div className="avatar-popup-anchor pointer-events-none absolute inset-0 z-[35]">
      <div
        className="avatar-popup pointer-events-auto"
        style={style}
        role="dialog"
        aria-label={`${profile.full_name} profile`}
      >
        <button
          type="button"
          className="avatar-popup__close"
          aria-label="Close"
          onClick={() => setSelected(null, null, null)}
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="avatar-popup__hero">
          <div className="avatar-popup__avatar-ring">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profilePhotoUrl(profile)} alt="" />
          </div>
          <div className="avatar-popup__presence" data-status={status}>
            <span className="avatar-popup__presence-dot" />
            {presenceLabel(status)}
          </div>
        </div>

        <div className="avatar-popup__body">
          <h3 className="avatar-popup__name">
            {profile.full_name}
            {profile.age != null ? `, ${profile.age}` : ""}
            {profile.is_verified ? (
              <span className="material-symbols-outlined avatar-popup__verified" title="Verified">
                verified
              </span>
            ) : null}
          </h3>
          <p className="avatar-popup__distance">
            {profile.distanceMeters != null
              ? formatDistanceAway(profile.distanceMeters)
              : "Location hidden"}
          </p>
          <p className="avatar-popup__goal">{relationshipGoal}</p>

          {mutualInterests.length > 0 ? (
            <div className="avatar-popup__tags">
              {mutualInterests.map((tag) => (
                <span key={tag} className="avatar-popup__tag">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="avatar-popup__match">
            <span>Match</span>
            <strong>{compatibility}%</strong>
          </div>

          <div className="avatar-popup__actions">
            <Link href="/chat" className="avatar-popup__btn avatar-popup__btn--primary">
              <span className="material-symbols-outlined text-lg">chat</span>
              Message
            </Link>
            <button
              type="button"
              className="avatar-popup__btn avatar-popup__btn--ghost"
              onClick={() => onProfileFocus?.(id)}
            >
              <span className="material-symbols-outlined text-lg">favorite</span>
              Like
            </button>
            <Link href="/profile" className="avatar-popup__btn avatar-popup__btn--ghost">
              <span className="material-symbols-outlined text-lg">person</span>
              Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
