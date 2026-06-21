"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import { DiscoverMatchesSkeleton } from "@/components/skeletons/DiscoverMatchesSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { Match, Profile } from "@/types";

function matchPhotoUrl(profile: Profile): string {
  const id = String(profile.user_id ?? profile.id ?? profile.full_name);
  return (
    profile.photo_url ||
    (Array.isArray(profile.photo_urls) && profile.photo_urls[0]) ||
    `https://picsum.photos/seed/${id}/400/500`
  );
}

function MatchedProfileCard({ match }: { match: Match }) {
  const profile = match.other_user_profile;
  if (!profile) return null;

  return (
    <article className="rounded-2xl border border-primary/10 bg-background p-4 shadow-[0_4px_20px] shadow-primary/6 transition-colors hover:border-primary/20">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-primary/15 bg-surface-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={matchPhotoUrl(profile)}
            alt={profile.full_name || "Match"}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-[var(--font-headline)] text-lg font-bold text-on-surface">
            {profile.full_name || "Duo member"}
            {profile.age != null ? (
              <span className="font-semibold text-primary">, {profile.age}</span>
            ) : null}
          </h2>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-base text-primary">location_on</span>
            {profile.location || "Location not set"}
          </p>
          {match.compatibility_score != null ? (
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-accent">
              {match.compatibility_score}% compatible
            </p>
          ) : null}
        </div>
      </div>

      {profile.bio ? (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-on-surface-variant">
          {profile.bio}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/chat"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 gradient-brand active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
          Message
        </Link>
        <Link
          href="/insights"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-secondary px-4 py-2 text-sm font-semibold text-primary active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">insights</span>
          Insights
        </Link>
      </div>
    </article>
  );
}

export function DiscoverMatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getMatches();
      setMatches(data);
    } catch {
      setError("Could not load your matches.");
      setMatches([]);
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
      void loadMatches();
    }
  }, [user, authLoading, router, loadMatches]);

  if (authLoading || loading) {
    return <DiscoverMatchesSkeleton />;
  }

  return (
    <>
      <Navbar />
      <main className="mobile-bottom-nav-offset min-h-screen bg-surface pb-28 pt-20">
        <div className="mx-auto max-w-2xl px-5 sm:px-6">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Discover</p>
            <h1 className="mt-1 font-[var(--font-headline)] text-3xl font-extrabold text-on-surface">
              Your matches
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Profiles you have mutually matched with.
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-error/20 bg-error-container/30 p-6 text-center">
              <p className="text-sm font-medium text-on-error-container">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  void loadMatches();
                }}
                className="mt-4 rounded-full px-6 py-2.5 text-sm font-bold text-white gradient-brand"
              >
                Try again
              </button>
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-[2rem] border border-primary/10 bg-background p-10 text-center shadow-[0_8px_30px] shadow-primary/8">
              <span className="material-symbols-outlined text-6xl text-primary/25">favorite</span>
              <h2 className="mt-4 font-[var(--font-headline)] text-2xl font-bold text-on-surface">
                No matches yet
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-on-surface-variant">
                Swipe right on profiles you like. When they like you back, they will appear here.
              </p>
              <Link
                href="/match"
                className="mt-6 inline-flex rounded-full px-8 py-3 font-bold text-white shadow-lg shadow-primary/20 gradient-brand active:scale-95"
              >
                Start matching
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <MatchedProfileCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
