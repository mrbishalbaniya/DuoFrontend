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

export function DiscoverExperience() {
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
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      void fetchProfiles();
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
      setLoading(true);
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
            router.push("/match/celebration");
          }
        } catch (err) {
          console.error("Swipe error:", err);
          setStackKey((key) => key + 1);
          void fetchProfiles();
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
    const prefs = user?.profile;
    return (
      <>
        <main className="flex h-full min-h-0 flex-col overflow-hidden px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-2 md:pb-4">
          <div className="shrink-0">
            <DashboardTopBar
              onOpenMenu={() => setMenuOpen(true)}
              onOpenFilters={() => setFiltersOpen(true)}
              disabled={controlsDisabled}
            />
          </div>

          <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 items-center justify-center overflow-hidden">
            <div className="space-y-6 text-center">
              <span className="material-symbols-outlined text-6xl text-primary/30">search_off</span>
              <h2 className="font-[var(--font-headline)] text-2xl font-bold text-on-surface">
                No profiles to discover
              </h2>
              <p className="text-on-surface-variant">
                {prefs?.pref_verified_only
                  ? "No verified profiles match your filters. Try turning off “Verified only”."
                  : prefs?.pref_age_min &&
                      prefs?.pref_age_max &&
                      prefs.pref_age_max - prefs.pref_age_min <= 5
                    ? "Your age range may be too narrow. Widen it in discovery filters."
                    : "No one matches your current filters, or you have swiped through everyone nearby. Try adjusting filters or check back later."}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="rounded-full border border-primary/20 bg-background px-8 py-3 font-bold text-primary shadow-sm transition-all active:scale-95"
                >
                  Adjust filters
                </button>
                <button
                  onClick={() => {
                    setLoading(true);
                    void fetchProfiles();
                  }}
                  className="rounded-full px-8 py-3 font-bold text-white shadow-lg transition-all gradient-brand active:scale-95"
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
      <main className="flex h-full min-h-0 flex-col overflow-hidden px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-2 md:pb-4">
        <div className="shrink-0">
          <DashboardTopBar
            onOpenMenu={() => setMenuOpen(true)}
            onOpenFilters={() => setFiltersOpen(true)}
            disabled={controlsDisabled}
            profilesLeft={profiles.length}
          />
        </div>

        <div className="relative mx-auto mt-2 min-h-0 w-full max-w-md flex-1">
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

          <div className="shrink-0 pb-1 pt-2">
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

      {!sheetOpen && <BottomNav />}
    </>
  );
}
