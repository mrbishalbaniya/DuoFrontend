"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Profile } from "@/types";
import api from "@/lib/api";
import { detectUserLocation, type DetectedLocation } from "@/lib/geolocation";
import { useToast } from "@/contexts/ToastContext";
import {
  AGE_LIMITS,
  DEFAULT_FILTERS,
  DISTANCE_LIMITS,
  GENDER_OPTIONS,
  GOAL_OPTIONS,
  filtersEqual,
  filtersFromProfile,
  formatDistance,
  normalizeCity,
  type DiscoveryFilters,
} from "@/lib/discoveryFilters";
import { useSheetAnchor } from "@/lib/useSheetAnchor";
import "./discovery-filters.css";

export type { DiscoveryFilters } from "@/lib/discoveryFilters";

const GOAL_SEGMENTS = GOAL_OPTIONS.map((option) =>
  option.value === "everyone" ? { ...option, label: "Any" } : option
);

/** iOS segmented control with a sliding selection pill. */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  return (
    <div
      className="dfs-seg"
      role="radiogroup"
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      <span
        className="dfs-seg-pill"
        aria-hidden
        style={{
          width: `calc((100% - 4px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className="dfs-seg-btn"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="dfs-row dfs-row--button"
    >
      <span className="dfs-row-title">{label}</span>
      <span className="dfs-switch" data-on={checked} aria-hidden>
        <span />
      </span>
    </button>
  );
}

function AgeSlider({
  min,
  max,
  onChange,
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}) {
  const span = AGE_LIMITS.max - AGE_LIMITS.min;
  const pct = (value: number) => ((value - AGE_LIMITS.min) / span) * 100;
  // When both thumbs meet at the top end, the min thumb must sit on top to stay draggable.
  const minOnTop = min >= AGE_LIMITS.max - 1;

  return (
    <div className="dfs-range">
      <div className="dfs-range-track" aria-hidden />
      <div
        className="dfs-range-fill"
        aria-hidden
        style={{ left: `${pct(min)}%`, width: `${Math.max(0, pct(max) - pct(min))}%` }}
      />
      <input
        type="range"
        min={AGE_LIMITS.min}
        max={AGE_LIMITS.max}
        value={min}
        onChange={(event) => onChange(Math.min(Number(event.target.value), max), max)}
        className="dfs-range-input"
        style={minOnTop ? { zIndex: 4 } : undefined}
        aria-label="Minimum age"
        aria-valuetext={`${min} years`}
      />
      <input
        type="range"
        min={AGE_LIMITS.min}
        max={AGE_LIMITS.max}
        value={max}
        onChange={(event) => onChange(min, Math.max(Number(event.target.value), min))}
        className="dfs-range-input"
        aria-label="Maximum age"
        aria-valuetext={`${max} years`}
      />
    </div>
  );
}

function DistanceSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const pct = ((value - DISTANCE_LIMITS.min) / (DISTANCE_LIMITS.max - DISTANCE_LIMITS.min)) * 100;
  return (
    <div className="dfs-range">
      <div className="dfs-range-track" aria-hidden />
      <div className="dfs-range-fill" aria-hidden style={{ left: 0, width: `${pct}%` }} />
      <input
        type="range"
        min={DISTANCE_LIMITS.min}
        max={DISTANCE_LIMITS.max}
        step={DISTANCE_LIMITS.step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="dfs-range-input"
        aria-label="Maximum distance"
        aria-valuetext={formatDistance(value)}
      />
    </div>
  );
}

interface DiscoveryFiltersSheetProps {
  open: boolean;
  onClose: () => void;
  profile: Profile | null;
  onApply: (filters: DiscoveryFilters) => Promise<void>;
}

export default function DiscoveryFiltersSheet({
  open,
  onClose,
  profile,
  onApply,
}: DiscoveryFiltersSheetProps) {
  const [draft, setDraft] = useState<DiscoveryFilters>(() => filtersFromProfile(profile));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [detected, setDetected] = useState<DetectedLocation | null>(null);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useSheetAnchor(open, rootRef);
  const { showErrorToast } = useToast();

  // Compare against the real saved search city (normally empty): distance is
  // always measured from the viewer's own position, so a leftover city from
  // the old search UI counts as a change and is cleared on apply.
  const saved = useMemo(
    () => ({ ...filtersFromProfile(profile), pref_location: normalizeCity(profile?.pref_location) }),
    [profile]
  );
  const dirty = !filtersEqual(draft, saved) || detected !== null;
  const atDefaults = filtersEqual({ ...draft, pref_location: "" }, { ...DEFAULT_FILTERS });
  const ownCity = normalizeCity(profile?.location);

  const update = useCallback(<K extends keyof DiscoveryFilters>(key: K, value: DiscoveryFilters[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaveError(null);
  }, []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setDraft({ ...filtersFromProfile(profile), pref_location: "" });
    setDetected(null);
    setSaveError(null);
    setLocationError(null);
    // Only reload the draft when the sheet opens, not on every profile refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Refs keep the open-effect stable even though parents pass inline callbacks.
  const onCloseRef = useRef(onClose);
  const savingRef = useRef(saving);
  useEffect(() => {
    onCloseRef.current = onClose;
    savingRef.current = saving;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !savingRef.current) onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const detectLocation = async () => {
    setDetectingLocation(true);
    setLocationError(null);
    try {
      setDetected(await detectUserLocation());
      setSaveError(null);
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "Could not detect your location.");
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_FILTERS });
    setSaveError(null);
  };

  const handleApply = async () => {
    if (!dirty) {
      onClose();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (detected) {
        const [latitude, longitude] = detected.coordinates;
        try {
          await api.updateLiveLocation(latitude, longitude);
        } catch (err) {
          // e.g. ghost mode: keep the filters, but tell the user their position wasn't saved.
          showErrorToast(err instanceof Error ? err.message : "Could not save your current location.");
        }
      }
      await onApply({
        ...draft,
        pref_age_min: Math.min(draft.pref_age_min, draft.pref_age_max),
        pref_age_max: Math.max(draft.pref_age_min, draft.pref_age_max),
        pref_location: "",
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save filters. Please try again.";
      setSaveError(message);
      showErrorToast(message);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  const detectedPlace = detected
    ? normalizeCity(detected.city || detected.place || detected.label) || "Current location"
    : "";
  const locationValue = detectingLocation
    ? "Locating…"
    : detectedPlace || ownCity || "Not set";

  return createPortal(
    <div ref={rootRef} className="dfs-root" data-open={open} aria-hidden={!open} role="presentation">
      <button
        type="button"
        className="dfs-backdrop"
        aria-label="Close filters"
        onClick={() => !saving && onClose()}
        tabIndex={open ? 0 : -1}
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="discovery-filters-title"
        className="dfs-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dfs-grabber" aria-hidden>
          <span />
        </div>

        <nav className="dfs-navbar">
          <button type="button" className="dfs-navbtn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <h2 id="discovery-filters-title" className="dfs-title">
            Filters
          </h2>
          <button
            type="button"
            className="dfs-navbtn dfs-navbtn--strong"
            onClick={() => void handleApply()}
            disabled={saving}
          >
            {saving ? <span className="dfs-spinner" aria-label="Saving" /> : dirty ? "Apply" : "Done"}
          </button>
        </nav>

        <div data-lenis-prevent className="dfs-scroll">
          {saveError ? <p className="dfs-note dfs-note--error">{saveError}</p> : null}

          <div className="dfs-group">
            <button
              type="button"
              className="dfs-row dfs-row--button"
              onClick={() => void detectLocation()}
              disabled={detectingLocation}
            >
              <span className="dfs-row-title">Location</span>
              <span className="dfs-row-value">{locationValue}</span>
              <span className="dfs-locate" data-done={detected !== null} aria-hidden>
                {detectingLocation ? (
                  <span className="dfs-spinner" />
                ) : (
                  <span className="material-symbols-outlined">{detected ? "check" : "near_me"}</span>
                )}
              </span>
            </button>
          </div>
          {locationError ? <p className="dfs-note dfs-note--error">{locationError}</p> : null}

          <div className="dfs-group">
            <div className="dfs-row dfs-row--stack">
              <div className="dfs-row-head">
                <span className="dfs-row-title">Distance</span>
                <span className="dfs-row-value">{formatDistance(draft.pref_max_distance_km)}</span>
              </div>
              <DistanceSlider
                value={draft.pref_max_distance_km}
                onChange={(value) => update("pref_max_distance_km", value)}
              />
            </div>
            <div className="dfs-row dfs-row--stack">
              <div className="dfs-row-head">
                <span className="dfs-row-title">Age</span>
                <span className="dfs-row-value">
                  {draft.pref_age_min} – {draft.pref_age_max}
                </span>
              </div>
              <AgeSlider
                min={draft.pref_age_min}
                max={draft.pref_age_max}
                onChange={(min, max) =>
                  setDraft((current) => ({ ...current, pref_age_min: min, pref_age_max: max }))
                }
              />
            </div>
          </div>

          <div className="dfs-group">
            <div className="dfs-row dfs-row--stack">
              <span className="dfs-row-title">Show me</span>
              <Segmented
                label="Show me"
                options={GENDER_OPTIONS}
                value={draft.pref_gender}
                onChange={(value) => update("pref_gender", value)}
              />
            </div>
            <div className="dfs-row dfs-row--stack">
              <span className="dfs-row-title">Looking for</span>
              <Segmented
                label="Looking for"
                options={GOAL_SEGMENTS}
                value={draft.pref_relationship_goal}
                onChange={(value) => update("pref_relationship_goal", value)}
              />
            </div>
            <Toggle
              label="Verified profiles only"
              checked={draft.pref_verified_only}
              onChange={(value) => update("pref_verified_only", value)}
            />
          </div>

          <p className="dfs-caption">More preferences</p>
          <div className="dfs-group">
            <Link
              href="/preferences"
              onClick={onClose}
              className="dfs-row dfs-row--button"
            >
              <span className="dfs-row-title">
                Religion, caste, rashi, height, occupation
                <span style={{ display: "block", fontSize: 12, opacity: 0.65, fontWeight: 400 }}>
                  Open all match preferences
                </span>
              </span>
              <span className="material-symbols-outlined" aria-hidden style={{ opacity: 0.6 }}>
                chevron_right
              </span>
            </Link>
          </div>

          <p className="dfs-caption">If you run out of people nearby</p>
          <div className="dfs-group">
            <Toggle
              label="Expand distance"
              checked={draft.pref_expand_distance}
              onChange={(value) => update("pref_expand_distance", value)}
            />
            <Toggle
              label="Expand age range"
              checked={draft.pref_expand_age}
              onChange={(value) => update("pref_expand_age", value)}
            />
          </div>

          <button
            type="button"
            className="dfs-reset"
            onClick={handleReset}
            disabled={atDefaults || saving}
          >
            Reset to recommended
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
