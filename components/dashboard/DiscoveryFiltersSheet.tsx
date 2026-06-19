"use client";

import { useCallback, useEffect, useState } from "react";
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

function FilterSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {title ? (
        <p className="px-4 text-[13px] font-medium uppercase tracking-wide text-on-surface-variant">
          {title}
        </p>
      ) : null}
      <div className="ios-inset-group">{children}</div>
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
  const [prefAgeMin, setPrefAgeMin] = useState(22);
  const [prefAgeMax, setPrefAgeMax] = useState(35);
  const [prefLocation, setPrefLocation] = useState("");
  const [prefMaxDistance, setPrefMaxDistance] = useState(50);
  const [prefGender, setPrefGender] = useState<DiscoveryFilters["pref_gender"]>("everyone");
  const [prefRelationshipGoal, setPrefRelationshipGoal] =
    useState<DiscoveryFilters["pref_relationship_goal"]>("everyone");
  const [prefVerifiedOnly, setPrefVerifiedOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const runLocationDetect = useCallback(async (preferFullLabel = false) => {
    setDetectingLocation(true);
    setLocationError(null);
    try {
      const detected = await detectUserLocation();
      setPrefLocation(preferFullLabel ? detected.label : detected.city);
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
      setPrefAgeMin(profile.pref_age_min ?? 22);
      setPrefAgeMax(profile.pref_age_max ?? 35);
      setPrefLocation(profile.pref_location ?? profile.location ?? "");
      setPrefMaxDistance(profile.pref_max_distance_km ?? 50);
      setPrefGender((profile.pref_gender as DiscoveryFilters["pref_gender"]) ?? "everyone");
      setPrefRelationshipGoal(
        (profile.pref_relationship_goal as DiscoveryFilters["pref_relationship_goal"]) ??
          "everyone"
      );
      setPrefVerifiedOnly(profile.pref_verified_only ?? false);
      setLocationError(null);
    }
  }, [open, profile]);

  useEffect(() => {
    if (!open || !profile) return;

    const existing = (profile.pref_location ?? profile.location ?? "").trim();
    if (existing && !isDefaultLocation(existing)) return;

    let cancelled = false;
    void (async () => {
      try {
        const detected = await runLocationDetect(false);
        if (cancelled || !detected) return;
      } catch {
        /* user can tap detect manually */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, profile, runLocationDetect]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleApply = async () => {
    const min = Math.min(prefAgeMin, prefAgeMax);
    const max = Math.max(prefAgeMin, prefAgeMax);
    setSaving(true);
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
      console.error("Filter save error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col justify-end transition-opacity duration-300 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close filters"
        onClick={onClose}
      />

      <div
        className={`ios-sheet relative z-[101] mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[20px] transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-4 pb-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="text-[17px] font-normal text-primary active:opacity-70"
          >
            Cancel
          </button>
          <h2 className="text-[17px] font-semibold text-on-surface">Filters</h2>
          <button
            type="button"
            onClick={handleApply}
            disabled={saving}
            className="text-[17px] font-semibold text-primary active:opacity-70 disabled:opacity-40"
          >
            {saving ? "…" : "Apply"}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-8 hide-scrollbar">
          <div className="space-y-6">
            <FilterSection title="Location">
              <button
                type="button"
                onClick={() => void runLocationDetect(true)}
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
                      Auto-fill from GPS
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
                  onChange={(e) => setPrefLocation(e.target.value)}
                  placeholder={detectingLocation ? "Detecting…" : "Anywhere in Nepal"}
                  className="min-w-0 flex-1 bg-transparent text-right text-[17px] text-on-surface outline-none placeholder:text-on-surface-variant/60"
                />
              </div>
              <div className="flex flex-wrap gap-2 px-3 py-3">
                {NEPAL_CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    data-active={prefLocation.toLowerCase() === city.toLowerCase()}
                    onClick={() => setPrefLocation(city)}
                    className="ios-chip"
                  >
                    {city}
                  </button>
                ))}
                <button
                  type="button"
                  data-active={prefLocation === ""}
                  onClick={() => setPrefLocation("")}
                  className="ios-chip"
                >
                  Anywhere
                </button>
              </div>
            </FilterSection>

            <FilterSection title="Age">
              <div className="space-y-4 px-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-on-surface-variant">Minimum</span>
                  <span className="text-[17px] font-semibold tabular-nums text-on-surface">
                    {Math.min(prefAgeMin, prefAgeMax)}
                  </span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={60}
                  value={Math.min(prefAgeMin, prefAgeMax)}
                  onChange={(e) => setPrefAgeMin(Number(e.target.value))}
                  className="ios-range"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-on-surface-variant">Maximum</span>
                  <span className="text-[17px] font-semibold tabular-nums text-on-surface">
                    {Math.max(prefAgeMin, prefAgeMax)}
                  </span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={60}
                  value={Math.max(prefAgeMin, prefAgeMax)}
                  onChange={(e) => setPrefAgeMax(Number(e.target.value))}
                  className="ios-range"
                />
              </div>
            </FilterSection>

            <FilterSection title="Distance">
              <div className="space-y-3 px-4 py-4">
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
                  onChange={(e) => setPrefMaxDistance(Number(e.target.value))}
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
          </div>
        </div>
      </div>
    </div>
  );
}
