"use client";

import { useEffect, type ReactNode } from "react";
import type { Profile } from "@/types";

export function getProfilePhotos(profile: Profile): string[] {
  const id = String(
    profile.user_id ?? profile.id ?? `${profile.full_name}-${profile.age ?? "0"}`
  );
  const fallbacks = [
    profile.photo_url || `https://picsum.photos/seed/${id}-1/600/800`,
    `https://picsum.photos/seed/${id}-2/600/800`,
    `https://picsum.photos/seed/${id}-3/600/800`,
  ];

  if (Array.isArray(profile.photo_urls) && profile.photo_urls.length > 0) {
    const urls = profile.photo_urls.filter(Boolean).slice(0, 3);
    for (let i = urls.length; i < 3; i++) {
      urls.push(fallbacks[i]);
    }
    return urls;
  }

  return fallbacks;
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
      {onInfoClick ? (
        <button
          type="button"
          aria-label="View profile details"
          disabled={infoDisabled}
          onClick={(e) => {
            e.stopPropagation();
            onInfoClick();
          }}
          className="pointer-events-auto absolute top-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-black/50 active:scale-95 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[22px]">info</span>
        </button>
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <div
          className="absolute inset-x-0 bottom-0 h-[42%] min-h-[140px] bg-gradient-to-t from-black/90 via-black/55 to-transparent"
          aria-hidden
        />
        <div className="relative p-6 pb-6">
          <h2 className="font-[var(--font-headline)] text-2xl font-bold text-white drop-shadow-sm">
            {profile.full_name}
            {profile.age != null && (
              <span className="font-semibold text-white/90">, {profile.age}</span>
            )}
          </h2>
          <div className="mt-2 flex items-center gap-2 text-white/95">
            <span className="material-symbols-outlined shrink-0 text-lg drop-shadow-sm">
              location_on
            </span>
            <span className="text-sm font-medium drop-shadow-sm">
              {profile.location || "—"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

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
  const tags = Array.isArray(profile?.lifestyle_tags) ? profile.lifestyle_tags : [];

  const detailItems = profile
    ? [
        { label: "Education", value: profile.education, icon: "school" },
        { label: "Occupation", value: profile.occupation, icon: "work" },
        { label: "Religion", value: profile.religion, icon: "temple_hindu" },
        { label: "Work", value: profile.work_preference, icon: "business_center" },
      ].filter((item) => item.value)
    : [];

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!profile) return null;

  const photos = getProfilePhotos(profile);
  const extraPhotos = photos.slice(1, 3);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col justify-end transition-opacity duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 bg-primary/30 backdrop-blur-sm"
        aria-label="Close profile"
        onClick={onClose}
      />

      <div
        className={`relative z-[101] mx-auto flex h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] border-t-4 border-primary/35 bg-background shadow-[0_-12px_48px] shadow-primary/20 transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center bg-background pb-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="h-1.5 w-12 rounded-full bg-primary/35 transition-colors hover:bg-primary/55"
            aria-label="Close profile"
          />
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-secondary/30 to-background">
          <div className="relative h-52 shrink-0 sm:h-56">
            {photos[0] ? (
              <img src={photos[0]} alt={profile.full_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/15">
                <span className="material-symbols-outlined text-7xl text-primary/40">person</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/35 via-transparent to-background" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white shadow-lg shadow-primary/25 transition-all gradient-brand-br hover:opacity-90 active:scale-95"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          <div className="relative space-y-4 px-5 pb-10 pt-4">
            <div className="rounded-2xl border border-primary/15 bg-background p-5 shadow-[0_8px_30px] shadow-primary/12">
              <h2 className="font-[var(--font-headline)] text-[1.65rem] font-bold leading-tight text-on-surface">
                {profile.full_name}
                {profile.age != null && (
                  <span className="font-bold text-primary">, {profile.age}</span>
                )}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-[15px] font-medium text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px] text-primary">location_on</span>
                {profile.location || "—"}
              </p>
              {profile.is_verified && (
                <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-secondary px-3 py-1.5 text-xs font-bold text-primary">
                  <span
                    className="material-symbols-outlined text-base"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  Verified profile
                </span>
              )}
            </div>

            {profile.bio ? (
              <section className="rounded-2xl border border-outline-variant/40 bg-secondary/60 p-5 shadow-[0_4px_20px] shadow-primary/8">
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                  About
                </h3>
                <p className="text-[15px] leading-relaxed text-on-surface-variant">{profile.bio}</p>
              </section>
            ) : null}

            {detailItems.length > 0 ? (
              <section className="grid grid-cols-2 gap-3">
                {detailItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-primary/10 bg-background p-4 shadow-[0_4px_16px] shadow-primary/6"
                  >
                    <div className="mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-accent">
                        {item.icon}
                      </span>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant/70">
                        {item.label}
                      </p>
                    </div>
                    <p className="text-sm font-semibold leading-snug text-on-surface">{item.value}</p>
                  </div>
                ))}
              </section>
            ) : null}

            {tags.length > 0 ? (
              <section className="rounded-2xl border border-outline-variant/40 bg-secondary/60 p-5 shadow-[0_4px_20px] shadow-primary/8">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                  Lifestyle
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-primary/20 bg-background px-3 py-1.5 text-xs font-semibold text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                More photos
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {extraPhotos.map((url, index) => (
                  <div
                    key={`${profile.user_id ?? profile.id}-detail-${index + 1}`}
                    className="aspect-[3/4] overflow-hidden rounded-2xl border border-primary/15 bg-surface-variant shadow-[0_8px_24px] shadow-primary/12"
                  >
                    <img
                      src={url}
                      alt={`${profile.full_name} photo ${index + 2}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
          {footer ? (
            <div className="shrink-0 border-t border-primary/10 bg-background px-5 py-4">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
