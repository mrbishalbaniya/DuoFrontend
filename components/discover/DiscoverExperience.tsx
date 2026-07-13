"use client";

import { useState, useEffect, useCallback, useMemo, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";
import { DashboardActionBar } from "@/components/dashboard/DashboardActionBar";
import { DashboardMenuSheet } from "@/components/dashboard/DashboardMenuSheet";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import DiscoveryFiltersSheet, {
  type DiscoveryFilters,
} from "@/components/dashboard/DiscoveryFiltersSheet";
import {
  getProfilePhotos,
  ProfileCardOverlay,
  ProfileDetailSheet,
} from "@/components/discover/profileDiscoverUi";
import { DiscoverPageSkeleton } from "@/components/skeletons/DiscoverPageSkeleton";
import {
  SwipeableCardStack,
  type SwipeDirection,
  type SwipeableCardStackHandle,
} from "@/components/ui/tinder-like-swipe";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { detectUserLocation, isDefaultLocation } from "@/lib/geolocation";
import type { Profile, SwipeAction } from "@/types";

function MatchDesktopHeader({
  onOpenFilters,
  disabled = false,
}: {
  onOpenFilters: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={`mx-auto hidden w-full shrink-0 justify-end pb-2 pt-1 md:flex ${MATCH_CARD_WIDTH}`}>
      <button
        type="button"
        aria-label="Open discovery filters"
        disabled={disabled}
        onClick={onOpenFilters}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/20 bg-background px-2.5 py-1.5 text-[11px] font-semibold text-primary shadow-[0_4px_16px] shadow-primary/10 transition-all hover:bg-secondary active:scale-95 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[16px]">tune</span>
        Filters
      </button>
    </div>
  );
}

const MATCH_CARD_WIDTH =
  "w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-[30rem]";

let discoverProfilesCache: Profile[] | null = null;
let discoverExpandedSearch = false;

export function DiscoverExperience() {
  const { user, loading: authLoading, fetchUser } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>(() => discoverProfilesCache ?? []);
  const [expandedSearch, setExpandedSearch] = useState(discoverExpandedSearch);
  const [loading, setLoading] = useState(() => discoverProfilesCache === null);
  const [swiping, setSwiping] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [discoverInfoOpen, setDiscoverInfoOpen] = useState(false);
  const [stackKey, setStackKey] = useState(0);
  const swipingRef = useRef(false);
  const stackRef = useRef<SwipeableCardStackHandle>(null);
  const locationSyncedRef = useRef(false);

  const fetchProfiles = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const { profiles: data, expandedSearch: expanded } = await api.discoverProfiles();
      discoverProfilesCache = data;
      discoverExpandedSearch = expanded;
      setProfiles(data);
      setExpandedSearch(expanded);
    } catch {
      discoverProfilesCache = [];
      discoverExpandedSearch = false;
      setProfiles([]);
      setExpandedSearch(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!authLoading && user) {
      void fetchProfiles({ silent: discoverProfilesCache !== null });
    }
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
      discoverProfilesCache = null;
      discoverExpandedSearch = false;
      await fetchProfiles();
    },
    [fetchProfiles, fetchUser]
  );

  const handleSwipe = useCallback(
    (action: SwipeAction, profile: Profile): boolean => {
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
        void fetchProfiles();
      }

      void (async () => {
        try {
          const res = await api.swipe(toUserId, action);
          if (res.is_match && res.match) {
            sessionStorage.setItem("latest_match", JSON.stringify(res.match));
            router.push("/match/celebration");
          }
        } catch (err) {
          console.error("Swipe error:", err);
          setStackKey((key) => key + 1);
          void fetchProfiles();
        } finally {
          swipingRef.current = false;
          startTransition(() => setSwiping(false));
        }
      })();

      return true;
    },
    [fetchProfiles, profiles, router]
  );

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
    return <DiscoverPageSkeleton />;
  }

  if (!currentProfile) {
    return (
      <>
        <main className="mobile-bottom-nav-offset flex h-full min-h-0 flex-col overflow-hidden px-4 pt-2 md:px-6 md:pb-8 lg:px-8">
          <div className={`mx-auto flex min-h-0 flex-1 items-center justify-center overflow-hidden ${MATCH_CARD_WIDTH}`}>
            <div className="space-y-6 px-2 text-center md:px-4">
              <span className="material-symbols-outlined text-6xl text-primary/30 md:text-7xl">
                favorite
              </span>
              <h2 className="font-[var(--font-headline)] text-2xl font-bold text-on-surface md:text-3xl">
                You are all caught up
              </h2>
              <p className="mx-auto max-w-md text-on-surface-variant md:text-base">
                You have seen everyone available right now. Check back soon as new people join Duo.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="rounded-full border border-primary/20 bg-background px-8 py-3 font-bold text-primary shadow-sm transition-all active:scale-95 md:px-10 md:py-3.5"
                >
                  Adjust filters
                </button>
                <button
                  onClick={() => {
                    void fetchProfiles();
                  }}
                  className="rounded-full px-8 py-3 font-bold text-white shadow-lg transition-all gradient-brand active:scale-95 md:px-10 md:py-3.5"
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
      </>
    );
  }

  return (
    <>
      <main className="mobile-bottom-nav-offset flex h-full min-h-0 flex-col overflow-hidden px-4 pt-2 md:px-6 md:pb-8 lg:px-8">
        <div className="shrink-0 md:hidden">
          <DashboardTopBar
            onOpenMenu={() => setMenuOpen(true)}
            onOpenFilters={() => setFiltersOpen(true)}
            disabled={controlsDisabled}
          />
        </div>

        <MatchDesktopHeader
          onOpenFilters={() => setFiltersOpen(true)}
          disabled={controlsDisabled}
        />

        {expandedSearch ? (
          <div className={`mx-auto mb-2 rounded-2xl border border-primary/15 bg-primary/10 px-4 py-2 text-center text-sm text-on-surface ${MATCH_CARD_WIDTH}`}>
            We expanded your search to show more compatible people nearby.
          </div>
        ) : null}

        <div className={`relative mx-auto mt-1 min-h-0 flex-1 md:mt-2 ${MATCH_CARD_WIDTH}`}>
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
            className="min-h-0"
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

        <div className="shrink-0 pb-1 pt-2 md:pb-4 md:pt-4">
          <DashboardActionBar
            disabled={controlsDisabled}
            onSkip={() => triggerSwipe("left")}
            onLike={() => triggerSwipe("right")}
            onInfo={() => setDiscoverInfoOpen(true)}
          />
        </div>
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
    </>
  );
}
