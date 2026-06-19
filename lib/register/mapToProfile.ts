import { calculateAgeFromDob } from "@/lib/age";
import { splitPhoneValue } from "@/lib/phone";
import type { Profile, ProfileFormData } from "@/types";
import type { RegistrationData } from "@/types/registration";

function mapGender(gender: RegistrationData["gender"]): string {
  if (gender === "male") return "M";
  if (gender === "female") return "F";
  return "O";
}

function mapReligion(religion: RegistrationData["religion"]): string {
  const map: Record<string, string> = {
    hindu: "Hindu",
    buddhist: "Buddhist",
    muslim: "Muslim",
    christian: "Christian",
    kirat: "Other",
    other: "Other",
  };
  return map[religion] ?? "Other";
}

function mapWorkPreference(employment: RegistrationData["employment"]): string {
  const map: Record<string, string> = {
    student: "Private",
    employed: "Private",
    self_employed: "Business",
    freelancer: "Private",
    business_owner: "Business",
    unemployed: "NotWorking",
  };
  return map[employment] ?? "Private";
}

function mapPrefGender(lookingFor: RegistrationData["lookingFor"]): Profile["pref_gender"] {
  if (lookingFor === "male") return "men";
  if (lookingFor === "female") return "women";
  return "everyone";
}

function mapRelationshipGoal(
  goal: RegistrationData["relationshipGoal"]
): NonNullable<Profile["relationship_goal"]> {
  if (goal === "dating") return "dating";
  if (goal === "friendship") return "casual";
  return "serious";
}

function mapPrefRelationshipGoal(
  goal: RegistrationData["relationshipGoal"]
): Profile["pref_relationship_goal"] {
  if (goal === "dating") return "dating";
  if (goal === "friendship") return "casual";
  if (goal === "serious" || goal === "marriage") return "serious";
  return "everyone";
}

function mapDistanceKm(distance: RegistrationData["distancePreference"]): number {
  if (distance === "anywhere") return 500;
  return Number(distance || 25);
}

function buildLocation(data: RegistrationData): string {
  if (data.currentLocation.trim()) return data.currentLocation.trim();
  const parts = [data.municipality, data.district, data.province, data.country].filter(Boolean);
  return parts.join(", ") || "Kathmandu, Nepal";
}

function buildEducation(data: RegistrationData): string {
  const level = data.educationLevel.replace("_", " ").toUpperCase();
  const field = data.fieldOfStudy.replace("_", " ");
  return `${level} · ${field}`.trim();
}

function buildLifestyleTags(data: RegistrationData): string[] {
  return [
    ...data.interests,
    data.personality,
    data.lifestyle,
    data.smoking ? `smoking:${data.smoking}` : "",
    data.drinking ? `drinking:${data.drinking}` : "",
    data.exercise ? `exercise:${data.exercise}` : "",
    data.maritalStatus ? `marital:${data.maritalStatus}` : "",
  ].filter(Boolean);
}

function buildPrefValues(data: RegistrationData): string {
  return JSON.stringify({
    caste: data.caste,
    gotra: data.gotra,
    horoscope: data.horoscope,
    birthTime: data.birthTime,
    birthPlace: data.birthPlace,
    height: `${data.heightFeet}'${data.heightInches}"`,
    company: data.company,
    monthlyIncome: data.monthlyIncome,
    preferredReligion: data.preferredReligion,
    interCaste: data.interCaste,
    interReligion: data.interReligion,
    lookingForText: data.lookingForText,
    futureGoals: data.futureGoals,
    fieldOfStudy: data.fieldOfStudy,
    educationLevel: data.educationLevel,
  });
}

function buildBio(data: RegistrationData): string {
  const sections = [
    data.bio.trim(),
    data.lookingForText.trim() ? `Looking for: ${data.lookingForText.trim()}` : "",
    data.futureGoals.trim() ? `Future goals: ${data.futureGoals.trim()}` : "",
  ].filter(Boolean);
  return sections.join("\n\n");
}

export function mapRegistrationToProfile(
  data: RegistrationData,
  photoUrls?: { profilePhotoUrl: string; galleryUrls: string[] }
): Partial<ProfileFormData> & Partial<Profile> {
  const phoneParts = splitPhoneValue(data.phone);
  const profilePhotoUrl = photoUrls?.profilePhotoUrl ?? "";
  const galleryUrls = photoUrls?.galleryUrls ?? [];

  return {
    full_name: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
    age: calculateAgeFromDob(data.dateOfBirth),
    gender: mapGender(data.gender),
    phone_country_code: phoneParts?.phone_country_code,
    phone_number: phoneParts?.phone_number,
    location: buildLocation(data),
    religion: mapReligion(data.religion),
    education: buildEducation(data),
    occupation: data.occupation.trim(),
    work_preference: mapWorkPreference(data.employment),
    relationship_goal: mapRelationshipGoal(data.relationshipGoal),
    bio: buildBio(data),
    lifestyle_tags: buildLifestyleTags(data),
    photo_url: profilePhotoUrl,
    photo_urls: galleryUrls,
    pref_age_min: data.prefAgeMin,
    pref_age_max: data.prefAgeMax,
    pref_gender: mapPrefGender(data.lookingFor),
    pref_location: "",
    pref_max_distance_km: mapDistanceKm(data.distancePreference),
    pref_relationship_goal: mapPrefRelationshipGoal(data.relationshipGoal),
    pref_values: buildPrefValues(data),
    pref_min_height: `${data.heightFeet}'${data.heightInches}"`,
    pref_occupation: data.occupation.trim(),
    is_onboarded: true,
  };
}

export function getRegistrationEmail(data: RegistrationData): string {
  return data.email.trim().toLowerCase();
}
