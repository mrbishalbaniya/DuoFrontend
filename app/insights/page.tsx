"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { Match } from "@/types";

export default function InsightsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) loadMatches();
  }, [user, authLoading, router]);

  const loadMatches = async () => {
    try {
      const data = await api.getMatches();
      setMatches(data);
      if (data.length > 0) setSelectedMatch(data[0]);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </main>
      </>
    );
  }

  if (matches.length === 0) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-32 px-6 min-h-screen flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-primary/20 mb-6">analytics</span>
          <h2 className="text-2xl font-[var(--font-headline)] font-bold text-on-surface mb-2">No match insights yet</h2>
          <p className="text-on-surface-variant mb-8 text-center max-w-xs">Start swiping to find matches and see compatibility insights!</p>
          <Link href="/dashboard" className="px-8 py-3 gradient-brand text-white rounded-full font-bold shadow-lg active:scale-95 transition-all">
            Find Matches
          </Link>
        </main>
        <BottomNav />
      </>
    );
  }

  const m = selectedMatch;
  const other = m?.other_user_profile;
  const myProfile = user?.profile;

  return (
    <>
      <Navbar />
      <main className="pt-24 px-6 max-w-4xl mx-auto pb-32">
        {/* Match selector (if multiple) */}
        {matches.length > 1 && (
          <div className="mb-8 flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {matches.map((match) => (
              <button
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${selectedMatch?.id === match.id ? "bg-primary text-white shadow-lg" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"}`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-surface-container">
                  {match.other_user_profile?.photo_url ? (
                    <img className="w-full h-full object-cover" alt="" src={match.other_user_profile.photo_url} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-xs">person</span>
                    </div>
                  )}
                </div>
                {match.other_user_profile?.full_name}
              </button>
            ))}
          </div>
        )}

        {m && (
          <>
            {/* Hero */}
            <section className="relative mb-12 premium-card rounded-[2rem] p-8 md:p-10">
              <p className="premium-section-label mb-3">Compatibility Overview</p>
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-surface-container-high" cx="128" cy="128" fill="transparent" r="110" stroke="currentColor" strokeWidth="12"></circle>
                    <circle cx="128" cy="128" fill="transparent" r="110" stroke="url(#gradient)" strokeDasharray="691" strokeDashoffset={691 - (691 * (m.compatibility_score ?? 0) / 100)} strokeLinecap="round" strokeWidth="12"></circle>
                    <defs><linearGradient id="gradient" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stopColor="var(--color-primary)"></stop><stop offset="100%" stopColor="var(--color-accent)"></stop></linearGradient></defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black font-[var(--font-headline)] tracking-tight text-on-surface">{m.compatibility_score ?? 0}%</span>
                    <span className="text-on-surface-variant font-medium tracking-wide uppercase text-[10px]">Compatibility</span>
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-4">
                      <div className="w-16 h-16 rounded-full border-4 border-surface overflow-hidden shadow-lg bg-surface-container">
                        {myProfile?.photo_url ? <img className="w-full h-full object-cover" alt="" src={myProfile.photo_url} /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined">person</span></div>}
                      </div>
                      <div className="w-16 h-16 rounded-full border-4 border-surface overflow-hidden shadow-lg bg-surface-container">
                        {other?.photo_url ? <img className="w-full h-full object-cover" alt="" src={other.photo_url} /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined">person</span></div>}
                      </div>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold font-[var(--font-headline)] leading-tight">Match Insights</h1>
                      <p className="text-on-surface-variant">{myProfile?.full_name} &amp; {other?.full_name}</p>
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-lg leading-relaxed">
                    Your shared values and lifestyle choices suggest a highly harmonious partnership with strong long-term potential.
                  </p>
                </div>
              </div>
            </section>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 p-8 rounded-[2rem] premium-card">
                <p className="premium-section-label mb-2">Analysis</p>
                <h3 className="text-lg font-bold font-[var(--font-headline)] mb-8">Compatibility Pillars</h3>
                <div className="space-y-8">
                  {[
                    { label: "Core Values", value: m.values_score },
                    { label: "Lifestyle & Habit", value: m.lifestyle_score },
                    { label: "Career Ambition", value: m.career_score },
                    { label: "Hobbies & Leisure", value: m.hobbies_score },
                  ].map((pillar) => (
                    <div key={pillar.label}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold">{pillar.label}</span>
                        <span className="text-sm font-bold text-primary">{pillar.value}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full gradient-brand rounded-full transition-all duration-1000" style={{ width: `${pillar.value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-5 flex flex-col gap-6">
                <div className="p-6 rounded-[2rem] premium-card-featured text-on-primary-container">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <h3 className="font-bold">Spark Factors</h3>
                  </div>
                  <ul className="space-y-4">
                    {(m.spark_factors || []).map((factor, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-sm mt-1">check_circle</span>
                        <span className="text-sm">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 rounded-[2rem] premium-card">
                  <h3 className="text-sm font-bold mb-4 uppercase tracking-widest text-on-surface-variant">Shared Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {(m.shared_interests || []).map((interest) => (
                      <span key={interest} className="px-3 py-1 bg-surface-variant text-on-surface rounded-sm text-xs font-medium">{interest}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-12 p-8 rounded-[2rem] premium-card overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <span className="material-symbols-outlined text-8xl">handshake</span>
                </div>
                <h3 className="text-xl font-bold font-[var(--font-headline)] mb-6">Deep Dive Compatibility</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <h4 className="font-bold text-primary mb-3">Vision for the Future</h4>
                    <p className="text-on-surface-variant text-sm leading-relaxed">{m.vision_insight || "Both express a desire for an urban lifestyle while maintaining strong ties to cultural roots."}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-accent mb-3">Communication Style</h4>
                    <p className="text-on-surface-variant text-sm leading-relaxed">{m.communication_insight || "A balanced pairing that often results in highly effective communication."}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 p-8 rounded-[2rem] premium-card flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold font-[var(--font-headline)]">Ready to take the next step?</h3>
                <p className="text-on-surface-variant text-sm">Send a personalized message to {other?.full_name}.</p>
              </div>
              <Link href="/chat" className="btn-premium px-8 py-4">
                Start Chatting
              </Link>
            </div>
          </>
        )}
      </main>
      <BottomNav />
    </>
  );
}
