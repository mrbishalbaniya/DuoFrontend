"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { resolveProfilePhotoUrl } from "@/lib/mediaUrl";
import type { Match, Profile } from "@/types";

interface MatchInsightsPanelProps {
  matchId: number;
  myProfile?: Profile | null;
  otherProfile?: Profile | null;
  onClose: () => void;
  /** Put a suggested opener into the message box. */
  onUseStarter?: (text: string) => void;
  /** Narrow side-panel layout: no back button, single-column sections. */
  compact?: boolean;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function verdictFor(score: number) {
  if (score >= 90) return { label: "Exceptional match", tone: "text-emerald-400", icon: "workspace_premium" };
  if (score >= 80) return { label: "Great match", tone: "text-emerald-400", icon: "favorite" };
  if (score >= 65) return { label: "Good match", tone: "text-sky-400", icon: "thumb_up" };
  if (score >= 50) return { label: "Promising match", tone: "text-amber-400", icon: "trending_up" };
  return { label: "Opposites attract", tone: "text-rose-400", icon: "bolt" };
}

function levelFor(value: number) {
  if (value >= 90) return "Excellent";
  if (value >= 75) return "Strong";
  if (value >= 60) return "Good";
  if (value >= 40) return "Moderate";
  return "Different";
}

function matchedAgo(iso?: string) {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  const date = then.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  if (days <= 0) return `Matched today`;
  if (days === 1) return `Matched yesterday`;
  if (days < 30) return `Matched ${days} days ago · ${date}`;
  return `Matched on ${date}`;
}

const INTEREST_ICONS: [RegExp, string][] = [
  [/travel|trip|explor/i, "flight"],
  [/hik|trek|mountain|outdoor/i, "hiking"],
  [/photo|camera/i, "photo_camera"],
  [/danc/i, "nightlife"],
  [/music|sing|guitar|song/i, "music_note"],
  [/read|book|writ/i, "menu_book"],
  [/cook|food|bak/i, "restaurant"],
  [/movie|film|cinema/i, "movie"],
  [/gym|fitness|workout|sport|run/i, "fitness_center"],
  [/art|paint|draw/i, "palette"],
  [/game|gaming/i, "sports_esports"],
  [/yoga|medita/i, "self_improvement"],
  [/philanthrop|volunteer|charity/i, "volunteer_activism"],
  [/tech|coding|program/i, "code"],
  [/coffee/i, "local_cafe"],
  [/pet|dog|cat/i, "pets"],
];

function interestIcon(interest: string) {
  return INTEREST_ICONS.find(([re]) => re.test(interest))?.[1] ?? "interests";
}

/** Friendly openers built from what the two people actually share. */
function buildStarters(match: Match, otherFirstName: string): string[] {
  const interests = match.shared_interests ?? [];
  const templates: ((i: string) => string)[] = [
    (i) => `I saw we both love ${i.toLowerCase()}. What got you into it?`,
    (i) => `What's the best ${i.toLowerCase()} memory you have?`,
    (i) => `If we planned a ${i.toLowerCase()} day together, what would it look like?`,
  ];
  const out = interests.slice(0, 3).map((i, idx) => templates[idx % templates.length](i));
  if ((match.values_score ?? 0) >= 80) {
    out.push(`What's one value you'd never compromise on, ${otherFirstName}?`);
  }
  if (out.length < 3) out.push("What does a perfect weekend look like for you?");
  return out.slice(0, 4);
}

/* ------------------------------------------------------------------ */
/* Pieces                                                               */
/* ------------------------------------------------------------------ */

function Avatar({ profile, name, className = "" }: { profile?: Profile | null; name: string; className?: string }) {
  const src = profile ? resolveProfilePhotoUrl(profile) : "";
  return (
    <div className={`h-16 w-16 overflow-hidden rounded-full bg-surface-container ring-4 ring-background ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-500 to-fuchsia-600 text-xl font-bold text-white">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(score), 60);
    return () => window.clearTimeout(t);
  }, [score]);
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="10" className="stroke-on-surface/10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          stroke="url(#insightRing)"
          strokeDasharray={c}
          strokeDashoffset={c - (c * shown) / 100}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.2,0.8,0.2,1)" }}
        />
        <defs>
          <linearGradient id="insightRing" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tabular-nums text-on-surface">{score}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">match</span>
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-outline-variant/40 bg-secondary/60 p-5 sm:p-6 ${className}`}>
      {children}
    </section>
  );
}

function CardTitle({ icon, children }: { icon?: string; children: React.ReactNode }) {
  return (
    <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-on-surface-variant">
      {icon ? <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span> : null}
      {children}
    </h4>
  );
}

const LOADING_STEPS = [
  { icon: "person_search", text: "Reading both profiles" },
  { icon: "diversity_1", text: "Comparing values and goals" },
  { icon: "self_improvement", text: "Matching lifestyles" },
  { icon: "interests", text: "Finding shared interests" },
  { icon: "chat_bubble", text: "Writing conversation starters" },
];

/** Centered "analysing" animation: two avatars drawn together around a beating heart. */
function AnalysingLoader({
  myProfile,
  myName,
  other,
  otherName,
}: {
  myProfile?: Profile | null;
  myName: string;
  other?: Profile | null;
  otherName: string;
}) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 1800);
    return () => window.clearInterval(t);
  }, []);
  const current = LOADING_STEPS[step];
  const progress = ((step + 1) / LOADING_STEPS.length) * 100;

  return (
    <div
      className="flex min-h-full flex-col items-center justify-center gap-8 py-10 text-center"
      role="status"
      aria-live="polite"
      aria-label="Analysing both profiles"
    >
      <style>{`
        @keyframes insightOrbit { to { transform: rotate(360deg); } }
        @keyframes insightOrbitRev { to { transform: rotate(-360deg); } }
        @keyframes insightBeat { 0%,100% { transform: scale(1); } 15% { transform: scale(1.18); } 30% { transform: scale(1); } 45% { transform: scale(1.12); } }
        @keyframes insightLeft { 0%,100% { transform: translateX(-10px); } 50% { transform: translateX(6px); } }
        @keyframes insightRight { 0%,100% { transform: translateX(10px); } 50% { transform: translateX(-6px); } }
        @keyframes insightGlow { 0%,100% { opacity: .35; transform: scale(.9); } 50% { opacity: .7; transform: scale(1.08); } }
        @keyframes insightStepIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes insightDot { 0%,100% { opacity: .2; } 50% { opacity: 1; } }
      `}</style>

      <div className="relative flex h-56 w-72 items-center justify-center">
        {/* soft glow */}
        <div
          className="absolute h-44 w-44 rounded-full bg-primary/30 blur-3xl"
          style={{ animation: "insightGlow 2.6s ease-in-out infinite" }}
        />
        {/* orbit rings */}
        <div
          className="absolute h-48 w-48 rounded-full border border-dashed border-primary/40"
          style={{ animation: "insightOrbit 14s linear infinite" }}
        >
          <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_12px_var(--color-primary)]" />
        </div>
        <div
          className="absolute h-32 w-32 rounded-full border border-amber-400/40"
          style={{ animation: "insightOrbitRev 9s linear infinite" }}
        >
          <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
        </div>

        {/* avatars drifting together */}
        <div className="absolute left-2" style={{ animation: "insightLeft 2.6s ease-in-out infinite" }}>
          <Avatar profile={myProfile} name={myName} className="!h-20 !w-20 shadow-2xl" />
        </div>
        <div className="absolute right-2" style={{ animation: "insightRight 2.6s ease-in-out infinite" }}>
          <Avatar profile={other} name={otherName} className="!h-20 !w-20 shadow-2xl" />
        </div>

        {/* heart */}
        <span
          className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-amber-500 text-white shadow-[0_8px_30px_-6px_var(--color-primary)] ring-4 ring-background"
          style={{ animation: "insightBeat 1.4s ease-in-out infinite" }}
        >
          <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            favorite
          </span>
        </span>
      </div>

      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        <p className="text-lg font-bold text-on-surface">Analysing both profiles</p>
        <p
          key={step}
          className="flex items-center gap-2 text-sm font-medium text-primary"
          style={{ animation: "insightStepIn 300ms ease-out" }}
        >
          <span className="material-symbols-outlined text-[18px]">{current.icon}</span>
          {current.text}
          <span className="inline-flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1 w-1 rounded-full bg-primary"
                style={{ animation: `insightDot 1.2s ${i * 0.2}s ease-in-out infinite` }}
              />
            ))}
          </span>
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-on-surface/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-amber-500 transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-on-surface-variant">The first time can take a few seconds.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                                */
/* ------------------------------------------------------------------ */

