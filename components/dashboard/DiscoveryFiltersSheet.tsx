"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { Profile } from "@/types";
import { detectUserLocation, isDefaultLocation } from "@/lib/geolocation";
import { NEPAL_CITY_NAMES } from "@/lib/locationCoords";

export type DiscoveryFilters = {
  pref_age_min: number;
  pref_age_max: number;
  pref_location: string;
  pref_max_distance_km: number;
  pref_gender: "everyone" | "women" | "men";
  pref_relationship_goal: "everyone" | "serious" | "casual" | "dating";
  pref_verified_only: boolean;
};

const NEPAL_CITIES = NEPAL_CITY_NAMES;

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

  const lower = value.toLowerCase();
  for (const city of NEPAL_CITIES) {
    if (lower.includes(city.toLowerCase())) {
      return city;
    }
  }

  return value.split(",")[0]?.trim() ?? "";
}

function isCitySelected(city: string, prefLocation: string): boolean {
  if (!city) return prefLocation.trim() === "";
  return prefLocation.trim().toLowerCase() === city.toLowerCase();
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
        <p className="px-1 text-[13px] font-semibold uppercase tracking-wide text-on-surface-variant">
          {title}
        </p>
      ) : null}
      <div className="ios-inset-group">{children}</div>
    </section>
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

  if (!open) return null;

  const ageMin = Math.min(prefAgeMin, prefAgeMax);
  const ageMax = Math.max(prefAgeMin, prefAgeMax);

  return (
    <div className="fixed inset-0 z-[100]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close filters"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="discovery-filters-title"
        className="ios-sheet absolute inset-x-0 bottom-0 z-[101] mx-auto flex h-[min(88dvh,760px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[24px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 flex-col items-center border-b border-white/[0.08] px-4 pb-3 pt-2">
          <div className="mb-3 h-1 w-10 rounded-full bg-white/20" />
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y [scrollbar-gutter:stable]">
          <div className="space-y-6 px-4 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
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
                className="ios-filter-row w-full border-b border-white/[0.06] text-left transition-colors active:bg-white/[0.04] disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-xl text-primary ${
                      detectingLocation ? "animate-pulse" : ""
                    }`}
                  >
                    my_location
                  </span>
                  <div>
                    <p className="ios-filter-label">
                      {detectingLocation ? "Detecting location…" : "Use current location"}
                    </p>
                    <p className="mt-0.5 text-[13px] text-on-surface-variant">
                      Auto-fill city from GPS
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-lg text-on-surface-variant/50">
                  chevron_right
                </span>
              </button>

              {locationError ? (
                <p className="px-4 py-2 text-[13px] text-error">{locationError}</p>
              ) : null}

              <div className="ios-filter-row border-b border-white/[0.06]">
                <label htmlFor="filter-location" className="ios-filter-label shrink-0">
                  City
                </label>
                <input
                  id="filter-location"
                  type="text"
                  value={prefLocation}
                  onChange={(event) => setPrefLocation(event.target.value)}
                  placeholder="Anywhere in Nepal"
                  className="min-w-0 flex-1 bg-transparent text-right text-[17px] text-on-surface outline-none placeholder:text-on-surface-variant/60"
                />
              </div>

              <div className="flex flex-wrap gap-2 px-3 py-3">
                {NEPAL_CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    data-active={isCitySelected(city, prefLocation)}
                    onClick={() => setPrefLocation(city)}
                    className="ios-chip"
                  >
                    {city}
                  </button>
                ))}
                <button
                  type="button"
                  data-active={prefLocation.trim() === ""}
                  onClick={() => setPrefLocation("")}
                  className="ios-chip"
                >
                  Anywhere
                </button>
              </div>
            </FilterSection>

            <FilterSection title="Age">
              <div className="space-y-5 px-4 py-4">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[15px] text-on-surface-variant">Minimum</span>
                    <span className="text-[17px] font-semibold tabular-nums text-on-surface">
                      {ageMin}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={60}
                    value={ageMin}
                    onChange={(event) => setPrefAgeMin(Number(event.target.value))}
                    className="ios-range"
                  />
                </div>
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[15px] text-on-surface-variant">Maximum</span>
                    <span className="text-[17px] font-semibold tabular-nums text-on-surface">
                      {ageMax}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={60}
                    value={ageMax}
                    onChange={(event) => setPrefAgeMax(Number(event.target.value))}
                    className="ios-range"
                  />
                </div>
              </div>
            </FilterSection>

            <FilterSection title="Distance">
              <div className="space-y-4 px-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="ios-filter-label">Maximum distance</span>
                  <span className="text-[17px] font-semibold tabular-nums text-primary">
                    {prefMaxDistance} km
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={prefMaxDistance}
                  onChange={(event) => setPrefMaxDistance(Number(event.target.value))}
                  className="ios-range"
                />
                <div className="flex flex-wrap gap-2">
                  {[25, 50, 100, 200].map((km) => (
                    <button
                      key={km}
                      type="button"
                      data-active={prefMaxDistance === km}
                      onClick={() => setPrefMaxDistance(km)}
                      className="ios-chip"
                    >
                      {km} km
                    </button>
                  ))}
                </div>
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
    </div>
  );
}
