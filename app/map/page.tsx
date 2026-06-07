"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import MatchFriendsSidebar from "@/components/map/MatchFriendsSidebar";
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
    <div className="flex h-full min-h-[300px] w-full items-center justify-center bg-surface-dim">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const waitingForLocation = !userCoords;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface">
      <Navbar />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden pt-16 pb-24 md:pb-0">
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

          <div className="relative h-full min-h-0 min-w-0 flex-1 bg-surface-dim">
            {loadingMatches ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : waitingForLocation ? (
              <div className="flex h-full items-center justify-center px-4 text-center">
                <p className="text-sm text-on-surface-variant">Finding your location…</p>
              </div>
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
                <p className="text-sm text-on-surface-variant">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadMatches()}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            ) : matches.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <span className="material-symbols-outlined mb-3 text-4xl text-primary/40">
                  map
                </span>
                <p className="text-sm text-on-surface-variant">
                  Match with someone to see them on the map.
                </p>
                <Link
                  href="/dashboard"
                  className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white"
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
              <div className="pointer-events-none absolute inset-x-0 bottom-16 z-[30] flex justify-center px-3 md:bottom-6 md:px-4">
                    <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface/95 p-3 shadow-xl backdrop-blur-md">
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate font-[var(--font-headline)] text-sm font-bold text-on-surface sm:text-base">
                          {focusedProfile.full_name}
                          {focusedProfile.age != null ? `, ${focusedProfile.age}` : ""}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-primary sm:text-sm">
                          {formatDistanceAway(focusedProfile.distanceMeters)}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-on-surface-variant sm:text-sm">
                          <span className="material-symbols-outlined text-base">
                            location_on
                          </span>
                          {focusedProfile.location || "Nepal"}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Close preview"
                        onClick={() => setFocusProfileId(null)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-dim text-on-surface-variant"
                      >
                        <span className="material-symbols-outlined text-xl">close</span>
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
