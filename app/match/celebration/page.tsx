"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { resolveProfilePhotoUrl } from "@/lib/mediaUrl";
import type { MatchSessionData } from "@/types";

export default function MatchCelebrationPage() {
  const { user } = useAuth();
  const [matchData, setMatchData] = useState<MatchSessionData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("latest_match");
    if (stored) {
      setMatchData(JSON.parse(stored));
    }
  }, []);

  const otherProfile = matchData?.other_user_profile;
  const myProfile = user?.profile;

  return (
    <div className="overflow-hidden bg-surface font-[var(--font-body)] text-on-surface">
      <main className="pointer-events-none fixed inset-0 z-0 flex scale-105 flex-col opacity-40 blur-lg">
        <header className="flex h-16 w-full items-center justify-between bg-surface/60 px-6">
          <span className="text-2xl font-black text-transparent gradient-brand bg-clip-text">Duo</span>
        </header>
        <div className="flex-1 space-y-8 p-6">
          <div className="h-64 w-full rounded-[2rem] bg-surface-variant" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 rounded-[2rem] bg-surface-variant" />
            <div className="h-48 rounded-[2rem] bg-surface-variant" />
          </div>
        </div>
      </main>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/20 p-6 backdrop-blur-sm">
        <div className="glass-panel relative flex w-full max-w-lg flex-col items-center overflow-hidden rounded-[2rem] border border-primary/15 px-8 py-12 text-center shadow-[0_40px_80px_-15px] shadow-primary/25">
          <h1 className="mb-2 font-[var(--font-headline)] text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
            It&apos;s a Match!
          </h1>
          <p className="mb-12 max-w-[280px] font-[var(--font-body)] text-lg text-on-surface-variant">
            You and {otherProfile?.full_name || "someone special"} have expressed interest in each other.
          </p>

          <div className="relative mb-16 flex h-48 w-full items-center justify-center">
            <div className="relative z-10 -mr-6 -rotate-3 transform transition-transform duration-500 hover:rotate-0">
              <div className="rounded-full bg-surface-bright p-1.5 shadow-xl">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-surface-bright bg-surface-container shadow-inner md:h-40 md:w-40">
                  {myProfile ? (
                    <img alt="You" className="h-full w-full object-cover" src={resolveProfilePhotoUrl(myProfile)} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                      <span className="material-symbols-outlined text-4xl text-primary/40">person</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute z-30 flex h-16 w-16 scale-110 transform items-center justify-center rounded-full border-4 border-surface-bright shadow-[0_10px_30px] shadow-primary/30 gradient-brand-br">
              <span
                className="material-symbols-outlined text-3xl text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
            </div>
            <div className="relative z-20 -ml-6 rotate-3 transform transition-transform duration-500 hover:rotate-0">
              <div className="rounded-full bg-surface-bright p-1.5 shadow-xl">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-surface-bright bg-surface-container shadow-inner md:h-40 md:w-40">
                  {otherProfile ? (
                    <img
                      alt={otherProfile?.full_name}
                      className="h-full w-full object-cover"
                      src={resolveProfilePhotoUrl(otherProfile)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-love-container/20 to-love/20">
                      <span className="material-symbols-outlined text-4xl text-love/40">person</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {matchData?.compatibility_score ? (
            <p className="mb-6 text-lg font-bold text-primary">
              {matchData.compatibility_score}% Compatible
            </p>
          ) : null}

          <div className="w-full max-w-sm space-y-4">
            <Link
              href="/chat"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full text-lg font-bold text-white shadow-[0_15px_30px_-5px] shadow-primary/35 transition-all duration-200 gradient-brand active:scale-95 font-[var(--font-headline)]"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                chat_bubble
              </span>
              Start Chatting
            </Link>
            <Link
              href="/match"
              className="flex h-14 w-full items-center justify-center rounded-full border border-outline-variant/30 bg-transparent text-lg font-semibold text-primary transition-all duration-200 hover:bg-primary/5 active:scale-95 font-[var(--font-headline)]"
            >
              Keep Swiping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
