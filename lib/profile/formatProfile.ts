import type { Profile, User } from "@/types";
import { resolveMediaUrl } from "@/lib/mediaUrl";

export type ParsedPrefValues = {
  caste?: string;
  gotra?: string;
  horoscope?: string;
  birthTime?: string;
  birthPlace?: string;
  height?: string;
  company?: string;
  monthlyIncome?: string;
  preferredReligion?: string;
  interCaste?: string;
  interReligion?: string;
  lookingForText?: string;
  futureGoals?: string;
  fieldOfStudy?: string;
  educationLevel?: string;
};

export function parsePrefValues(raw?: string): ParsedPrefValues {
  if (!raw?.trim()) return {};
  try {
    return JSON.parse(raw) as ParsedPrefValues;
  } catch {
    return { notes: raw } as ParsedPrefValues & { notes?: string };
  }
}

export function displayValue(value: unknown, fallback = "Not set"): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && !value.trim()) return fallback;
  return String(value);
}

export function formatGender(gender?: string): string {
  if (gender === "M") return "Male";
  if (gender === "F") return "Female";
  if (gender === "O") return "Other";
  return displayValue(gender);
}

export function formatWorkPreference(value?: string): string {
  const map: Record<string, string> = {
    Private: "Private sector",
    Government: "Government",
    Business: "Business / self-employed",
    NotWorking: "Not working",
  };
  return map[value ?? ""] ?? displayValue(value);
}

export function formatPrefGender(value?: string): string {
  const map: Record<string, string> = {
    everyone: "Everyone",
    women: "Women",
    men: "Men",
  };
  return map[value ?? ""] ?? displayValue(value);
}

export function formatRelationshipGoal(value?: string): string {
  const map: Record<string, string> = {
    serious: "Serious relationship",
    casual: "Casual",
    dating: "Dating",
    everyone: "Open to all",
  };
  return map[value ?? ""] ?? displayValue(value);
}

export function formatLifestyleTag(tag: string): string {
  if (tag.includes(":")) {
    const [key, val] = tag.split(":");
    return `${key.charAt(0).toUpperCase()}${key.slice(1)}: ${val}`;
  }
  return tag.replace(/_/g, " ");
}

export function formatPhone(profile: Profile): string {
  const code = profile.phone_country_code?.trim();
  const number = profile.phone_number?.trim();
  if (code && number) return `${code} ${number}`;
  return displayValue(number || code);
}

export function getProfilePhotos(profile: Profile): string[] {
  const photos = new Set<string>();
  const primary = resolveMediaUrl(profile.photo_url);
  if (primary) photos.add(primary);
  (profile.photo_urls ?? []).forEach((url) => {
    const resolved = resolveMediaUrl(url);
    if (resolved) photos.add(resolved);
  });
  return Array.from(photos);
}

export type ProfileField = {
  label: string;
  value: string;
};

export function buildProfileSections(user: User, profile: Profile) {
  const extra = parsePrefValues(profile.pref_values);
  const prefAgeMin = profile.pref_age_min ?? 22;
  const prefAgeMax = profile.pref_age_max ?? 35;
  const prefDistance = profile.pref_max_distance_km ?? 50;
  const prefLocation = profile.pref_location?.trim() || profile.location?.trim() || "Nearby";
  const prefHeight = profile.pref_min_height?.trim() || `5'2" (157cm)`;
  const prefOccupation = profile.pref_occupation?.trim() || "Professional Degree";

  return {
    account: [
      { label: "Username", value: displayValue(user.username) },
      { label: "Email", value: displayValue(user.email) },
      { label: "Phone", value: formatPhone(profile) },
    ] satisfies ProfileField[],
    personal: [
      { label: "Full name", value: displayValue(profile.full_name) },
      { label: "Age", value: displayValue(profile.age) },
      { label: "Gender", value: formatGender(profile.gender) },
      { label: "Location", value: displayValue(profile.location) },
      { label: "Height", value: displayValue(extra.height) },
      { label: "Religion", value: displayValue(profile.religion) },
      { label: "Relationship goal", value: formatRelationshipGoal(profile.relationship_goal) },
      { label: "Work preference", value: formatWorkPreference(profile.work_preference) },
    ] satisfies ProfileField[],
    education: [
      { label: "Education", value: displayValue(profile.education) },
      { label: "Education level", value: displayValue(extra.educationLevel?.replace(/_/g, " ")) },
      { label: "Field of study", value: displayValue(extra.fieldOfStudy?.replace(/_/g, " ")) },
      { label: "Occupation", value: displayValue(profile.occupation) },
      { label: "Company", value: displayValue(extra.company) },
      { label: "Monthly income", value: displayValue(extra.monthlyIncome?.replace(/_/g, " ")) },
    ] satisfies ProfileField[],
    background: [
      { label: "Caste", value: displayValue(extra.caste) },
      { label: "Gotra", value: displayValue(extra.gotra) },
      { label: "Horoscope", value: displayValue(extra.horoscope) },
      { label: "Birth time", value: displayValue(extra.birthTime) },
      { label: "Birth place", value: displayValue(extra.birthPlace) },
    ] satisfies ProfileField[],
    about: [
      { label: "Bio", value: displayValue(profile.bio, "No bio yet") },
      { label: "Looking for", value: displayValue(extra.lookingForText) },
      { label: "Future goals", value: displayValue(extra.futureGoals) },
    ] satisfies ProfileField[],
    preferences: [
      { label: "Looking for gender", value: formatPrefGender(profile.pref_gender || "everyone") },
      { label: "Age range", value: `${prefAgeMin} – ${prefAgeMax} years` },
      { label: "Min height", value: prefHeight },
      { label: "Preferred occupation", value: prefOccupation },
      { label: "Preferred religion", value: displayValue(extra.preferredReligion, "Any religion") },
      { label: "Preferred location", value: prefLocation },
      { label: "Max distance", value: `${prefDistance} km` },
      { label: "Relationship preference", value: formatRelationshipGoal(profile.pref_relationship_goal || "everyone") },
      { label: "Verified profiles only", value: profile.pref_verified_only ? "Yes" : "No" },
      { label: "Inter-caste", value: displayValue(extra.interCaste, "Open") },
      { label: "Inter-religion", value: displayValue(extra.interReligion, "Open") },
    ] satisfies ProfileField[],
    status: [
      { label: "Profile completeness", value: `${profile.profile_completeness ?? 0}%` },
      { label: "Identity verified", value: displayValue(profile.is_verified) },
      { label: "Onboarding complete", value: displayValue(profile.is_onboarded) },
    ] satisfies ProfileField[],
    lifestyleTags: (profile.lifestyle_tags ?? []).map(formatLifestyleTag),
    photos: getProfilePhotos(profile),
  };
}
