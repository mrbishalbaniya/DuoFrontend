"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import BottomNav from "@/components/BottomNav";
import MatchFriendsSidebar from "@/components/map/MatchFriendsSidebar";
import MapSettingsSidebar from "@/components/map/MapSettingsSidebar";
import { MapPageSkeleton } from "@/components/skeletons/MapPageSkeleton";
import { profilePhotoUrl } from "@/components/map/MatchMapCard";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { haversineMeters, formatDistanceAway } from "@/lib/distance";
import { resolveProfileCoordinates } from "@/lib/locationCoords";
import { useMapLayersStore } from "@/lib/mapLayers/store";
import { useUserCoordinates } from "@/lib/useUserCoordinates";
import type { MapProfile } from "@/components/map/types";
import type { Match, Profile } from "@/types";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-background">
      <div className="flex h-full items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="h-full w-full max-w-none animate-pulse rounded-none bg-surface-container-high/40" />
      </div>
    </div>
  ),
});

function profileKey(profile: Profile): string {
  return String(profile.user_id ?? profile.id ?? profile.full_name);
}

function matchesToMapProfiles(
  matches: Match[],
  userCoords: [number, number]
): MapProfile[] {
  return matches
    .map((match) => {
      const profile = match.other_user_profile;
      if (!profile) return null;

      const locationShared = profile.location_shared !== false;
      const coordinates = locationShared
        ? resolveProfileCoordinates(profile.location, profile.user_id ?? profile.id)
        : null;

      return {
        ...profile,
        matchId: match.id,
        coordinates,
        distanceMeters:
          coordinates != null ? haversineMeters(userCoords, coordinates) : null,
        locationShared,
      };
    })
    .filter((profile): profile is NonNullable<typeof profile> => profile != null)
    .sort((a, b) => {
      if (a.locationShared !== b.locationShared) return a.locationShared ? -1 : 1;
      return (a.distanceMeters ?? Number.POSITIVE_INFINITY) -
        (b.distanceMeters ?? Number.POSITIVE_INFINITY);
    })
    .map((profile, index) => ({ ...profile, browseOrder: index }));
}

