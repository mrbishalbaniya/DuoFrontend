"use client";

import Link from "next/link";
import { useState } from "react";
import MatchBrowseMobileSheet, {
  type MatchBrowseSheetSnap,
} from "@/components/map/MatchBrowseMobileSheet";
import MatchMapCard from "@/components/map/MatchMapCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapProfile } from "@/components/map/types";
import type { Profile } from "@/types";

function profileKey(profile: Profile): string {
  return String(profile.user_id ?? profile.id ?? profile.full_name);
}

interface MatchFriendsSidebarProps {
  matches: MapProfile[];
  loading: boolean;
  waitingForLocation: boolean;
  error: string | null;
  focusProfileId: string | null;
  onProfileFocus: (id: string) => void;
  onRetry: () => void;
  layout?: "sidebar" | "sheet";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function FriendsSubtitle({
  loading,
  waitingForLocation,
  matchCount,
}: {
  loading: boolean;
  waitingForLocation: boolean;
  matchCount: number;
}) {
  if (loading) return <>Loading…</>;
  if (waitingForLocation) return <>Finding your location…</>;
  return (
    <>
      {matchCount} {matchCount === 1 ? "match" : "matches"} near you
    </>
  );
}

function FriendsListBody({
  matches,
  loading,
  waitingForLocation,
  error,
  focusProfileId,
  onProfileFocus,
  onRetry,
  onSelect,
}: {
  matches: MapProfile[];
  loading: boolean;
  waitingForLocation: boolean;
  error: string | null;
  focusProfileId: string | null;
  onProfileFocus: (id: string) => void;
  onRetry: () => void;
  onSelect?: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-2xl p-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    );
  }

  if (waitingForLocation) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[15px] text-on-surface-variant">Finding your location…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-[15px] text-on-surface-variant">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-primary px-5 py-2.5 text-[15px] font-semibold text-white active:scale-[0.98]"
        >
          Try again
        </button>
      </div>
    );
  }

  if (matches.length > 0) {
    return (
      <div className="ios-inset-group">
        <ul className="divide-y divide-[var(--map-divider)]">
          {matches.map((profile) => {
            const key = profileKey(profile);
            return (
              <li key={key}>
                <MatchMapCard
                  profile={profile}
                  isActive={focusProfileId === key}
                  onClick={() => {
                    onProfileFocus(key);
                    onSelect?.();
                  }}
                />
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-2 py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high">
        <span className="material-symbols-outlined text-3xl text-primary/50">group</span>
      </div>
      <h3 className="mb-1.5 text-[17px] font-semibold text-on-surface">No friends on the map yet</h3>
      <p className="mb-5 max-w-[240px] text-[15px] leading-snug text-on-surface-variant">
        Match with someone to see them here.
      </p>
      <Link
        href="/match"
        className="rounded-full bg-primary px-6 py-2.5 text-[15px] font-semibold text-white active:scale-[0.98]"
      >
        Go to Discover
      </Link>
    </div>
  );
}

export default function MatchFriendsSidebar({
  matches,
  loading,
  waitingForLocation,
  error,
  focusProfileId,
  onProfileFocus,
  onRetry,
  layout = "sidebar",
  open = true,
  onOpenChange,
}: MatchFriendsSidebarProps) {
  const [sheetSnap, setSheetSnap] = useState<MatchBrowseSheetSnap>("map");

  if (layout === "sheet") {
    return (
      <MatchBrowseMobileSheet
        snap={sheetSnap}
        onSnapChange={setSheetSnap}
        matchCount={matches.length}
        hidden={loading && matches.length === 0}
      >
        <FriendsListBody
          matches={matches}
          loading={loading}
          waitingForLocation={waitingForLocation}
          error={error}
          focusProfileId={focusProfileId}
          onProfileFocus={onProfileFocus}
          onRetry={onRetry}
          onSelect={() => setSheetSnap("map")}
        />
      </MatchBrowseMobileSheet>
    );
  }

  if (!open && layout === "sidebar") {
    return null;
  }

  return (
    <aside className="map-friends-sidebar hidden h-full shrink-0 flex-col border-r border-outline-variant/20 bg-surface md:flex">
      <div className="shrink-0 px-4 pb-3 pt-4 lg:px-5 lg:pt-5">
        <h1 className="text-[20px] font-bold tracking-tight text-on-surface lg:text-[22px]">
          Friends
        </h1>
        <p className="mt-0.5 text-[12px] text-on-surface-variant lg:text-[13px]">
          <FriendsSubtitle
            loading={loading}
            waitingForLocation={waitingForLocation}
            matchCount={matches.length}
          />
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 lg:px-4">
        <FriendsListBody
          matches={matches}
          loading={loading}
          waitingForLocation={waitingForLocation}
          error={error}
          focusProfileId={focusProfileId}
          onProfileFocus={onProfileFocus}
          onRetry={onRetry}
        />
      </div>
    </aside>
  );
}
