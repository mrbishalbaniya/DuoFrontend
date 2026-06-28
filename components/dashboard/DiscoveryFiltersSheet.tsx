"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Profile } from "@/types";
import { detectUserLocation } from "@/lib/geolocation";

export type DiscoveryFilters = {
  pref_age_min: number;
  pref_age_max: number;
  pref_location: string;
  pref_max_distance_km: number;
  pref_gender: "everyone" | "women" | "men";
  pref_relationship_goal: "everyone" | "serious" | "casual" | "dating";
  pref_verified_only: boolean;
};

const DEFAULT_FILTERS: DiscoveryFilters = {
  pref_age_min: 22,
  pref_age_max: 35,
  pref_location: "",
  pref_max_distance_km: 50,
  pref_gender: "everyone",
  pref_relationship_goal: "everyone",
  pref_verified_only: false,
};

function normalizeCityPref(location?: string): string {
  const value = location?.trim() ?? "";
  if (!value) return "";

  const first = value.split(",")[0]?.trim() ?? value;
  return first
    .replace(/\s+metropolitan city$/i, "")
    .replace(/\s+metropolitan$/i, "")
    .trim();
}

function formatLocationLabel(location: string): string {
  const normalized = normalizeCityPref(location);
  if (normalized.length <= 28) return normalized;
  return `${normalized.slice(0, 26).trimEnd()}…`;
}

function IosToggle({
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
      aria-label={label}
      data-checked={checked}
      onClick={() => onChange(!checked)}
      className="ios-toggle"
    >
      <span className="ios-toggle-thumb" />
    </button>
  );
}

function FilterSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      {title ? (
        <p className="px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
          {title}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-variant/40">
        {children}
      </div>
    </section>
  );
}

function FilterSectionHeader({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
      <span className="text-[15px] font-medium text-on-surface">{title}</span>
      <span className="text-[17px] font-semibold tabular-nums text-primary">{value}</span>
    </div>
  );
}

