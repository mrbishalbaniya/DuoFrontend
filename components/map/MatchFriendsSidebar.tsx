"use client";



import Link from "next/link";

import { useState } from "react";

import MatchMapCard from "@/components/map/MatchMapCard";

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

      <div className="flex items-center justify-center py-12">

        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />

      </div>

    );

  }



  if (waitingForLocation) {

    return (

      <div className="flex items-center justify-center py-12">

        <p className="text-sm text-on-surface-variant">Finding your location…</p>

      </div>

    );

  }



  if (error) {

    return (

      <div className="space-y-4 py-8 text-center">

        <p className="text-sm text-on-surface-variant">{error}</p>

        <button

          type="button"

          onClick={onRetry}

          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"

        >

          Try again

        </button>

      </div>

    );

  }



  if (matches.length > 0) {

    return (

      <ul className="flex flex-col gap-2.5 sm:gap-3">

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

    );

  }



  return (

    <div className="flex flex-col items-center px-1 py-8 text-center sm:px-2 sm:py-10">

      <span className="material-symbols-outlined mb-3 text-4xl text-primary/40 sm:text-5xl">

        group

      </span>

      <h3 className="mb-2 text-sm font-bold text-on-surface sm:text-base">

        No friends on the map yet

      </h3>

      <p className="mb-4 text-xs text-on-surface-variant sm:text-sm">

        Match with someone to see them here.

      </p>

      <Link

        href="/dashboard"

        className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white sm:text-sm"

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

}: MatchFriendsSidebarProps) {

  const [sheetOpen, setSheetOpen] = useState(false);



  if (layout === "sheet") {

    return (

      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[25] flex justify-center px-3 md:hidden">

        <div

          className={`pointer-events-auto flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface/95 shadow-xl backdrop-blur-md transition-[max-height] duration-300 ease-out ${

            sheetOpen ? "max-h-[min(52vh,420px)]" : "max-h-12"

          }`}

        >

          <button

            type="button"

            onClick={() => setSheetOpen((open) => !open)}

            aria-expanded={sheetOpen}

            aria-controls="map-friends-sheet"

            className="flex h-12 shrink-0 items-center gap-2 px-4"

          >

            <span className="material-symbols-outlined text-xl text-primary">group</span>

            <div className="min-w-0 flex-1 text-left">

              <p className="truncate text-sm font-bold text-on-surface">Friends</p>

              <p className="truncate text-xs text-on-surface-variant">

                <FriendsSubtitle

                  loading={loading}

                  waitingForLocation={waitingForLocation}

                  matchCount={matches.length}

                />

              </p>

            </div>

            <span

              className={`material-symbols-outlined text-2xl text-on-surface-variant transition-transform duration-300 ${

                sheetOpen ? "rotate-180" : ""

              }`}

            >

              expand_less

            </span>

          </button>



          <div

            id="map-friends-sheet"

            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-outline-variant/30 px-3 py-3 ${

              sheetOpen ? "opacity-100" : "pointer-events-none opacity-0"

            }`}

          >

            <FriendsListBody

              matches={matches}

              loading={loading}

              waitingForLocation={waitingForLocation}

              error={error}

              focusProfileId={focusProfileId}

              onProfileFocus={onProfileFocus}

              onRetry={onRetry}

              onSelect={() => setSheetOpen(false)}

            />

          </div>

        </div>

      </div>

    );

  }



  return (

    <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-outline-variant/50 bg-surface md:flex md:w-80">

      <div className="shrink-0 border-b border-outline-variant/40 px-5 py-4">

        <h1 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">

          Friends

        </h1>

        <p className="mt-1 text-xs text-on-surface-variant">

          <FriendsSubtitle

            loading={loading}

            waitingForLocation={waitingForLocation}

            matchCount={matches.length}

          />

        </p>

      </div>



      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">

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


