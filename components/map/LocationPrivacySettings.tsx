"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { resolveProfilePhotoUrl } from "@/lib/mediaUrl";
import type { Match, Profile } from "@/types";

export type LocationVisibilityMode = "friends" | "friends_except" | "only_these";

const VISIBILITY_OPTIONS: {
  id: LocationVisibilityMode;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "friends",
    label: "My friends",
    description: "All matches can see your location",
    icon: "group",
  },
  {
    id: "friends_except",
    label: "My friends, except…",
    description: "Hide from selected matches",
    icon: "group_off",
  },
  {
    id: "only_these",
    label: "Only these friends",
    description: "Only selected matches can see you",
    icon: "person_check",
  },
];

function friendUserId(match: Match): number | null {
  const id = match.other_user_profile?.user_id;
  return typeof id === "number" ? id : null;
}

function FriendPicker({
  matches,
  selectedIds,
  onToggle,
  mode,
}: {
  matches: Match[];
  selectedIds: number[];
  onToggle: (userId: number) => void;
  mode: LocationVisibilityMode;
}) {
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const hint =
    mode === "friends_except"
      ? "Selected friends will not see your location"
      : "Only selected friends will see your location";

  if (matches.length === 0) {
    return (
      <p className="px-1 py-3 text-[13px] text-on-surface-variant">
        Match with someone to choose who can see your location.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="px-1 text-[12px] text-on-surface-variant">{hint}</p>
      <ul className="ios-inset-group max-h-48 overflow-y-auto overscroll-contain">
        {matches.map((match) => {
          const profile = match.other_user_profile as Profile | undefined;
          const userId = friendUserId(match);
          if (!profile || userId == null) return null;
          const checked = selected.has(userId);
          const photo = resolveProfilePhotoUrl(profile);
          return (
            <li key={match.id}>
              <button
                type="button"
                onClick={() => onToggle(userId)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition active:bg-white/[0.04]"
              >
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                </div>
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-on-surface">
                  {profile.full_name || "Friend"}
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    checked
                      ? "border-primary bg-primary text-white"
                      : "border-outline-variant/50 text-transparent"
                  }`}
                  aria-hidden
                >
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function LocationPrivacySettings() {
  const { user, fetchUser } = useAuth();
  const profile = user?.profile;

  const [ghostMode, setGhostMode] = useState(Boolean(profile?.location_ghost_mode));
  const [visibility, setVisibility] = useState<LocationVisibilityMode>(
    profile?.location_visibility ?? "friends"
  );
  const [friendIds, setFriendIds] = useState<number[]>(
    profile?.location_visibility_friends ?? []
  );
  const [matches, setMatches] = useState<Match[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setGhostMode(Boolean(profile?.location_ghost_mode));
    setVisibility(profile?.location_visibility ?? "friends");
    setFriendIds(profile?.location_visibility_friends ?? []);
  }, [
    profile?.location_ghost_mode,
    profile?.location_visibility,
    profile?.location_visibility_friends,
  ]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await api.getMatches();
        if (!cancelled) setMatches(data);
      } catch {
        if (!cancelled) setMatches([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(
    async (next: {
      location_ghost_mode?: boolean;
      location_visibility?: LocationVisibilityMode;
      location_visibility_friends?: number[];
    }) => {
      setSaving(true);
      setError(null);
      setSavedFlash(false);
      try {
        await api.updateProfile(next);
        await fetchUser();
        setSavedFlash(true);
        window.setTimeout(() => setSavedFlash(false), 1600);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save location privacy.");
      } finally {
        setSaving(false);
      }
    },
    [fetchUser]
  );

  const handleGhostToggle = () => {
    const next = !ghostMode;
    setGhostMode(next);
    void persist({ location_ghost_mode: next });
  };

  const handleVisibility = (mode: LocationVisibilityMode) => {
    setVisibility(mode);
    void persist({
      location_visibility: mode,
      location_visibility_friends:
        mode === "friends" ? [] : friendIds,
    });
  };

  const handleFriendToggle = (userId: number) => {
    const next = friendIds.includes(userId)
      ? friendIds.filter((id) => id !== userId)
      : [...friendIds, userId];
    setFriendIds(next);
    void persist({
      location_visibility: visibility,
      location_visibility_friends: next,
    });
  };

  return (
    <section className="map-location-privacy mb-3">
      <h3 className="map-layers-section-title">
        <span className="material-symbols-outlined text-base text-primary">location_on</span>
        Location privacy
      </h3>

      <div className="ios-inset-group overflow-hidden">
        <button
          type="button"
          onClick={handleGhostToggle}
          disabled={saving}
          className="flex w-full items-center gap-3 px-3 py-3 text-left transition active:bg-white/[0.04] disabled:opacity-60"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <span className="material-symbols-outlined text-[20px]">visibility_off</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-on-surface">Ghost mode</p>
            <p className="text-[12px] leading-snug text-on-surface-variant">
              When enabled, your friends cannot see your location
            </p>
          </div>
          <span
            role="switch"
            aria-checked={ghostMode}
            className={`map-layers-switch shrink-0 ${ghostMode ? "map-layers-switch--on" : ""}`}
          >
            <span className="map-layers-switch__thumb" />
          </span>
        </button>
      </div>

      <div
        className={`mt-3 transition-opacity ${ghostMode ? "pointer-events-none opacity-40" : ""}`}
      >
        <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant">
          Who can see my location
        </p>
        <div className="ios-inset-group overflow-hidden">
          {VISIBILITY_OPTIONS.map((option, index) => {
            const active = visibility === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={saving || ghostMode}
                onClick={() => handleVisibility(option.id)}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left transition active:bg-white/[0.04] disabled:opacity-60 ${
                  index < VISIBILITY_OPTIONS.length - 1 ? "border-b border-white/[0.06]" : ""
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                  <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-on-surface">{option.label}</p>
                  <p className="text-[12px] text-on-surface-variant">{option.description}</p>
                </div>
                <span
                  className={`map-layers-radio shrink-0 ${active ? "map-layers-radio--on" : ""}`}
                  aria-hidden
                >
                  <span className="map-layers-radio__dot" />
                </span>
              </button>
            );
          })}
        </div>

        {!ghostMode && (visibility === "friends_except" || visibility === "only_these") ? (
          <FriendPicker
            matches={matches}
            selectedIds={friendIds}
            onToggle={handleFriendToggle}
            mode={visibility}
          />
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 px-1 text-[12px] text-error">{error}</p>
      ) : savedFlash ? (
        <p className="mt-2 px-1 text-[12px] text-primary">Saved</p>
      ) : null}
    </section>
  );
}
