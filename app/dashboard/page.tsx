"use client";

import { useState, useEffect, useCallback, useMemo, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { DashboardActionBar } from "@/components/dashboard/DashboardActionBar";
import { DashboardMenuSheet } from "@/components/dashboard/DashboardMenuSheet";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import DiscoveryFiltersSheet, {
  type DiscoveryFilters,
} from "@/components/dashboard/DiscoveryFiltersSheet";
import {
  SwipeableCardStack,
  type SwipeDirection,
  type SwipeableCardStackHandle,
} from "@/components/ui/tinder-like-swipe";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { detectUserLocation, isDefaultLocation } from "@/lib/geolocation";
import type { Profile, SwipeAction } from "@/types";

function getProfilePhotos(profile: Profile): string[] {
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

function ProfileCardOverlay({
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

function ProfileDetailSheet({
  profile,
  open,
  onClose,
  footer,
}: {
  profile: Profile | null;
  open: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
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
        className={`relative z-[101] mx-auto w-full max-w-lg h-[92dvh] flex flex-col overflow-hidden rounded-t-[1.75rem] border-t-4 border-primary/35 bg-background shadow-[0_-12px_48px] shadow-primary/20 transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex justify-center pt-3 pb-2 bg-background">
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-1.5 rounded-full bg-primary/35 hover:bg-primary/55 transition-colors"
            aria-label="Close profile"
          />
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-secondary/30 to-background">
          <div className="relative h-52 sm:h-56 shrink-0">
            {photos[0] ? (
              <img
                src={photos[0]}
                alt={profile.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-7xl text-primary/40">person</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/35 via-transparent to-background" />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full gradient-brand-br border border-white/30 text-white flex items-center justify-center shadow-lg shadow-primary/25 hover:opacity-90 active:scale-95 transition-all"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          <div className="px-5 pb-10 pt-4 relative space-y-4">
            <div className="bg-background rounded-2xl p-5 shadow-[0_8px_30px] shadow-primary/12 border border-primary/15">
              <h2 className="text-[1.65rem] leading-tight font-[var(--font-headline)] font-bold text-on-surface">
                {profile.full_name}
                {profile.age != null && (
                  <span className="text-primary font-bold">, {profile.age}</span>
                )}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-on-surface-variant text-[15px] font-medium">
                <span className="material-symbols-outlined text-[20px] text-primary">location_on</span>
                {profile.location || "—"}
              </p>
              {profile.is_verified && (
                <span className="inline-flex mt-3 items-center gap-1 px-3 py-1.5 bg-secondary text-primary border border-primary/20 rounded-full text-xs font-bold">
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

            {profile.bio && (
              <section className="bg-secondary/60 rounded-2xl p-5 shadow-[0_4px_20px] shadow-primary/8 border border-outline-variant/40">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent mb-2">
                  About
                </h3>
                <p className="text-on-surface-variant text-[15px] leading-relaxed">{profile.bio}</p>
              </section>
            )}

            {detailItems.length > 0 && (
              <section className="grid grid-cols-2 gap-3">
                {detailItems.map((item) => (
                  <div
                    key={item.label}
                    className="bg-background rounded-2xl p-4 border border-primary/10 shadow-[0_4px_16px] shadow-primary/6"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="material-symbols-outlined text-base text-accent">
                        {item.icon}
                      </span>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant/70">
                        {item.label}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-on-surface leading-snug">{item.value}</p>
                  </div>
                ))}
              </section>
            )}

            {tags.length > 0 && (
              <section className="bg-secondary/60 rounded-2xl p-5 border border-outline-variant/40 shadow-[0_4px_20px] shadow-primary/8">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent mb-3">
                  Lifestyle
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-background rounded-full text-xs font-semibold text-primary border border-primary/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent mb-3">
                More photos
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {extraPhotos.map((url, index) => (
                  <div
                    key={`${profile.user_id ?? profile.id}-detail-${index + 1}`}
                    className="aspect-[3/4] rounded-2xl overflow-hidden border border-primary/15 shadow-[0_8px_24px] shadow-primary/12 bg-surface-variant"
                  >
                    <img
                      src={url}
                      alt={`${profile.full_name} photo ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
          {footer ? <div className="shrink-0 border-t border-primary/10 bg-background px-5 py-4">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading, fetchUser } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [discoverInfoOpen, setDiscoverInfoOpen] = useState(false);
  const [stackKey, setStackKey] = useState(0);
  const swipingRef = useRef(false);
  const stackRef = useRef<SwipeableCardStackHandle>(null);
  const locationSyncedRef = useRef(false);

  const fetchProfiles = useCallback(async () => {
    try {
      const data = await api.discoverProfiles();
      setProfiles(data);
    } catch {
      // not logged in
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) fetchProfiles();
  }, [user, authLoading, router, fetchProfiles]);

  useEffect(() => {
    if (!user || locationSyncedRef.current) return;

    const location = user.profile?.location;
    if (!isDefaultLocation(location)) return;

    locationSyncedRef.current = true;
    void (async () => {
      try {
        const detected = await detectUserLocation();
        await api.updateProfile({ location: detected.label });
        await fetchUser();
      } catch {
        locationSyncedRef.current = false;
      }
    })();
  }, [user, fetchUser]);

  const currentProfile = profiles[0];

  const deckProfiles = useMemo(() => profiles.slice(0, 4), [profiles]);

  const deckImages = useMemo(
    () => [...deckProfiles].reverse().map((profile) => getProfilePhotos(profile)[0]),
    [deckProfiles]
  );

  useEffect(() => {
    setDiscoverInfoOpen(false);
  }, [currentProfile?.user_id, currentProfile?.id]);

  const handleApplyFilters = useCallback(
    async (filters: DiscoveryFilters) => {
      await api.updateProfile(filters);
      await fetchUser();
      setStackKey((key) => key + 1);
      setLoading(true);
      await fetchProfiles();
    },
    [fetchProfiles, fetchUser]
  );

  const handleSwipe = useCallback((action: SwipeAction, profile: Profile): boolean => {
    if (swipingRef.current) return false;

    const toUserId = profile.user_id ?? profile.id;
    if (!toUserId) {
      console.error("Swipe error: profile is missing user id", profile);
      return false;
    }

    swipingRef.current = true;
    startTransition(() => setSwiping(true));

    const nextProfiles = profiles.filter((p) => (p.user_id ?? p.id) !== toUserId);
    setProfiles(nextProfiles);
    if (nextProfiles.length === 0) {
      setLoading(true);
      void fetchProfiles();
    }

    swipingRef.current = false;
    startTransition(() => setSwiping(false));

    void (async () => {
      try {
        const res = await api.swipe(toUserId, action);
        if (res.is_match && res.match) {
          sessionStorage.setItem("latest_match", JSON.stringify(res.match));
          router.push("/match");
        }
      } catch (err) {
        console.error("Swipe error:", err);
        setStackKey((key) => key + 1);
        void fetchProfiles();
      }
    })();

    return true;
  }, [fetchProfiles, profiles, router]);

  const handleStackSwipe = useCallback(
    (direction: SwipeDirection, _image: string, stackIndex: number) => {
      if (swipingRef.current || filtersOpen || discoverInfoOpen || menuOpen) return false;

      const profile = deckProfiles[deckProfiles.length - 1 - stackIndex];
      if (!profile) return false;

      const action: SwipeAction = direction === "right" ? "LIKE" : "SKIP";
      return handleSwipe(action, profile);
    },
    [deckProfiles, discoverInfoOpen, filtersOpen, handleSwipe, menuOpen]
  );

  const userProfile = user?.profile ?? null;
  const sheetOpen = filtersOpen || discoverInfoOpen || menuOpen;
  const controlsDisabled = swiping || sheetOpen;

  const triggerSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (controlsDisabled) return;
      stackRef.current?.swipeTop(direction);
    },
    [controlsDisabled]
  );

  if (authLoading || loading) {
    return (
      <>
        <main className="pt-6 pb-32 px-4 max-w-lg mx-auto min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <p className="text-on-surface-variant font-medium">Loading profiles...</p>
          </div>
        </main>
        <BottomNav />
      </>
    );
  }

  if (!currentProfile) {
    const prefs = user?.profile;
    return (
      <>
        <main className="flex min-h-screen w-full max-w-none flex-col bg-surface px-4 pb-28 pt-2">
          <DashboardTopBar
            onOpenMenu={() => setMenuOpen(true)}
            onOpenFilters={() => setFiltersOpen(true)}
            disabled={controlsDisabled}
          />

          <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-1 items-center justify-center">
            <div className="text-center space-y-6">
            <span className="material-symbols-outlined text-6xl text-primary/30">search_off</span>
            <h2 className="text-2xl font-[var(--font-headline)] font-bold text-on-surface">
              No profiles to show
            </h2>
            <p className="text-on-surface-variant">
              {prefs?.pref_verified_only
                ? "No verified profiles match your filters. Try turning off “Verified only”."
                : prefs?.pref_age_min && prefs?.pref_age_max && prefs.pref_age_max - prefs.pref_age_min <= 5
                  ? "Your age range may be too narrow. Widen it in discovery filters."
                  : "No one matches your current filters, or you have swiped through everyone nearby. Try adjusting filters or check back later."}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => setFiltersOpen(true)}
                className="px-8 py-3 rounded-full border border-primary/20 bg-background font-bold text-primary shadow-sm active:scale-95 transition-all"
              >
                Adjust filters
              </button>
              <button
                onClick={() => {
                  setLoading(true);
                  void fetchProfiles();
                }}
                className="px-8 py-3 gradient-brand text-white rounded-full font-bold shadow-lg active:scale-95 transition-all"
              >
                Refresh
              </button>
            </div>
            </div>
          </div>
        </main>
        <DashboardMenuSheet
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onOpenFilters={() => setFiltersOpen(true)}
        />
        <DiscoveryFiltersSheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          profile={user?.profile ?? null}
          onApply={handleApplyFilters}
        />
        {!sheetOpen && <BottomNav />}
      </>
    );
  }

  return (
    <>
      <main className="flex min-h-screen w-full max-w-none flex-col bg-surface px-4 pb-28 pt-2">
        <DashboardTopBar
          onOpenMenu={() => setMenuOpen(true)}
          onOpenFilters={() => setFiltersOpen(true)}
          disabled={controlsDisabled}
          profilesLeft={profiles.length}
        />

        <div className="relative mx-auto mt-5 h-[min(72vh,680px)] min-h-[420px] w-full max-w-md shrink-0">
          <SwipeableCardStack
            ref={stackRef}
            key={stackKey}
            images={deckImages}
            borderRadius={16}
            disabled={swiping || sheetOpen}
            greenShadowColor="rgba(34, 197, 94, 0.72)"
            redShadowColor="rgba(239, 68, 68, 0.72)"
            shadowSize="0 10px 28px"
            shadowBlur="rgba(183, 110, 121, 0.14)"
            onSwipe={handleStackSwipe}
            renderOverlay={(stackIndex, isTopCard) => {
              const profile = deckProfiles[deckProfiles.length - 1 - stackIndex];
              if (!profile) return null;
              return (
                <ProfileCardOverlay
                  profile={profile}
                  isTopCard={isTopCard}
                  onInfoClick={() => setDiscoverInfoOpen(true)}
                  infoDisabled={controlsDisabled}
                />
              );
            }}
          />
        </div>

        <DashboardActionBar
          disabled={controlsDisabled}
          onSkip={() => triggerSwipe("left")}
          onLike={() => triggerSwipe("right")}
          onInfo={() => setDiscoverInfoOpen(true)}
        />

        <p className="mt-4 text-center text-xs font-medium text-on-surface-variant/60">
          Swipe the card left to skip, right to like
        </p>
      </main>

      <DashboardMenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenFilters={() => setFiltersOpen(true)}
      />

      <ProfileDetailSheet
        profile={currentProfile}
        open={discoverInfoOpen}
        onClose={() => setDiscoverInfoOpen(false)}
      />

      <DiscoveryFiltersSheet
        profile={userProfile}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={handleApplyFilters}
      />

      {!sheetOpen && <BottomNav />}
    </>
  );
}
