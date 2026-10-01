"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { resolveProfilePhotoUrls } from "@/lib/mediaUrl";
import { buildPublicProfile } from "@/lib/profile/publicProfile";
import type { Profile } from "@/types";

/** Messenger-style "contact info" for the chat side panel. */
export function ChatProfileView({
  profile,
  conversationId,
  onOpenImage,
  matchedAt,
  onVoiceCall,
  onVideoCall,
  onOpenInsights,
}: {
  profile: Profile | null;
  /** Public conversation id; enables the "Shared media" section. */
  conversationId?: string | null;
  onOpenImage?: (src: string) => void;
  matchedAt?: string | null;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onOpenInsights?: () => void;
}) {
  useEffect(() => {
    if (!profile?.id) return;
    void api.recordProfileVisit(profile.id).catch(() => undefined);
  }, [profile?.id]);

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-on-surface-variant">
        Profile unavailable.
      </div>
    );
  }

  // Main profile photo on top, plus up to two more uploaded photos below.
  const [avatar, ...morePhotos] = resolveProfilePhotoUrls(profile, 3);
  const details = buildPublicProfile(profile);
  const where =
    typeof profile.distance_km === "number"
      ? profile.distance_km < 1
        ? "Less than 1 km away"
        : `${profile.distance_km} km away`
      : profile.location?.trim() ?? "";
  const matched = matchedAt ? new Date(matchedAt) : null;
  const matchedLabel =
    matched && !Number.isNaN(matched.getTime())
      ? `Matched ${matched.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`
      : null;

  const actions = [
    onVoiceCall && { icon: "call", label: "Audio", onClick: onVoiceCall },
    onVideoCall && { icon: "videocam", label: "Video", onClick: onVideoCall },
    onOpenInsights && { icon: "insights", label: "Insights", onClick: onOpenInsights },
  ].filter(Boolean) as { icon: string; label: string; onClick: () => void }[];

  return (
    <div className="flex flex-col gap-3 pb-6">
      {/* Identity */}
      <div className="flex flex-col items-center px-4 pb-2 pt-6 text-center">
        <button
          type="button"
          onClick={() => avatar && onOpenImage?.(avatar)}
          className="relative h-32 w-32 overflow-hidden rounded-full bg-secondary ring-4 ring-primary/15 transition-transform hover:scale-[1.02]"
          aria-label="View profile photo"
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={profile.full_name} className="h-full w-full object-cover" />
          ) : (
            <span className="material-symbols-outlined flex h-full w-full items-center justify-center text-[56px] text-on-surface-variant/40">
              person
            </span>
          )}
        </button>
        <h2 className="mt-4 flex items-center gap-1.5 text-2xl font-bold text-on-surface">
          {profile.full_name}
          {profile.is_verified ? (
            <span
              className="material-symbols-outlined text-[22px] text-sky-500"
              style={{ fontVariationSettings: "'FILL' 1" }}
              title="Verified profile"
            >
              verified
            </span>
          ) : null}
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {[profile.age != null ? `${profile.age} years` : null, where || null].filter(Boolean).join(" · ")}
        </p>
        {matchedLabel ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-primary">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              favorite
            </span>
            {matchedLabel}
          </p>
        ) : null}

        {actions.length ? (
          <div className="mt-5 grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}>
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={a.onClick}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-outline-variant/40 bg-secondary/60 py-3 text-primary transition-colors hover:bg-primary/10"
              >
                <span className="material-symbols-outlined text-[22px]">{a.icon}</span>
                <span className="text-xs font-semibold text-on-surface">{a.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 px-4">
        {details.bio ? (
          <Section title="About">
            <p className="text-sm leading-relaxed text-on-surface">{details.bio}</p>
          </Section>
        ) : null}

        {morePhotos.length > 0 ? (
          <Section title="Photos">
            <div className="grid grid-cols-2 gap-2">
              {morePhotos.map((url, i) => (
                <button
                  key={`${i}-${url}`}
                  type="button"
                  onClick={() => onOpenImage?.(url)}
                  className="group aspect-[4/5] overflow-hidden rounded-2xl bg-on-surface/10"
                  aria-label={`Open photo ${i + 2}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </Section>
        ) : null}

        {details.lookingFor ? (
          <Section title="Looking for">
            <p className="text-sm leading-relaxed text-on-surface">{details.lookingFor}</p>
          </Section>
        ) : null}

        {details.interests.length > 0 ? (
          <Section title="Interests">
            <div className="flex flex-wrap gap-2">
              {details.interests.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-on-surface"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        ) : null}

        {details.sections.map((section) => (
          <Section key={section.title} title={section.title}>
            <div className="flex flex-col gap-3">
              {section.rows.map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[18px]">{row.icon}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-on-surface" title={row.value}>
                      {row.value}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">{row.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ))}

        {details.futureGoals ? (
          <Section title="Future goals">
            <p className="text-sm leading-relaxed text-on-surface">{details.futureGoals}</p>
          </Section>
        ) : null}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-outline-variant/40 bg-secondary/60 p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">{title}</h4>
      {children}
    </section>
  );
}

type MediaItem = { id: number; image_url: string; is_mine: boolean; timestamp: string };

/** Images exchanged in this chat, with counts (like a messenger's contact info). */
function SharedMedia({
  conversationId,
  onOpenImage,
}: {
  conversationId: string;
  onOpenImage?: (src: string) => void;
}) {
  const [data, setData] = useState<{ count: number; from_me: number; from_them: number; results: MediaItem[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void api
      .getConversationMedia(conversationId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  if (failed) return null;

  const items = data?.results ?? [];
  const shown = expanded ? items : items.slice(0, 6);

  return (
    <section className="rounded-3xl border border-outline-variant/40 bg-secondary/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <h4 className="flex-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Shared media</h4>
        {data ? (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">{data.count}</span>
        ) : null}
      </div>

      {!data ? (
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-on-surface/10" />
          ))}
        </div>
      ) : data.count === 0 ? (
        <p className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">image</span>
          No photos shared in this chat yet.
        </p>
      ) : (
        <>
          <p className="mb-3 text-xs text-on-surface-variant">
            {data.from_me} sent by you · {data.from_them} received
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {shown.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onOpenImage?.(m.image_url)}
                className="group relative aspect-square overflow-hidden rounded-xl bg-on-surface/10"
                title={new Date(m.timestamp).toLocaleString()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.image_url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                {m.is_mine ? (
                  <span className="absolute bottom-1 right-1 rounded-full bg-black/55 px-1.5 text-[9px] font-semibold text-white">
                    You
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          {items.length > 6 ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 w-full rounded-full py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              {expanded ? "Show less" : `See all ${items.length}`}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
