"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import {
  EDUCATION_LEVEL_OPTIONS,
  EXERCISE_OPTIONS,
  FIELD_OF_STUDY_OPTIONS,
  FREQUENCY_OPTIONS,
  INCOME_OPTIONS,
  LANGUAGE_GROUPS,
  OCCUPATION_PREF_OPTIONS,
  LIFESTYLE_OPTIONS,
  PERSONALITY_OPTIONS,
  RASHI_OPTIONS,
  RELIGION_OPTIONS,
  WORK_PREFERENCE_OPTIONS,
} from "@/lib/register/constants";
import type { ProfileEditFormData } from "@/lib/profile/profileForm";
import { casteLabelFor, casteOptionsFor } from "@/lib/profile/religionBackground";
import { cn } from "@/lib/utils";
import { InterestPicker } from "@/components/profile/InterestPicker";
import { HeightRangeSlider } from "@/components/profile/HeightSlider";

/**
 * Partner Preferences fields, shared by Edit Profile and the dedicated
 * /preferences page so both stay identical.
 */

const ANY = "__any";
const SAME = "__same";

const inputClassName =
  "w-full rounded-xl border border-outline-variant/30 bg-secondary/50 px-4 py-3 outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/25";

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-bold text-on-surface-variant">{label}</Label>
      {children}
    </div>
  );
}


type Option = { value: string; label: string };

