import type { Profile } from "@/types";
import { parsePrefValues } from "@/lib/profile/formatProfile";
import {
  ALL_INTEREST_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  EXERCISE_OPTIONS,
  FIELD_OF_STUDY_OPTIONS,
  FREQUENCY_OPTIONS,
  LIFESTYLE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  PERSONALITY_OPTIONS,
  RASHI_OPTIONS,
  WORK_PREFERENCE_OPTIONS,
} from "@/lib/register/constants";

/**
 * What another person sees on a profile, modelled on public profiles of dating
 * apps (Hinge, Bumble: vitals, prompts, habits, interests) and matrimonial sites
 * (Shaadi, Jeevansathi: basic details, religion & community, education & career).
 * Private details (contact info, exact birth date/time/place, gotra, income,
 * partner preferences) are never sent by the backend for other people.
 */

export type PublicRow = { label: string; value: string; icon: string };
export type PublicSection = { title: string; rows: PublicRow[] };

type Option = { readonly value: string; readonly label: string };

const labelFor = (options: readonly Option[], value?: string) => {
  if (!value) return "";
  const match = options.find((o) => o.value.toLowerCase() === value.toLowerCase());
  return match ? match.label : value.replace(/_/g, " ");
};

const RELATIONSHIP_GOALS: Record<string, string> = {
  serious: "Long-term relationship",
  casual: "Something casual",
  dating: "Dating",
  marriage: "Marriage",
  friendship: "Friendship",
};

const PERSONALITY_SET = new Set(PERSONALITY_OPTIONS.map((o) => o.value));
const LIFESTYLE_SET = new Set(LIFESTYLE_OPTIONS.map((o) => o.value));
const INTEREST_LOOKUP = new Map(ALL_INTEREST_OPTIONS.map((i) => [i.toLowerCase(), i]));

function prefixed(tags: string[], prefix: string): string[] {
  return tags.filter((t) => t.startsWith(`${prefix}:`)).map((t) => t.slice(prefix.length + 1));
}

export function buildPublicProfile(profile: Profile) {
  const extra = parsePrefValues(profile.pref_values);
  const tags = (Array.isArray(profile.lifestyle_tags) ? profile.lifestyle_tags : [])
    .map((t) => String(t).trim())
    .filter(Boolean);
  const lower = tags.map((t) => t.toLowerCase());

  const personality = lower.find((t) => PERSONALITY_SET.has(t as never));
  const lifestyle = lower.find((t) => LIFESTYLE_SET.has(t as never));
  const smoking = prefixed(lower, "smoking")[0];
  const drinking = prefixed(lower, "drinking")[0];
  const exercise = prefixed(lower, "exercise");
  const marital = prefixed(lower, "marital")[0];
  const interests = tags
    .filter((t) => !t.includes(":") && !PERSONALITY_SET.has(t.toLowerCase() as never) && !LIFESTYLE_SET.has(t.toLowerCase() as never))
    .map((t) => INTEREST_LOOKUP.get(t.toLowerCase()) ?? t);

  const heightMatch = (extra.height || "").match(/\d'\s*\d{1,2}"?|\d{2,3}\s*cm/i);
  const languages = Array.isArray(extra.languages) ? extra.languages : [];

  const sections: PublicSection[] = [
    {
      title: "Basics",
      rows: [
        { label: "Height", value: heightMatch ? heightMatch[0] : extra.height || "", icon: "height" },
        { label: "Marital status", value: labelFor(MARITAL_STATUS_OPTIONS, marital), icon: "diversity_1" },
        {
          label: "Looking for",
          value: profile.relationship_goal ? RELATIONSHIP_GOALS[profile.relationship_goal] ?? profile.relationship_goal : "",
          icon: "favorite",
        },
        { label: "Languages", value: languages.join(", "), icon: "translate" },
      ],
    },
    {
      title: "Religion & Background",
      rows: [
        { label: "Religion", value: profile.religion || "", icon: "temple_hindu" },
        { label: "Community", value: extra.caste || "", icon: "groups" },
        { label: "Horoscope", value: labelFor(RASHI_OPTIONS, extra.horoscope), icon: "brightness_7" },
      ],
    },
    {
      title: "Education & Career",
      rows: [
        { label: "Education", value: labelFor(EDUCATION_LEVEL_OPTIONS, extra.educationLevel), icon: "school" },
        { label: "Field of study", value: labelFor(FIELD_OF_STUDY_OPTIONS, extra.fieldOfStudy), icon: "menu_book" },
        { label: "Occupation", value: profile.occupation || "", icon: "work" },
        { label: "Company", value: extra.company || "", icon: "apartment" },
        { label: "Works in", value: labelFor(WORK_PREFERENCE_OPTIONS, profile.work_preference), icon: "business_center" },
      ],
    },
    {
      title: "Lifestyle",
      rows: [
        { label: "Personality", value: labelFor(PERSONALITY_OPTIONS, personality), icon: "psychology" },
        { label: "Lifestyle", value: labelFor(LIFESTYLE_OPTIONS, lifestyle), icon: "self_improvement" },
        { label: "Smoking", value: labelFor(FREQUENCY_OPTIONS, smoking), icon: "smoke_free" },
        { label: "Drinking", value: labelFor(FREQUENCY_OPTIONS, drinking), icon: "local_bar" },
        {
          label: "Exercise",
          value: exercise.map((e) => labelFor(EXERCISE_OPTIONS, e)).join(", "),
          icon: "fitness_center",
        },
      ],
    },
  ]
    .map((section) => ({ ...section, rows: section.rows.filter((row) => row.value) }))
    .filter((section) => section.rows.length > 0);

  return {
    bio: (profile.bio || "").trim(),
    lookingFor: (extra.lookingForText || "").trim(),
    futureGoals: (extra.futureGoals || "").trim(),
    sections,
    interests,
  };
}
