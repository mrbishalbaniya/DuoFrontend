"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import type { MatchSessionData } from "@/types";

export default function MatchPage() {
  const { user } = useAuth();
  const router = useRouter();
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
    <div className="bg-surface font-[var(--font-body)] text-on-surface overflow-hidden">
      {/* Blurred Background */}
      <main className="fixed inset-0 z-0 flex flex-col blur-lg opacity-40 scale-105 pointer-events-none">
        <header className="flex justify-between items-center px-6 h-16 w-full bg-surface/60">
          <span className="text-2xl font-black gradient-brand bg-clip-text text-transparent">Duo</span>
        </header>
        <div className="flex-1 p-6 space-y-8">
          <div className="h-64 w-full bg-surface-variant rounded-[2rem]"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 bg-surface-variant rounded-[2rem]"></div>
            <div className="h-48 bg-surface-variant rounded-[2rem]"></div>
          </div>
        </div>
      </main>

      {/* Match Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-on-surface/20 backdrop-blur-sm">
        <div className="relative w-full max-w-lg glass-panel rounded-[2rem] shadow-[0_40px_80px_-15px_rgba(33,79,199,0.2)] overflow-hidden flex flex-col items-center py-12 px-8 text-center border border-white/20">
          <h1 className="font-[var(--font-headline)] font-extrabold text-4xl md:text-5xl tracking-tight text-on-surface mb-2">
            It&apos;s a Match!
          </h1>
          <p className="font-[var(--font-body)] text-on-surface-variant text-lg mb-12 max-w-[280px]">
            You and {otherProfile?.full_name || "someone special"} have expressed interest in each other.
          </p>

          <div className="relative flex items-center justify-center mb-16 h-48 w-full">
            <div className="relative z-10 -mr-6 transform -rotate-3 transition-transform hover:rotate-0 duration-500">
              <div className="p-1.5 bg-white rounded-full shadow-xl">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-inner bg-surface-container">
                  {myProfile?.photo_url ? (
                    <img alt="You" className="w-full h-full object-cover" src={myProfile.photo_url} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-primary/40">person</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute z-30 flex items-center justify-center w-16 h-16 gradient-brand-br rounded-full shadow-[0_10px_30px_rgba(33,79,199,0.3)] border-4 border-white transform scale-110">
              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </div>
            <div className="relative z-20 -ml-6 transform rotate-3 transition-transform hover:rotate-0 duration-500">
              <div className="p-1.5 bg-white rounded-full shadow-xl">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-inner bg-surface-container">
                  {otherProfile?.photo_url ? (
                    <img alt={otherProfile?.full_name} className="w-full h-full object-cover" src={otherProfile.photo_url} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-love-container/20 to-love/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-love/40">person</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {matchData?.compatibility_score && (
            <p className="text-primary font-bold text-lg mb-6">
              {matchData.compatibility_score}% Compatible
            </p>
          )}

          <div className="w-full space-y-4 max-w-sm">
            <Link href="/chat" className="w-full h-14 gradient-brand text-white rounded-full font-[var(--font-headline)] font-bold text-lg shadow-[0_15px_30px_-5px_rgba(33,79,199,0.4)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
              Start Chatting
            </Link>
            <Link href="/dashboard" className="w-full h-14 bg-transparent text-primary rounded-full font-[var(--font-headline)] font-semibold text-lg hover:bg-primary/5 active:scale-95 transition-all duration-200 border border-outline-variant/30 flex items-center justify-center">
              Keep Swiping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
