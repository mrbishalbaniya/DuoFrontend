"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Profile } from "@/types";
import api from "@/lib/api";
import { resolveProfilePhotoUrls } from "@/lib/mediaUrl";
import { useIsClient } from "@/lib/useIsClient";
import { useSheetAnchor } from "@/lib/useSheetAnchor";
import "@/components/dashboard/discovery-filters.css";
import "./profile-sheet.css";


/** "3 km away" on discover cards; location text only when the backend shares it (matches). */
function whereLabel(profile: Profile): string {
  const km = profile.distance_km;
  if (typeof km === "number") {
    return km < 1 ? "Less than 1 km away" : `${km} km away`;
  }
  return profile.location?.trim() ?? "";
}

function whereIcon(profile: Profile): string {
  return typeof profile.distance_km === "number" ? "near_me" : "location_on";
}

export function getProfilePhotos(profile: Profile): string[] {
  return resolveProfilePhotoUrls(profile, 3);
}

export function ProfileCardOverlay({
  profile,
  isTopCard,
  onInfoClick,
  infoDisabled,
}: {
  profile: Profile;
  isTopCard: boolean;
  onInfoClick?: () => void;
  infoDisabled?: boolean;
}) {
  if (!isTopCard) return null;

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <div
          className="absolute inset-x-0 bottom-0 h-[42%] min-h-[140px] bg-gradient-to-t from-black/90 via-black/55 to-transparent"
          aria-hidden
        />
        <div className="relative flex items-end justify-between gap-3 p-6 pb-6 md:p-8 md:pb-8">
          <div className="min-w-0 flex-1">
            <h2 className="font-[var(--font-headline)] text-2xl font-bold text-white drop-shadow-sm md:text-3xl">
              {profile.full_name}
              {profile.age != null && (
                <span className="font-semibold text-white/90">, {profile.age}</span>
              )}
            </h2>
            {whereLabel(profile) ? (
              <div className="mt-2 flex items-center gap-2 text-white/95">
                <span className="material-symbols-outlined shrink-0 text-lg drop-shadow-sm">
                  {whereIcon(profile)}
                </span>
                <span className="text-sm font-medium drop-shadow-sm">{whereLabel(profile)}</span>
              </div>
            ) : null}
          </div>

          {onInfoClick ? (
            <button
              type="button"
              aria-label="View profile details"
              disabled={infoDisabled}
              onClick={(e) => {
                e.stopPropagation();
                onInfoClick();
              }}
              className="pointer-events-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white shadow-md backdrop-blur-sm transition-all hover:bg-black/50 active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}

const RELATIONSHIP_GOAL_LABELS: Record<string, string> = {
  serious: "Long-term",
  casual: "Something casual",
  dating: "Dating",
};

/**
 * Profile details in the same iOS sheet as the discovery filters: bottom sheet
 * with a grabber on phones, centered card on desktop, grouped rows inside.
 */
export function ProfileDetailSheet({
  profile,
  open,
  onClose,
  footer,
}: {
  profile: Profile | null;
  open: boolean;
  onClose: () => void;
  footer?: ReactNode;
}) {
  const mounted = useIsClient();
  const rootRef = useRef<HTMLDivElement>(null);
  useSheetAnchor(open && mounted, rootRef);
  const tags = Array.isArray(profile?.lifestyle_tags) ? profile.lifestyle_tags : [];

  const goal = profile?.relationship_goal ? RELATIONSHIP_GOAL_LABELS[profile.relationship_goal] : "";
  const detailItems = profile
    ? [
        { label: "Looking for", value: goal, icon: "favorite" },
        { label: "Education", value: profile.education, icon: "school" },
        { label: "Occupation", value: profile.occupation, icon: "work" },
        { label: "Religion", value: profile.religion, icon: "temple_hindu" },
        { label: "Work style", value: profile.work_preference, icon: "business_center" },
      ].filter((item) => item.value)
    : [];

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !profile?.id) return;
    void api.recordProfileVisit(profile.id).catch(() => undefined);
  }, [open, profile?.id]);

  if (!profile || !mounted) return null;

  const [heroPhoto, ...morePhotos] = getProfilePhotos(profile);
  const where = whereLabel(profile);
  const firstName = profile.full_name.split(" ")[0] || profile.full_name;

  return createPortal(
    <div ref={rootRef} className="dfs-root" data-open={open} aria-hidden={!open} role="presentation">
      <button
        type="button"
        className="dfs-backdrop"
        aria-label="Close profile"
        onClick={onClose}
        tabIndex={-1}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-sheet-title"
        className="dfs-sheet pds-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dfs-grabber" aria-hidden>
          <span />
        </div>

        <nav className="dfs-navbar">
          <button type="button" className="dfs-navbtn pds-navbtn-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
          <h2 id="profile-sheet-title" className="dfs-title">
            {firstName}
          </h2>
          <button type="button" className="dfs-navbtn dfs-navbtn--strong" onClick={onClose}>
            Done
          </button>
        </nav>

        <div data-lenis-prevent className="dfs-scroll">
          <div className="pds-hero">
            {heroPhoto ? (
              <img src={heroPhoto} alt={profile.full_name} />
            ) : (
              <div className="pds-hero-empty">
                <span className="material-symbols-outlined">person</span>
              </div>
            )}
          </div>

          <div className="pds-identity">
            <p className="pds-name">
              <span>
                {profile.full_name}
                {profile.age != null && <span className="pds-name-age">, {profile.age}</span>}
              </span>
              {profile.is_verified ? (
                <span
                  className="material-symbols-outlined pds-verified"
                  title="Verified profile"
                  aria-label="Verified profile"
                >
                  verified
                </span>
              ) : null}
            </p>
            {where ? (
              <p className="pds-where">
                <span className="material-symbols-outlined">{whereIcon(profile)}</span>
                {where}
              </p>
            ) : null}
          </div>

          {profile.bio ? (
            <>
              <p className="dfs-caption">About</p>
              <div className="dfs-group">
                <p className="pds-text">{profile.bio}</p>
              </div>
            </>
          ) : null}

          {detailItems.length > 0 ? (
            <>
              <p className="dfs-caption">Basics</p>
              <div className="dfs-group">
                {detailItems.map((item) => (
                  <div key={item.label} className="dfs-row">
                    <span className="pds-row-icon" aria-hidden>
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </span>
                    <span className="dfs-row-title">{item.label}</span>
                    <span className="pds-row-value" title={item.value}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {tags.length > 0 ? (
            <>
              <p className="dfs-caption">Lifestyle</p>
              <div className="dfs-group">
                <div className="pds-chips">
                  {tags.map((tag) => (
                    <span key={tag} className="pds-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {morePhotos.length > 0 ? (
            <>
              <p className="dfs-caption">Photos</p>
              {morePhotos.map((url, index) => (
                <div key={url} className="pds-photo">
                  <img src={url} alt={`${profile.full_name} photo ${index + 2}`} loading="lazy" />
                </div>
              ))}
            </>
          ) : null}
        </div>

        {footer ? <div className="pds-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
