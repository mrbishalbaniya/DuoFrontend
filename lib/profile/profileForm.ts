import api from "@/lib/api";
import { getPhotoUploadError } from "@/lib/photos/validatePhotoUpload";
import { parsePrefValues, type ParsedPrefValues } from "@/lib/profile/formatProfile";
import type { PhotoAnalysis, Profile } from "@/types";

export type ProfileEditPhoto = {
  id: string;
  url: string;
  fileName: string;
  isProfile: boolean;
  file?: File;
  analysis?: PhotoAnalysis;
};

export type ProfileEditFormData = {
  full_name: string;
  age: string;
  phone_country_code: string;
  phone_number: string;
  gender: string;
  location: string;
  bio: string;
  religion: string;
  education: string;
  occupation: string;
  work_preference: string;
  relationship_goal: string;
  lifestyleTagsText: string;
  height: string;
  company: string;
  monthlyIncome: string;
  educationLevel: string;
  fieldOfStudy: string;
  caste: string;
  gotra: string;
  horoscope: string;
  birthTime: string;
  birthPlace: string;
  lookingForText: string;
  futureGoals: string;
  pref_gender: string;
  pref_age_min: number;
  pref_age_max: number;
  pref_min_height: string;
  pref_occupation: string;
  pref_location: string;
  pref_max_distance_km: number;
  pref_relationship_goal: string;
  pref_verified_only: boolean;
  preferredReligion: string;
  interCaste: string;
  interReligion: string;
  photos: ProfileEditPhoto[];
};

function buildPhotosFromProfile(profile: Profile): ProfileEditPhoto[] {
  const urls: string[] = [];
  if (profile.photo_url) urls.push(profile.photo_url);
  (profile.photo_urls ?? []).forEach((url) => {
    if (url && !urls.includes(url)) urls.push(url);
  });

  return urls.map((url, index) => ({
    id: `photo-${index}`,
    url,
    fileName: `photo-${index + 1}.jpg`,
    isProfile: url === profile.photo_url || (index === 0 && !profile.photo_url),
  }));
}

export function profileToEditForm(profile: Profile): ProfileEditFormData {
  const extra = parsePrefValues(profile.pref_values);

  return {
    full_name: profile.full_name || "",
    age: profile.age != null ? String(profile.age) : "",
    phone_country_code: profile.phone_country_code || "+977",
    phone_number: profile.phone_number || "",
    gender: profile.gender || "",
    location: profile.location || "",
    bio: profile.bio || "",
    religion: profile.religion || "",
    education: profile.education || "",
    occupation: profile.occupation || "",
    work_preference: profile.work_preference || "",
    relationship_goal: profile.relationship_goal || "",
    lifestyleTagsText: (profile.lifestyle_tags ?? []).join(", "),
    height: extra.height || "",
    company: extra.company || "",
    monthlyIncome: extra.monthlyIncome || "",
    educationLevel: extra.educationLevel || "",
    fieldOfStudy: extra.fieldOfStudy || "",
    caste: extra.caste || "",
    gotra: extra.gotra || "",
    horoscope: extra.horoscope || "",
    birthTime: extra.birthTime || "",
    birthPlace: extra.birthPlace || "",
    lookingForText: extra.lookingForText || "",
    futureGoals: extra.futureGoals || "",
    pref_gender: profile.pref_gender || "everyone",
    pref_age_min: profile.pref_age_min ?? 22,
    pref_age_max: profile.pref_age_max ?? 35,
    pref_min_height: profile.pref_min_height || "",
    pref_occupation: profile.pref_occupation || "",
    pref_location: profile.pref_location || "",
    pref_max_distance_km: profile.pref_max_distance_km ?? 50,
    pref_relationship_goal: profile.pref_relationship_goal || "everyone",
    pref_verified_only: profile.pref_verified_only ?? false,
    preferredReligion: extra.preferredReligion || "",
    interCaste: extra.interCaste || "",
    interReligion: extra.interReligion || "",
    photos: buildPhotosFromProfile(profile),
  };
}

function buildPrefValues(form: ProfileEditFormData, existing?: ParsedPrefValues): string {
  return JSON.stringify({
    ...(existing ?? {}),
    height: form.height.trim(),
    company: form.company.trim(),
    monthlyIncome: form.monthlyIncome.trim(),
    educationLevel: form.educationLevel.trim(),
    fieldOfStudy: form.fieldOfStudy.trim(),
    caste: form.caste.trim(),
    gotra: form.gotra.trim(),
    horoscope: form.horoscope.trim(),
    birthTime: form.birthTime.trim(),
    birthPlace: form.birthPlace.trim(),
    lookingForText: form.lookingForText.trim(),
    futureGoals: form.futureGoals.trim(),
    preferredReligion: form.preferredReligion.trim(),
    interCaste: form.interCaste.trim(),
    interReligion: form.interReligion.trim(),
  });
}

export async function resolveProfilePhotoUrls(photos: ProfileEditPhoto[]): Promise<{
  photo_url: string;
  photo_urls: string[];
}> {
  if (!photos.length) {
    return { photo_url: "", photo_urls: [] };
  }

  const profilePhoto = photos.find((photo) => photo.isProfile) ?? photos[0];
  let photo_url = "";
  const photo_urls: string[] = [];

  for (const photo of photos) {
    let url = photo.url;
    if (photo.file) {
      const isPrimary = photo.id === profilePhoto.id;
      const result = await api.uploadAndAnalyzePhoto(photo.file, { isPrimary });
      const uploadError = getPhotoUploadError(result, photo.fileName);
      if (uploadError) {
        throw new Error(uploadError);
      }
      url = result.image_url!;
    }
    if (photo.id === profilePhoto.id) {
      photo_url = url;
    } else if (url) {
      photo_urls.push(url);
    }
  }

  return { photo_url, photo_urls };
}

export async function editFormToUpdatePayload(
  form: ProfileEditFormData,
  existingProfile?: Profile
): Promise<Partial<Profile>> {
  const existingExtra = parsePrefValues(existingProfile?.pref_values);
  const photos = await resolveProfilePhotoUrls(form.photos);
  const parsedAge = Number(form.age);

  return {
    full_name: form.full_name.trim(),
    age: Number.isFinite(parsedAge) ? parsedAge : null,
    phone_country_code: form.phone_country_code.trim(),
    phone_number: form.phone_number.trim(),
    gender: form.gender,
    location: form.location.trim(),
    bio: form.bio.trim(),
    religion: form.religion,
    education: form.education.trim(),
    occupation: form.occupation.trim(),
    work_preference: form.work_preference,
    relationship_goal: form.relationship_goal as Profile["relationship_goal"],
    lifestyle_tags: form.lifestyleTagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    pref_gender: form.pref_gender as Profile["pref_gender"],
    pref_age_min: form.pref_age_min,
    pref_age_max: form.pref_age_max,
    pref_min_height: form.pref_min_height.trim(),
    pref_occupation: form.pref_occupation.trim(),
    pref_location: form.pref_location.trim(),
    pref_max_distance_km: form.pref_max_distance_km,
    pref_relationship_goal: form.pref_relationship_goal as Profile["pref_relationship_goal"],
    pref_verified_only: form.pref_verified_only,
    pref_values: buildPrefValues(form, existingExtra),
    photo_url: photos.photo_url,
    photo_urls: photos.photo_urls,
    is_onboarded: true,
  };
}
