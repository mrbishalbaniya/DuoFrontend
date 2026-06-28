"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { resolveProfilePhotoUrl } from "@/lib/mediaUrl";
import type { Match, Profile } from "@/types";

interface MatchInsightsPanelProps {
  matchId: number;
  myProfile?: Profile | null;
  otherProfile?: Profile | null;
  onClose: () => void;
}

function ProfileBubble({ profile, label }: { profile?: Profile | null; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-surface bg-surface-container shadow-lg">
        {profile ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveProfilePhotoUrl(profile)} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant">person</span>
          </div>
        )}
      </div>
      <p className="max-w-[7rem] truncate text-xs font-semibold text-on-surface">{label}</p>
    </div>
  );
}

export function MatchInsightsPanel({
  matchId,
  myProfile,
  otherProfile,
  onClose,
}: MatchInsightsPanelProps) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void api
      .getMatchInsights(matchId)
      .then((data) => {
        if (!cancelled) setMatch(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load match insights.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const score = match?.compatibility_score ?? 0;
  const myName = myProfile?.full_name || "You";
  const otherName = otherProfile?.full_name || match?.other_user_profile?.full_name || "Match";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="ios-sticky-header shrink-0 !top-0 px-1 md:hidden">
        <div className="ios-nav-bar">
          <div className="min-w-0 flex-1">
            <h3 className="font-[var(--font-headline)] text-[17px] font-semibold text-on-surface">
              Match insights
            </h3>
            <p className="truncate text-[13px] text-on-surface-variant">
              {myName} & {otherName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ios-nav-btn shrink-0"
            aria-label="Back to messages"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>
      </header>

      <header className="hidden shrink-0 items-center justify-between gap-3 border-b border-outline-variant bg-surface/60 px-6 py-3 backdrop-blur-xl md:flex">
        <div className="min-w-0">
          <h3 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">
            Match insights
          </h3>
          <p className="truncate text-sm text-on-surface-variant">
            {myName} & {otherName}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
          aria-label="Back to messages"
        >
          <span className="material-symbols-outlined text-[22px]">close</span>
        </button>
      </header>

      <div
        data-lenis-prevent
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 sm:px-6"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined mb-3 animate-spin text-3xl text-primary">progress_activity</span>
            Loading compatibility…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-on-surface-variant">{error}</p>
            <button type="button" onClick={onClose} className="ios-text-btn mt-4">
              Back to messages
            </button>
          </div>
        ) : match ? (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 pb-6">
            <section className="premium-card rounded-[1.5rem] p-5 sm:p-6">
              <p className="premium-section-label mb-4">Compatibility overview</p>
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                <div className="relative flex h-40 w-40 items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 256 256">
                    <circle
                      cx="128"
                      cy="128"
                      r="110"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-surface-container-high"
                    />
                    <circle
                      cx="128"
                      cy="128"
                      r="110"
                      fill="transparent"
                      stroke="url(#chatInsightsGradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray="691"
                      strokeDashoffset={691 - (691 * score) / 100}
                    />
                    <defs>
                      <linearGradient id="chatInsightsGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" stopColor="var(--color-primary)" />
                        <stop offset="100%" stopColor="var(--color-accent)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-[var(--font-headline)] text-4xl font-black text-on-surface">
                      {score}%
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
                      Match score
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col items-center gap-4 sm:items-start">
                  <div className="flex items-center gap-4">
                    <ProfileBubble profile={myProfile} label={myName} />
                    <span className="material-symbols-outlined text-primary">favorite</span>
                    <ProfileBubble profile={otherProfile ?? match.other_user_profile} label={otherName} />
                  </div>
                  <p className="text-center text-sm leading-relaxed text-on-surface-variant sm:text-left">
                    {match.insight_summary ||
                      "Your shared values and lifestyle choices suggest strong compatibility between you two."}
                  </p>
                </div>
              </div>
            </section>

            <section className="premium-card rounded-[1.5rem] p-5 sm:p-6">
              <p className="premium-section-label mb-2">Analysis</p>
              <h4 className="mb-5 font-[var(--font-headline)] text-base font-bold text-on-surface">
                Compatibility pillars
              </h4>
              <div className="space-y-5">
                {[
                  { label: "Core values", value: match.values_score ?? 0 },
                  { label: "Lifestyle & habit", value: match.lifestyle_score ?? 0 },
                  { label: "Career ambition", value: match.career_score ?? 0 },
                  { label: "Hobbies & leisure", value: match.hobbies_score ?? 0 },
                ].map((pillar) => (
                  <div key={pillar.label}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-semibold text-on-surface">{pillar.label}</span>
                      <span className="font-bold text-primary">{pillar.value}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="gradient-brand h-full rounded-full transition-all duration-700"
                        style={{ width: `${pillar.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {(match.spark_factors?.length ?? 0) > 0 ? (
              <section className="premium-card-featured rounded-[1.5rem] p-5 text-on-primary-container sm:p-6">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <h4 className="font-bold">Spark factors</h4>
                </div>
                <ul className="space-y-3">
                  {match.spark_factors!.map((factor) => (
                    <li key={factor} className="flex items-start gap-2 text-sm">
                      <span className="material-symbols-outlined mt-0.5 text-sm">check_circle</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {(match.shared_interests?.length ?? 0) > 0 ? (
              <section className="premium-card rounded-[1.5rem] p-5 sm:p-6">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Shared interests
                </h4>
                <div className="flex flex-wrap gap-2">
                  {match.shared_interests!.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-sm bg-surface-variant px-3 py-1 text-xs font-medium text-on-surface"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {(match.vision_insight || match.communication_insight) && (
              <section className="premium-card rounded-[1.5rem] p-5 sm:p-6">
                <h4 className="mb-4 font-[var(--font-headline)] text-base font-bold text-on-surface">
                  Deep dive
                </h4>
                <div className="grid gap-5 sm:grid-cols-2">
                  {match.vision_insight ? (
                    <div>
                      <p className="mb-2 text-sm font-bold text-primary">Vision for the future</p>
                      <p className="text-sm leading-relaxed text-on-surface-variant">
                        {match.vision_insight}
                      </p>
                    </div>
                  ) : null}
                  {match.communication_insight ? (
                    <div>
                      <p className="mb-2 text-sm font-bold text-accent">Communication style</p>
                      <p className="text-sm leading-relaxed text-on-surface-variant">
                        {match.communication_insight}
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