export default function MapPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rawMatches, setRawMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [focusProfileId, setFocusProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [friendsPanelOpen, setFriendsPanelOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const settingsPanelOpen = useMapLayersStore((s) => s.settingsPanelOpen);
  const setSettingsPanelOpen = useMapLayersStore((s) => s.setSettingsPanelOpen);

  useEffect(() => {
    if (settingsPanelOpen && friendsPanelOpen) {
      setFriendsPanelOpen(false);
    }
  }, [settingsPanelOpen, friendsPanelOpen]);

  useEffect(() => {
    if (friendsPanelOpen && settingsPanelOpen) {
      setSettingsPanelOpen(false);
    }
  }, [friendsPanelOpen, settingsPanelOpen, setSettingsPanelOpen]);

  const handleFriendsPanelToggle = useCallback(() => {
    setFriendsPanelOpen((open) => {
      const next = !open;
      if (next) setSettingsPanelOpen(false);
      return next;
    });
  }, [setSettingsPanelOpen]);

  const handleSettingsPanelToggle = useCallback(() => {
    const next = !settingsPanelOpen;
    setSettingsPanelOpen(next);
    if (next) setFriendsPanelOpen(false);
  }, [settingsPanelOpen, setSettingsPanelOpen]);

  const userCoords = useUserCoordinates(user?.profile?.location, user?.id);

  const matches = useMemo(() => {
    if (!userCoords) return [];
    return matchesToMapProfiles(rawMatches, userCoords);
  }, [rawMatches, userCoords]);

  const mapProfiles = useMemo(
    () =>
      matches.filter(
        (p): p is MapProfile & { coordinates: [number, number]; distanceMeters: number } =>
          p.locationShared && p.coordinates != null && p.distanceMeters != null
      ),
    [matches]
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const loadMatches = useCallback(async () => {
    setLoadingMatches(true);
    setError(null);
    try {
      const data = await api.getMatches();
      setRawMatches(data);
    } catch {
      setError("Could not load your matches.");
      setRawMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void loadMatches();
    }
  }, [user, loadMatches]);

  const profilesOrderKey = useMemo(
    () =>
      mapProfiles
        .map((p) => `${profileKey(p)}:${Math.round(p.distanceMeters)}`)
        .join(","),
    [mapProfiles]
  );

  const focusedProfile = useMemo(
    () =>
      focusProfileId
        ? mapProfiles.find((p) => profileKey(p) === focusProfileId) ?? null
        : null,
    [mapProfiles, focusProfileId]
  );

  const handleProfileFocus = useCallback((id: string) => {
    setFocusProfileId(id);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 280);
    return () => window.clearTimeout(t);
  }, [friendsPanelOpen, settingsPanelOpen, isDesktop]);

  if (authLoading || !user) {
    return <MapPageSkeleton />;
  }

  const waitingForLocation = !userCoords;

  return (
    <div className="map-page flex h-dvh max-h-dvh overflow-hidden bg-surface">
      <ChatSidebarNav />
      <main className="map-page__main relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="map-page__body relative flex min-h-0 flex-1 overflow-hidden">
          {isDesktop && friendsPanelOpen ? (
            <MatchFriendsSidebar
              layout="sidebar"
              open={friendsPanelOpen}
              onOpenChange={setFriendsPanelOpen}
              matches={matches}
              loading={loadingMatches}
              waitingForLocation={waitingForLocation}
              error={error}
              focusProfileId={focusProfileId}
              onProfileFocus={handleProfileFocus}
              onRetry={() => void loadMatches()}
            />
          ) : null}

          {isDesktop ? (
            <button
              type="button"
              aria-label={friendsPanelOpen ? "Hide friends panel" : "Show friends panel"}
              aria-expanded={friendsPanelOpen}
              className={`map-friends-edge-handle ${friendsPanelOpen ? "map-friends-edge-handle--open" : ""}`}
              onClick={handleFriendsPanelToggle}
            >
              <span className="material-symbols-outlined text-xl">
                {friendsPanelOpen ? "chevron_left" : "chevron_right"}
              </span>
            </button>
          ) : null}

          <div className="map-page__stage relative h-full min-h-0 min-w-0 flex-1 bg-black">
            {/* Mobile floating header */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[25] px-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
              <div className="ios-glass pointer-events-auto flex items-center gap-3 rounded-2xl px-3 py-2.5 shadow-lg sm:px-4 sm:py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span
                    className="material-symbols-outlined text-xl text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    map
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold leading-tight text-on-surface sm:text-[17px]">
                    Friends Map
                  </p>
                  <p className="truncate text-[12px] text-on-surface-variant sm:text-[13px]">
                    {loadingMatches
                      ? "Loading…"
                      : waitingForLocation
                        ? "Finding your location…"
                        : `${matches.length} ${matches.length === 1 ? "match" : "matches"} nearby`}
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop floating title when friends panel is closed */}
            {isDesktop && !friendsPanelOpen ? (
              <div className="pointer-events-none absolute left-4 top-4 z-[25] hidden md:block">
                <div className="ios-glass pointer-events-auto rounded-2xl px-4 py-2.5 shadow-lg">
                  <p className="text-[15px] font-semibold text-on-surface">Friends Map</p>
                  <p className="text-[12px] text-on-surface-variant">
                    {loadingMatches
                      ? "Loading…"
                      : `${matches.length} ${matches.length === 1 ? "match" : "matches"} nearby`}
                  </p>
                </div>
              </div>
            ) : null}

            <MapView
              profiles={mapProfiles}
              userCoordinates={userCoords}
              profilesOrderKey={profilesOrderKey}
              focusProfileId={focusProfileId}
              onProfileFocus={handleProfileFocus}
            />

            {waitingForLocation ? (
              <div className="pointer-events-none absolute inset-0 z-[18] flex items-center justify-center px-6 text-center">
                <div className="ios-glass rounded-2xl px-5 py-3 shadow-lg">
                  <p className="text-[15px] text-on-surface-variant">Finding your location…</p>
                </div>
              </div>
            ) : error && matches.length === 0 && !loadingMatches ? (
              <div className="pointer-events-none absolute inset-0 z-[18] flex flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="ios-glass pointer-events-auto rounded-2xl px-5 py-4 shadow-lg">
                  <p className="text-[15px] text-on-surface-variant">{error}</p>
                  <button
                    type="button"
                    onClick={() => void loadMatches()}
                    className="mt-3 rounded-full bg-primary px-6 py-2.5 text-[15px] font-semibold text-white active:scale-[0.98]"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : null}

            {matches.length === 0 && !error && !waitingForLocation && !loadingMatches ? (
              <div className="map-page__empty pointer-events-none absolute inset-x-0 z-[20] flex justify-center px-4 sm:px-6">
                <div className="ios-glass pointer-events-auto w-full max-w-sm rounded-2xl px-5 py-4 text-center shadow-lg">
                  <p className="text-[14px] leading-snug text-on-surface-variant sm:text-[15px]">
                    Match with someone to see them on the map.
                  </p>
                  <Link
                    href="/match"
                    className="mt-3 inline-flex rounded-full bg-primary px-6 py-2.5 text-[15px] font-semibold text-white active:scale-[0.98]"
                  >
                    Start matching
                  </Link>
                </div>
              </div>
            ) : null}

            {!isDesktop ? (
              <MatchFriendsSidebar
                layout="sheet"
                matches={matches}
                loading={loadingMatches}
                waitingForLocation={waitingForLocation}
                error={error}
                focusProfileId={focusProfileId}
                onProfileFocus={handleProfileFocus}
                onRetry={() => void loadMatches()}
              />
            ) : null}

            {focusedProfile && mapProfiles.length > 0 ? (
              <div className="map-page__focus pointer-events-none absolute inset-x-0 z-[30] flex justify-center px-3 sm:px-4">
                <div className="ios-glass map-focus-card pointer-events-auto flex w-full max-w-sm items-center gap-2.5 p-2.5 sm:gap-3 sm:p-3">
                  <div className="map-focus-card__avatar h-11 w-11 shrink-0 overflow-hidden sm:h-12 sm:w-12">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profilePhotoUrl(focusedProfile)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-[15px] font-semibold text-on-surface sm:text-[17px]">
                      {focusedProfile.full_name}
                      {focusedProfile.age != null ? `, ${focusedProfile.age}` : ""}
                    </p>
                    <p className="text-[12px] font-medium text-primary sm:text-[13px]">
                      {formatDistanceAway(focusedProfile.distanceMeters)}
                    </p>
                    <p className="truncate text-[12px] text-on-surface-variant sm:text-[13px]">
                      {focusedProfile.location || "Nepal"}
                    </p>
                  </div>
                  <Link
                    href="/chat"
                    className="map-focus-card__action shrink-0"
                    aria-label="Open chat"
                  >
                    <span className="material-symbols-outlined text-xl">chat_bubble</span>
                  </Link>
                  <button
                    type="button"
                    aria-label="Close preview"
                    onClick={() => setFocusProfileId(null)}
                    className="map-focus-card__close shrink-0"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {isDesktop ? (
            <button
              type="button"
              aria-label={settingsPanelOpen ? "Hide settings panel" : "Show settings panel"}
              aria-expanded={settingsPanelOpen}
              aria-controls="map-layers-settings-panel"
              className={`map-settings-edge-handle ${settingsPanelOpen ? "map-settings-edge-handle--open" : ""}`}
              onClick={handleSettingsPanelToggle}
            >
              <span className="material-symbols-outlined text-xl">
                {settingsPanelOpen ? "chevron_right" : "chevron_left"}
              </span>
            </button>
          ) : null}

          {isDesktop && settingsPanelOpen ? (
            <MapSettingsSidebar open={settingsPanelOpen} />
          ) : null}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
