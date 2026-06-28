"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import BottomNav from "@/components/BottomNav";
import MatchFriendsSidebar from "@/components/map/MatchFriendsSidebar";import { MapPageSkeleton } from "@/components/skeletons/MapPageSkeleton";
import { profilePhotoUrl } from "@/components/map/MatchMapCard";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { haversineMeters, formatDistanceAway } from "@/lib/distance";
import { resolveProfileCoordinates } from "@/lib/locationCoords";
import { useUserCoordinates } from "@/lib/useUserCoordinates";
import type { MapProfile } from "@/components/map/types";
import type { Match, Profile } from "@/types";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-background">
      <div className="flex h-full items-center justify-center p-8">
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
      const coordinates = resolveProfileCoordinates(
        profile.location,
        profile.user_id ?? profile.id
      );
      return {
        ...profile,
        matchId: match.id,
        coordinates,
        distanceMeters: haversineMeters(userCoords, coordinates),
      };
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .map((profile, index) => ({ ...profile, browseOrder: index }));
}

export default function MapPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rawMatches, setRawMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [focusProfileId, setFocusProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userCoords = useUserCoordinates(user?.profile?.location, user?.id);

  const matches = useMemo(() => {
    if (!userCoords) return [];
    return matchesToMapProfiles(rawMatches, userCoords);
  }, [rawMatches, userCoords]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

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
    () => matches.map((p) => `${profileKey(p)}:${Math.round(p.distanceMeters)}`).join(","),
    [matches]
  );

  const focusedProfile = useMemo(
    () =>
      focusProfileId
        ? matches.find((p) => profileKey(p) === focusProfileId) ?? null
        : null,
    [matches, focusProfileId]
  );

  const handleProfileFocus = useCallback((id: string) => {
    setFocusProfileId(id);
  }, []);

  if (authLoading || !user) {
    return <MapPageSkeleton />;
  }

  const waitingForLocation = !userCoords;

  return (
    <div className="flex h-dvh overflow-hidden bg-surface">
      <ChatSidebarNav />
      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <MatchFriendsSidebar
            layout="sidebar"
            matches={matches}
            loading={loadingMatches}
            waitingForLocation={waitingForLocation}
            error={error}
            focusProfileId={focusProfileId}
            onProfileFocus={handleProfileFocus}
            onRetry={() => void loadMatches()}
          />

          <div className="relative h-full min-h-0 min-w-0 flex-1 bg-background">
            {/* iOS-style floating header (mobile) */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[25] px-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
              <div className="ios-glass pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                  <span
                    className="material-symbols-outlined text-xl text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    map
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-semibold leading-tight text-on-surface">Friends Map</p>
                  <p className="text-[13px] text-on-surface-variant">
                    {loadingMatches
                      ? "Loading…"
                      : waitingForLocation
                        ? "Finding your location…"
                        : `${matches.length} ${matches.length === 1 ? "match" : "matches"} nearby`}
                  </p>
                </div>
              </div>
            </div>

            {loadingMatches ? (
              <div className="h-full w-full bg-background">
                <div className="flex h-full items-center justify-center p-6 md:p-8">
                  <div className="h-full w-full animate-pulse rounded-none bg-surface-container-high/30" />
                </div>
              </div>
            ) : waitingForLocation ? (
              <div className="flex h-full items-center justify-center px-6 text-center">
                <p className="text-[15px] text-on-surface-variant">Finding your location…</p>
              </div>
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-[15px] text-on-surface-variant">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadMatches()}
                  className="rounded-full bg-primary px-6 py-2.5 text-[15px] font-semibold text-white active:scale-[0.98]"
                >
                  Try again
                </button>
              </div>
            ) : matches.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high">
                  <span className="material-symbols-outlined text-4xl text-primary/50">map</span>
                </div>
                <p className="max-w-[260px] text-[15px] leading-snug text-on-surface-variant">
                  Match with someone to see them on the map.
                </p>
                <Link
                  href="/match"
                  className="mt-5 rounded-full bg-primary px-6 py-2.5 text-[15px] font-semibold text-white active:scale-[0.98]"
                >
                  Start matching
                </Link>
              </div>
            ) : (
              <MapView
                profiles={matches}
                userCoordinates={userCoords}
                profilesOrderKey={profilesOrderKey}
                focusProfileId={focusProfileId}
                onProfileFocus={handleProfileFocus}
              />
            )}

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

            {focusedProfile && matches.length > 0 ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[30] flex justify-center px-3 md:bottom-6 md:px-4">
                <div className="ios-glass pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl p-3 shadow-2xl">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white/25">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profilePhotoUrl(focusedProfile)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-[17px] font-semibold text-on-surface">
                      {focusedProfile.full_name}
                      {focusedProfile.age != null ? `, ${focusedProfile.age}` : ""}
                    </p>
                    <p className="text-[13px] font-medium text-primary">
                      {formatDistanceAway(focusedProfile.distanceMeters)}
                    </p>
                    <p className="truncate text-[13px] text-on-surface-variant">
                      {focusedProfile.location || "Nepal"}
                    </p>
                  </div>
                  <Link
                      href="/chat"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25 active:scale-95"
                      aria-label="Open chat"
                    >
                      <span className="material-symbols-outlined text-xl">chat_bubble</span>
                    </Link>
                  <button
                    type="button"
                    aria-label="Close preview"
                    onClick={() => setFocusProfileId(null)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-on-surface-variant active:scale-95"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}