"use client";

import { Fragment, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Profile } from "@/types";
import api from "@/lib/api";
import { buildPublicProfile } from "@/lib/profile/publicProfile";
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
  const photos = getProfilePhotos(profile);
  // Index is tied to the profile it was set for, so a new profile starts on photo 1.
  const [photoState, setPhotoState] = useState({ profileId: profile.id, index: 0 });
  const photoIndex = photoState.profileId === profile.id ? photoState.index : 0;
  const tapStart = useRef<{ x: number; y: number; t: number } | null>(null);

  // Preload the other photos so tapping through doesn't flash.
  const photoKey = photos.join("|");
  useEffect(() => {
    if (!isTopCard) return;
    photoKey
      .split("|")
      .slice(1)
      .forEach((src) => {
        const img = new Image();
        img.src = src;
      });
  }, [isTopCard, photoKey]);

  if (!isTopCard) return null;

  const hasGallery = photos.length > 1;
  const current = Math.min(photoIndex, photos.length - 1);

  // The card itself is draggable, so only treat a short, still press as a tap.
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    tapStart.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = tapStart.current;
    tapStart.current = null;
    if (!start || !hasGallery) return;
    const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    if (moved > 8 || Date.now() - start.t > 400) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const goBack = e.clientX - rect.left < rect.width / 3;
    const next = goBack ? Math.max(0, photoIndex - 1) : Math.min(photos.length - 1, photoIndex + 1);
    setPhotoState({ profileId: profile.id, index: next });
  };

  return (
    <>
      {/* Photos after the first are drawn over the stack's base image. */}
      {hasGallery && current > 0 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[current]}
            alt={`${profile.full_name} photo ${current + 1}`}
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-cover object-top"
          />
        </div>
      ) : null}

      {hasGallery ? (
        <>
          <div
            className="absolute inset-0 z-10"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            aria-hidden
          />
          {/* Stories-style photo progress: soft top scrim, seen + current bars filled */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20 h-20"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0))" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-1 px-3 pt-2.5"
            role="progressbar"
            aria-label="Photos"
            aria-valuemin={1}
            aria-valuemax={photos.length}
            aria-valuenow={current + 1}
          >
            {photos.map((src, index) => (
              <span
                key={`${index}-${src}`}
                className="relative h-[3px] flex-1 overflow-hidden rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.3)", boxShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-white"
                  style={{
                    width: index <= current ? "100%" : "0%",
                    opacity: index < current ? 0.85 : 1,
                    transition: "width 260ms ease, opacity 260ms ease",
                  }}
                />
              </span>
            ))}
          </div>
          <span
            className="pointer-events-none absolute right-3 top-6 z-20 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
            style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
            aria-hidden
          >
            {current + 1} / {photos.length}
          </span>
        </>
      ) : null}

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
              data-tour="profile"
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
  const details = profile ? buildPublicProfile(profile) : null;

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

          {details?.bio ? (
            <>
              <p className="dfs-caption">About</p>
              <div className="dfs-group">
                <p className="pds-text">{details.bio}</p>
              </div>
            </>
          ) : null}

          {details?.lookingFor ? (
            <>
              <p className="dfs-caption">What I&apos;m looking for</p>
              <div className="dfs-group">
                <p className="pds-text">{details.lookingFor}</p>
              </div>
            </>
          ) : null}

          {details?.sections.map((section) => (
            <div key={section.title}>
              <p className="dfs-caption">{section.title}</p>
              <div className="dfs-group">
                {section.rows.map((item) => (
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
            </div>
          ))}

          {details && details.interests.length > 0 && morePhotos.length === 0 ? (
            <>
              <p className="dfs-caption">Interests</p>
              <div className="dfs-group">
                <div className="pds-chips">
                  {details.interests.map((tag) => (
                    <span key={tag} className="pds-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {details?.futureGoals ? (
            <>
              <p className="dfs-caption">Future goals</p>
              <div className="dfs-group">
                <p className="pds-text">{details.futureGoals}</p>
              </div>
            </>
          ) : null}

          {morePhotos.length > 0 ? (
            <>
              <p className="dfs-caption">Photos</p>
              {morePhotos.map((url, index) => (
                <Fragment key={`${index}-${url}`}>
                  <div className="pds-photo">
                    <img src={url} alt={`${profile.full_name} photo ${index + 2}`} loading="lazy" />
                  </div>
                  {/* Interests sit right below the 2nd photo */}
                  {index === 0 && details && details.interests.length > 0 ? (
                  <>
                    <p className="dfs-caption">Interests</p>
                    <div className="dfs-group">
                      <div className="pds-chips">
                        {details.interests.map((tag) => (
                          <span key={tag} className="pds-chip">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                  ) : null}
                </Fragment>
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