function AgeRangeControl({
  min,
  max,
  onChange,
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}) {
  const trackMin = 18;
  const trackMax = 60;
  const ageMin = Math.min(min, max);
  const ageMax = Math.max(min, max);
  const minPercent = ((ageMin - trackMin) / (trackMax - trackMin)) * 100;
  const maxPercent = ((ageMax - trackMin) / (trackMax - trackMin)) * 100;

  return (
    <>
      <FilterSectionHeader title="Age" value={`${ageMin} – ${ageMax}`} />
      <div className="px-4 py-4">
        <div className="ios-dual-range">
          <div className="ios-dual-range-track" aria-hidden />
          <div
            className="ios-dual-range-fill"
            style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
            aria-hidden
          />
          <input
            type="range"
            min={trackMin}
            max={trackMax}
            value={ageMin}
            onChange={(event) => {
              const nextMin = Math.min(Number(event.target.value), ageMax);
              onChange(nextMin, ageMax);
            }}
            className="ios-range ios-dual-range-input"
            aria-label="Minimum age"
          />
          <input
            type="range"
            min={trackMin}
            max={trackMax}
            value={ageMax}
            onChange={(event) => {
              const nextMax = Math.max(Number(event.target.value), ageMin);
              onChange(ageMin, nextMax);
            }}
            className="ios-range ios-dual-range-input"
            aria-label="Maximum age"
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] tabular-nums text-on-surface-variant/60">
          <span>{trackMin}</span>
          <span>{trackMax}</span>
        </div>
      </div>
    </>
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
  const [prefAgeMin, setPrefAgeMin] = useState(DEFAULT_FILTERS.pref_age_min);
  const [prefAgeMax, setPrefAgeMax] = useState(DEFAULT_FILTERS.pref_age_max);
  const [prefLocation, setPrefLocation] = useState("");
  const [prefMaxDistance, setPrefMaxDistance] = useState(DEFAULT_FILTERS.pref_max_distance_km);
  const [prefGender, setPrefGender] = useState<DiscoveryFilters["pref_gender"]>("everyone");
  const [prefRelationshipGoal, setPrefRelationshipGoal] =
    useState<DiscoveryFilters["pref_relationship_goal"]>("everyone");
  const [prefVerifiedOnly, setPrefVerifiedOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadFromProfile = useCallback((current: Profile) => {
    setPrefAgeMin(current.pref_age_min ?? DEFAULT_FILTERS.pref_age_min);
    setPrefAgeMax(current.pref_age_max ?? DEFAULT_FILTERS.pref_age_max);
    setPrefLocation(
      normalizeCityPref(current.pref_location || current.location || "")
    );
    setPrefMaxDistance(current.pref_max_distance_km ?? DEFAULT_FILTERS.pref_max_distance_km);
    setPrefGender((current.pref_gender as DiscoveryFilters["pref_gender"]) ?? "everyone");
    setPrefRelationshipGoal(
      (current.pref_relationship_goal as DiscoveryFilters["pref_relationship_goal"]) ??
        "everyone"
    );
    setPrefVerifiedOnly(current.pref_verified_only ?? false);
    setSaveError(null);
    setLocationError(null);
  }, []);

  const runLocationDetect = useCallback(async () => {
    setDetectingLocation(true);
    setLocationError(null);
    try {
      const detected = await detectUserLocation();
      setPrefLocation(detected.city || normalizeCityPref(detected.label));
      return detected;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not detect your location.";
      setLocationError(message);
      throw error;
    } finally {
      setDetectingLocation(false);
    }
  }, []);

  useEffect(() => {
    if (open && profile) {
      loadFromProfile(profile);
    }
  }, [open, profile, loadFromProfile]);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleReset = () => {
    setPrefAgeMin(DEFAULT_FILTERS.pref_age_min);
    setPrefAgeMax(DEFAULT_FILTERS.pref_age_max);
    setPrefLocation("");
    setPrefMaxDistance(DEFAULT_FILTERS.pref_max_distance_km);
    setPrefGender(DEFAULT_FILTERS.pref_gender);
    setPrefRelationshipGoal(DEFAULT_FILTERS.pref_relationship_goal);
    setPrefVerifiedOnly(DEFAULT_FILTERS.pref_verified_only);
    setSaveError(null);
    setLocationError(null);
  };

  const handleApply = async () => {
    const min = Math.min(prefAgeMin, prefAgeMax);
    const max = Math.max(prefAgeMin, prefAgeMax);

    setSaving(true);
    setSaveError(null);
    try {
      await onApply({
        pref_age_min: min,
        pref_age_max: max,
        pref_location: prefLocation.trim(),
        pref_max_distance_km: prefMaxDistance,
        pref_gender: prefGender,
        pref_relationship_goal: prefRelationshipGoal,
        pref_verified_only: prefVerifiedOnly,
      });
      onClose();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Could not save filters. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex flex-col justify-end transition-opacity duration-300 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close filters"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="discovery-filters-title"
        className={`relative z-[101] mx-auto flex h-[min(92dvh,820px)] min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] border-t border-white/10 bg-background shadow-[0_-12px_48px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center bg-background pb-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="h-1.5 w-12 rounded-full bg-white/20 transition-colors hover:bg-white/30"
            aria-label="Close filters"
          />
        </div>

        <div className="flex shrink-0 bg-background px-4 pb-3">
          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-[17px] font-normal text-primary active:opacity-70"
            >
              Cancel
            </button>
            <h2 id="discovery-filters-title" className="text-[17px] font-semibold text-on-surface">
              Filters
            </h2>
            <button
              type="button"
              onClick={() => void handleApply()}
              disabled={saving}
              className="text-[17px] font-semibold text-primary active:opacity-70 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Apply"}
            </button>
          </div>
        </div>

        <div
          data-lenis-prevent
          className="ios-sheet-scroll min-h-0 flex-1 touch-pan-y bg-background"
        >
          <div className="space-y-4 px-5 pb-10 pt-2">
            {saveError ? (
              <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">
                {saveError}
              </div>
            ) : null}

            <FilterSection title="Location">
              <button
                type="button"
                onClick={() => void runLocationDetect()}
                disabled={detectingLocation}
                className="ios-filter-row w-full text-left transition-colors active:bg-white/[0.04] disabled:opacity-60"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={`material-symbols-outlined shrink-0 text-xl text-primary ${
                      detectingLocation ? "animate-pulse" : ""
                    }`}
                  >
                    my_location
                  </span>
                  <div className="min-w-0">
                    <p className="ios-filter-label">
                      {detectingLocation ? "Detecting location…" : "Use current location"}
                    </p>
                    <p className="mt-0.5 truncate text-[13px] text-on-surface-variant">
                      {prefLocation
                        ? `Near ${formatLocationLabel(prefLocation)}`
                        : "Auto-fill city from GPS"}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined shrink-0 text-lg text-on-surface-variant/50">
                  chevron_right
                </span>
              </button>

              {locationError ? (
                <p className="border-t border-white/[0.06] px-4 py-3 text-[13px] text-error">
                  {locationError}
                </p>
              ) : null}
            </FilterSection>

            <FilterSection>
              <AgeRangeControl
                min={prefAgeMin}
                max={prefAgeMax}
                onChange={(min, max) => {
                  setPrefAgeMin(min);
                  setPrefAgeMax(max);
                }}
              />
            </FilterSection>

            <FilterSection>
              <FilterSectionHeader title="Distance" value={`${prefMaxDistance} km`} />
              <div className="px-4 py-4">
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={prefMaxDistance}
                  onChange={(event) => setPrefMaxDistance(Number(event.target.value))}
                  className="ios-range"
                />
              </div>
            </FilterSection>

            <FilterSection title="Show me">
              <div className="p-3">
                <div className="ios-segmented">
                  <button
                    type="button"
                    data-active={prefGender === "women"}
                    onClick={() => setPrefGender("women")}
                    className="ios-segmented-btn"
                  >
                    Women
                  </button>
                  <button
                    type="button"
                    data-active={prefGender === "men"}
                    onClick={() => setPrefGender("men")}
                    className="ios-segmented-btn"
                  >
                    Men
                  </button>
                  <button
                    type="button"
                    data-active={prefGender === "everyone"}
                    onClick={() => setPrefGender("everyone")}
                    className="ios-segmented-btn"
                  >
                    Everyone
                  </button>
                </div>
              </div>
            </FilterSection>

            <FilterSection title="Relationship goals">
              <div className="flex flex-wrap gap-2 p-3">
                {(
                  [
                    ["serious", "Serious"],
                    ["casual", "Casual"],
                    ["dating", "Dating"],
                    ["everyone", "Everyone"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    data-active={prefRelationshipGoal === value}
                    onClick={() => setPrefRelationshipGoal(value)}
                    className="ios-chip"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection>
              <div className="ios-filter-row">
                <div>
                  <p className="ios-filter-label">Verified profiles only</p>
                  <p className="mt-0.5 text-[13px] text-on-surface-variant">
                    Show people with verified IDs
                  </p>
                </div>
                <IosToggle
                  checked={prefVerifiedOnly}
                  onChange={setPrefVerifiedOnly}
                  label="Verified profiles only"
                />
              </div>
            </FilterSection>

            <button
              type="button"
              onClick={handleReset}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-white/[0.06]"
            >
              Reset to recommended defaults
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