export function MatchInsightsPanel(props: MatchInsightsPanelProps) {
  return <MatchInsightsPanelContent key={props.matchId} {...props} />;
}

function MatchInsightsPanelContent({
  matchId,
  myProfile,
  otherProfile,
  onClose,
  onUseStarter,
  compact = false,
}: MatchInsightsPanelProps) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void api
      .getMatchInsights(matchId, { refresh: refreshing })
      .then((data) => {
        if (!cancelled) setMatch(data);
      })
      .catch(() => {
        if (!cancelled) setError("We couldn't load your match insights right now.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, attempt]);

  const regenerate = useCallback(() => {
    setRefreshing(true);
    setLoading(true);
    setAttempt((a) => a + 1);
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const score = match?.compatibility_score ?? 0;
  const myName = myProfile?.full_name || "You";
  const other = otherProfile ?? match?.other_user_profile ?? null;
  const otherName = other?.full_name || "Your match";
  const otherFirst = otherName.split(" ")[0];
  const verdict = verdictFor(score);
  const starters = useMemo(() => {
    if (!match) return [];
    if (match.conversation_starters?.length) return match.conversation_starters.slice(0, 4);
    return buildStarters(match, otherFirst);
  }, [match, otherFirst]);
  const notes = match?.pillar_notes ?? null;

  const pillars = match
    ? [
        { key: "values", label: "Core values", icon: "diversity_1", value: match.values_score ?? 0, hint: "Beliefs, family and priorities" },
        { key: "lifestyle", label: "Lifestyle & habits", icon: "self_improvement", value: match.lifestyle_score ?? 0, hint: "Daily routine, diet and pace of life" },
        { key: "career", label: "Career & ambition", icon: "work", value: match.career_score ?? 0, hint: "Goals, drive and work-life balance" },
        { key: "hobbies", label: "Hobbies & leisure", icon: "sports_tennis", value: match.hobbies_score ?? 0, hint: "How you like to spend free time" },
      ]
    : [];
  const strongest = pillars.length ? pillars.reduce((a, b) => (b.value > a.value ? b : a)) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-outline-variant/40 px-4 py-3 sm:px-6">
        {compact ? null : (
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to messages"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-secondary hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold leading-tight text-on-surface">Match insights</h3>
          <p className="truncate text-xs text-on-surface-variant">
            {myName} & {otherName}
          </p>
        </div>
        {match?.ai_generated ? (
          <span
            className="hidden items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary sm:flex"
            title={match.ai_provider === "duo" ? "Scored by Duo's own model, trained on real likes, skips and chats." : "Scores are calculated from both profiles. The written insights are generated by AI."}
          >
            <span className="material-symbols-outlined text-[15px]">psychology</span>
            {match.ai_provider === "duo" ? "Duo AI" : "AI insights"}
          </span>
        ) : null}
        {match ? (
          <button
            type="button"
            onClick={regenerate}
            disabled={loading}
            aria-label="Refresh insights"
            title="Refresh insights"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-secondary hover:text-on-surface disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[20px] ${loading ? "animate-spin" : ""}`}>refresh</span>
          </button>
        ) : null}
        {compact ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close match insights"
            title="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-secondary hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        ) : null}
      </header>

      <div data-lenis-prevent className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain ${compact ? "px-3 py-4" : "px-4 py-5 sm:px-6"}`}>
        {loading ? (
          <AnalysingLoader myProfile={myProfile} myName={myName} other={other} otherName={otherName} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-on-surface-variant">
              <span className="material-symbols-outlined text-[28px]">cloud_off</span>
            </span>
            <p className="text-sm text-on-surface-variant">{error}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={retry}
                className="rounded-full gradient-brand-br px-5 py-2 text-sm font-semibold text-white"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-secondary px-5 py-2 text-sm font-semibold text-on-surface"
              >
                Back to chat
              </button>
            </div>
          </div>
        ) : match ? (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-8">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl border border-outline-variant/40 bg-gradient-to-br from-primary/15 via-secondary/60 to-amber-500/10 p-6">
              <div className={`flex flex-col items-center gap-6 ${compact ? "" : "sm:flex-row"}`}>
                <ScoreRing score={score} />
                <div className={`flex flex-1 flex-col items-center gap-3 text-center ${compact ? "" : "sm:items-start sm:text-left"}`}>
                  <div className="flex items-center">
                    <Avatar profile={myProfile} name={myName} />
                    <span className="z-10 -mx-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-background">
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        favorite
                      </span>
                    </span>
                    <Avatar profile={other} name={otherName} />
                  </div>
                  <p className={`flex items-center gap-1.5 text-xl font-bold ${verdict.tone}`}>
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {verdict.icon}
                    </span>
                    {verdict.label}
                  </p>
                  {matchedAgo(match.matched_at ?? match.created_at) ? (
                    <p className="text-xs text-on-surface-variant">{matchedAgo(match.matched_at ?? match.created_at)}</p>
                  ) : null}
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {match.insight_summary ||
                      (strongest
                        ? `You two line up best on ${strongest.label.toLowerCase()} (${strongest.value}%), with ${
                            match.shared_interests?.length ?? 0
                          } interests in common.`
                        : "Your shared values and lifestyle suggest strong compatibility.")}
                  </p>
                </div>
              </div>
            </section>

            {/* Pillars */}
            <Card>
              <CardTitle icon="insights">Compatibility breakdown</CardTitle>
              <div className={`grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
                {pillars.map((p) => (
                  <div key={p.label} className="rounded-2xl bg-background/60 p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <span className="material-symbols-outlined text-[20px]">{p.icon}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-on-surface">{p.label}</p>
                        <p className="truncate text-[11px] text-on-surface-variant">{p.hint}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold tabular-nums text-on-surface">{p.value}%</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">{levelFor(p.value)}</p>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-on-surface/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-amber-500 transition-[width] duration-700"
                        style={{ width: `${p.value}%` }}
                      />
                    </div>
                    {notes?.[p.key as keyof typeof notes] ? (
                      <p className="mt-3 text-xs leading-relaxed text-on-surface-variant">
                        {notes[p.key as keyof typeof notes]}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>

            {/* Spark factors */}
            {(match.spark_factors?.length ?? 0) > 0 ? (
              <Card>
                <CardTitle icon="local_fire_department">What sparks between you</CardTitle>
                <ul className="space-y-2.5">
                  {match.spark_factors!.map((factor) => (
                    <li key={factor} className="flex items-start gap-3 rounded-2xl bg-background/60 p-3 text-sm text-on-surface">
                      <span
                        className="material-symbols-outlined mt-0.5 text-[18px] text-amber-400"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {/* Shared interests */}
            {(match.shared_interests?.length ?? 0) > 0 ? (
              <Card>
                <CardTitle icon="interests">
                  {match.shared_interests!.length} shared interest{match.shared_interests!.length === 1 ? "" : "s"}
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  {match.shared_interests!.map((interest) => (
                    <span
                      key={interest}
                      className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">{interestIcon(interest)}</span>
                      {interest}
                    </span>
                  ))}
                </div>
              </Card>
            ) : null}

            {/* Deep dive */}
            {match.vision_insight || match.communication_insight ? (
              <Card>
                <CardTitle icon="psychology">Deep dive</CardTitle>
                <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
                  {match.vision_insight ? (
                    <div className="rounded-2xl bg-background/60 p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-primary">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        Vision for the future
                      </p>
                      <p className="text-sm leading-relaxed text-on-surface-variant">{match.vision_insight}</p>
                    </div>
                  ) : null}
                  {match.communication_insight ? (
                    <div className="rounded-2xl bg-background/60 p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-amber-500">
                        <span className="material-symbols-outlined text-[18px]">forum</span>
                        Communication style
                      </p>
                      <p className="text-sm leading-relaxed text-on-surface-variant">{match.communication_insight}</p>
                    </div>
                  ) : null}
                </div>
              </Card>
            ) : null}

            {(match.things_to_talk_about?.length ?? 0) > 0 ? (
              <Card>
                <CardTitle icon="forum">Worth talking about</CardTitle>
                <ul className="space-y-2.5">
                  {match.things_to_talk_about!.map((item) => (
                    <li key={item} className="flex items-start gap-3 rounded-2xl bg-background/60 p-3 text-sm text-on-surface">
                      <span className="material-symbols-outlined mt-0.5 text-[18px] text-sky-400">lightbulb</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {/* Conversation starters */}
            {starters.length ? (
              <Card>
                <CardTitle icon="chat_bubble">Conversation starters</CardTitle>
                <div className="space-y-2">
                  {starters.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onUseStarter?.(s)}
                      disabled={!onUseStarter}
                      className="group flex w-full items-center gap-3 rounded-2xl bg-background/60 p-3 text-left text-sm text-on-surface transition hover:bg-primary/10 disabled:cursor-default"
                    >
                      <span className="flex-1">{s}</span>
                      {onUseStarter ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-primary opacity-70 transition group-hover:opacity-100">
                          Use
                          <span className="material-symbols-outlined text-[16px]">north_east</span>
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </Card>
            ) : null}

            <p className="px-2 text-center text-[11px] leading-relaxed text-on-surface-variant/70">
              {match.ai_provider === "duo" && match.model_info?.samples
                ? `Overall score from Duo's own model, trained on ${match.model_info.samples} real likes, skips and chats. Pillar scores compare both profiles directly.`
                : "Scores come from both profiles: values, lifestyle, career and interests."}
              {match.ai_provider === "claude" ? " The written insights are generated by AI and can be imperfect." : ""} They are
              a guide, not a verdict.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
