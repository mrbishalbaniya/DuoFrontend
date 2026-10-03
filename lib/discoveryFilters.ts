import type { Profile } from "@/types";

export type GenderPref = "everyone" | "women" | "men";
export type RelationshipGoalPref = "everyone" | "serious" | "casual" | "dating";

/** Discovery preferences saved on the viewer's profile and applied by /profiles/discover/. */
export type DiscoveryFilters = {
  pref_age_min: number;
  pref_age_max: number;
  pref_location: string;
  pref_max_distance_km: number;
  pref_gender: GenderPref;
  pref_relationship_goal: RelationshipGoalPref;
  pref_verified_only: boolean;
  /** Allow people beyond the distance limit when nobody is left inside it. */
  pref_expand_distance: boolean;
  /** Allow people slightly outside the age range when nobody is left inside it. */
  pref_expand_age: boolean;
};

export const AGE_LIMITS = { min: 18, max: 80 } as const;
export const DISTANCE_LIMITS = { min: 5, max: 500, step: 5 } as const;

export const DEFAULT_FILTERS: DiscoveryFilters = {
  pref_age_min: 22,
  pref_age_max: 35,
  pref_location: "",
  pref_max_distance_km: 50,
  pref_gender: "everyone",
  pref_relationship_goal: "everyone",
  pref_verified_only: false,
  pref_expand_distance: true,
  pref_expand_age: true,
};

export const GENDER_OPTIONS: { value: GenderPref; label: string; icon: string }[] = [
  { value: "women", label: "Women", icon: "female" },
  { value: "men", label: "Men", icon: "male" },
  { value: "everyone", label: "Everyone", icon: "group" },
];

export const GOAL_OPTIONS: { value: RelationshipGoalPref; label: string; icon: string }[] = [
  { value: "everyone", label: "Any goal", icon: "all_inclusive" },
  { value: "serious", label: "Serious", icon: "favorite" },
  { value: "dating", label: "Dating", icon: "local_cafe" },
  { value: "casual", label: "Casual", icon: "celebration" },
];

export function normalizeCity(location?: string | null): string {
  const value = location?.trim() ?? "";
  if (!value) return "";
  const first = value.split(",")[0]?.trim() ?? value;
  return first
    .replace(/\s+metropolitan city$/i, "")
    .replace(/\s+metropolitan$/i, "")
    .replace(/\s+sub-metropolitan city$/i, "")
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function filtersFromProfile(profile: Profile | null | undefined): DiscoveryFilters {
  if (!profile) return { ...DEFAULT_FILTERS };
  const ageMin = clamp(profile.pref_age_min ?? DEFAULT_FILTERS.pref_age_min, AGE_LIMITS.min, AGE_LIMITS.max);
  const ageMax = clamp(profile.pref_age_max ?? DEFAULT_FILTERS.pref_age_max, AGE_LIMITS.min, AGE_LIMITS.max);
  return {
    pref_age_min: Math.min(ageMin, ageMax),
    pref_age_max: Math.max(ageMin, ageMax),
    pref_location: normalizeCity(profile.pref_location || profile.location || ""),
    pref_max_distance_km: clamp(
      profile.pref_max_distance_km ?? DEFAULT_FILTERS.pref_max_distance_km,
      DISTANCE_LIMITS.min,
      DISTANCE_LIMITS.max
    ),
    pref_gender: profile.pref_gender ?? DEFAULT_FILTERS.pref_gender,
    pref_relationship_goal: profile.pref_relationship_goal ?? DEFAULT_FILTERS.pref_relationship_goal,
    pref_verified_only: profile.pref_verified_only ?? DEFAULT_FILTERS.pref_verified_only,
    pref_expand_distance: profile.pref_expand_distance ?? DEFAULT_FILTERS.pref_expand_distance,
    pref_expand_age: profile.pref_expand_age ?? DEFAULT_FILTERS.pref_expand_age,
  };
}

export function filtersEqual(a: DiscoveryFilters, b: DiscoveryFilters): boolean {
  return (Object.keys(a) as (keyof DiscoveryFilters)[]).every((key) =>
    key === "pref_location"
      ? a.pref_location.trim().toLowerCase() === b.pref_location.trim().toLowerCase()
      : a[key] === b[key]
  );
}

/** Filters that narrow results beyond the recommended defaults (drives the badge count). */
export function countActiveFilters(filters: DiscoveryFilters): number {
  let count = 0;
  if (filters.pref_gender !== "everyone") count += 1;
  if (filters.pref_relationship_goal !== "everyone") count += 1;
  if (filters.pref_verified_only) count += 1;
  if (
    filters.pref_age_min !== DEFAULT_FILTERS.pref_age_min ||
    filters.pref_age_max !== DEFAULT_FILTERS.pref_age_max
  ) {
    count += 1;
  }
  if (filters.pref_max_distance_km !== DEFAULT_FILTERS.pref_max_distance_km) count += 1;
  return count;
}

export function formatDistance(km: number): string {
  return km >= DISTANCE_LIMITS.max ? `${DISTANCE_LIMITS.max}+ km` : `${km} km`;
}

export type DiscoverExpansion = "distance" | "age";