function PrefSection({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <section className="space-y-5 rounded-2xl border border-outline-variant/20 bg-secondary/20 p-5 sm:p-6">
      <h3 className="flex items-center gap-2 font-[var(--font-headline)] text-lg font-bold text-on-surface">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Tappable chips. Nothing selected means "any". */
export function ChipSelect({
  label,
  options,
  selected,
  onChange,
  single = false,
  emptyHint = "Any",
}: {
  label: string;
  options: readonly Option[];
  selected: string[];
  onChange: (next: string[]) => void;
  single?: boolean;
  /** Text shown when nothing is selected. */
  emptyHint?: string;
}) {
  const toggle = (value: string) => {
    if (single) {
      onChange(selected.includes(value) ? [] : [value]);
      return;
    }
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-sm font-bold text-on-surface-variant">{label}</Label>
        <span className="text-xs text-on-surface-variant">
          {selected.length ? `${selected.length} selected` : emptyHint}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-white"
                  : "border-outline-variant/40 bg-surface text-on-surface hover:border-primary/50"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}


// Keep a previously saved value visible even if it's outside today's list.
const withSaved = (list: string[], saved: string) =>
  saved && !list.includes(saved) ? [saved, ...list] : list;

interface PartnerPreferencesFieldsProps {
  formData: ProfileEditFormData;
  patch: (data: Partial<ProfileEditFormData>) => void;
}

export function PartnerPreferencesFields({ formData, patch }: PartnerPreferencesFieldsProps) {
  // Partner Preferences: one dropdown each for religion and caste. The
  // "any"/"same" choices are the old inter-religion/inter-caste answers
  // (saved as "yes"/"no"), specific picks narrow to one religion or caste.
  const ownReligionKey = RELIGION_OPTIONS.find(
    (option) => option.label === formData.religion || option.value === formData.religion
  )?.value;
  const prefReligionValue =
    formData.preferredReligion || (formData.interReligion === "no" ? SAME : ANY);
  const prefReligionOptions = [
    { value: ANY, label: "Any religion (open to inter-religion)" },
    { value: SAME, label: "Same religion as mine" },
    ...RELIGION_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  ];
  // Caste list follows the preferred religion: a specific religion shows its
  // castes, "same as mine" uses my religion, "any" shows every caste.
  const prefCasteList: string[] = formData.preferredReligion
    ? casteOptionsFor(formData.preferredReligion)
    : prefReligionValue === SAME
      ? casteOptionsFor(formData.religion)
      : casteOptionsFor("other");
  const prefCasteValue = formData.preferredCaste || (formData.interCaste === "no" ? SAME : ANY);
  const prefCasteOptions = [
    { value: ANY, label: "Any caste (open to inter-caste)" },
    { value: SAME, label: "Same caste as mine" },
    ...withSaved(prefCasteList, formData.preferredCaste).map((caste) => ({ value: caste, label: caste })),
  ];
  const onPrefReligionChange = (value: string) => {
    const preferredReligion = value === ANY || value === SAME ? "" : value;
    const interReligion =
      value === SAME || (preferredReligion && preferredReligion === ownReligionKey) ? "no" : "yes";
    const castes = preferredReligion
      ? casteOptionsFor(preferredReligion)
      : value === SAME
        ? casteOptionsFor(formData.religion)
        : casteOptionsFor("other");
    const keepCaste = castes.length > 0 && (!formData.preferredCaste || castes.includes(formData.preferredCaste));
    patch({
      preferredReligion,
      interReligion,
      preferredCaste: keepCaste ? formData.preferredCaste : "",
      interCaste: castes.length ? formData.interCaste : "",
    });
  };
  const onPrefCasteChange = (value: string) => {
    const preferredCaste = value === ANY || value === SAME ? "" : value;
    const interCaste = value === SAME || (preferredCaste && preferredCaste === formData.caste) ? "no" : "yes";
    patch({ preferredCaste, interCaste });
  };

  return (
    <div className="space-y-6">
      <PrefSection title="Religion & Background" icon="temple_hindu">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Preferred religion"
            options={prefReligionOptions}
            value={prefReligionValue}
            hidePlaceholderOption
            onChange={(event) => onPrefReligionChange(event.target.value)}
          />
          {prefCasteList.length ? (
          <SelectField
            label={
              casteLabelFor(formData.preferredReligion || formData.religion) === "Community"
                ? "Preferred community"
                : "Preferred caste"
            }
            options={prefCasteOptions}
            value={prefCasteValue}
            hidePlaceholderOption
            onChange={(event) => onPrefCasteChange(event.target.value)}
          />
          ) : null}
          <SelectField
            label="Preferred horoscope (Rashi)"
            options={[{ value: "", label: "Any rashi" }, ...RASHI_OPTIONS.filter((o) => o.value !== "unknown")]}
            value={formData.preferredRashi}
            hidePlaceholderOption
            onChange={(event) => patch({ preferredRashi: event.target.value })}
          />
        </div>
        <HeightRangeSlider
          minValue={formData.pref_min_height}
          maxValue={formData.preferredMaxHeight}
          onChange={(min, max) => patch({ pref_min_height: min, preferredMaxHeight: max })}
        />
        <InterestPicker
          label="Languages"
          groups={LANGUAGE_GROUPS}
          searchPlaceholder="Search languages"
          selected={formData.preferredLanguages}
          onChange={(next) => patch({ preferredLanguages: next })}
          emptyHint="Any"
        />
      </PrefSection>

      <PrefSection title="Education & Career" icon="school">
        <ChipSelect
          label="Education level"
          options={EDUCATION_LEVEL_OPTIONS}
          selected={formData.preferredEducationLevels}
          onChange={(next) => patch({ preferredEducationLevels: next })}
        />
        <ChipSelect
          label="Field of study"
          options={FIELD_OF_STUDY_OPTIONS}
          selected={formData.preferredFieldsOfStudy}
          onChange={(next) => patch({ preferredFieldsOfStudy: next })}
        />
        <ChipSelect
          label="Work"
          options={WORK_PREFERENCE_OPTIONS}
          selected={formData.preferredWorkPreferences}
          onChange={(next) => patch({ preferredWorkPreferences: next })}
        />
        <SelectField
          label="Monthly income"
          options={[{ value: "", label: "Any income" }, ...INCOME_OPTIONS]}
          value={formData.preferredIncomes[0] ?? ""}
          hidePlaceholderOption
          onChange={(event) =>
            patch({ preferredIncomes: event.target.value ? [event.target.value] : [] })
          }
        />
        <ChipSelect
          label="Occupation"
          options={OCCUPATION_PREF_OPTIONS}
          selected={formData.preferredOccupations}
          onChange={(next) =>
            // The chips replace the old free-text field, so clear it to stop
            // a hidden value from still affecting matches.
            patch({ preferredOccupations: next, pref_occupation: "" })
          }
        />
      </PrefSection>

      <PrefSection title="Lifestyle & Interests" icon="style">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Personality"
            options={[{ value: "", label: "Any" }, ...PERSONALITY_OPTIONS]}
            value={formData.preferredPersonalities[0] ?? ""}
            hidePlaceholderOption
            onChange={(event) =>
              patch({ preferredPersonalities: event.target.value ? [event.target.value] : [] })
            }
          />
          <SelectField
            label="Lifestyle"
            options={[{ value: "", label: "Any" }, ...LIFESTYLE_OPTIONS]}
            value={formData.preferredLifestyles[0] ?? ""}
            hidePlaceholderOption
            onChange={(event) =>
              patch({ preferredLifestyles: event.target.value ? [event.target.value] : [] })
            }
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Smoking"
            options={[{ value: "", label: "Any" }, ...FREQUENCY_OPTIONS]}
            value={formData.preferredSmoking}
            hidePlaceholderOption
            onChange={(event) => patch({ preferredSmoking: event.target.value })}
          />
          <SelectField
            label="Drinking"
            options={[{ value: "", label: "Any" }, ...FREQUENCY_OPTIONS]}
            value={formData.preferredDrinking}
            hidePlaceholderOption
            onChange={(event) => patch({ preferredDrinking: event.target.value })}
          />
        </div>
        <ChipSelect
          label="Exercise"
          options={EXERCISE_OPTIONS}
          selected={formData.preferredExercise}
          onChange={(next) => patch({ preferredExercise: next })}
        />
        <InterestPicker
          selected={formData.preferredInterests}
          onChange={(next) => patch({ preferredInterests: next })}
          emptyHint="Any"
        />
      </PrefSection>

      </div>
  );
}
