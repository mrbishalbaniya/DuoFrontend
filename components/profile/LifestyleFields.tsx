"use client";

import { SelectField } from "@/components/ui/select-field";
import { InterestPicker } from "@/components/profile/InterestPicker";
import { ChipSelect } from "@/components/profile/PartnerPreferencesFields";
import {
  EXERCISE_OPTIONS,
  FREQUENCY_OPTIONS,
  ALL_INTEREST_OPTIONS,
  LIFESTYLE_OPTIONS,
  PERSONALITY_OPTIONS,
} from "@/lib/register/constants";
import { cn } from "@/lib/utils";

/**
 * The person's own lifestyle, stored in `lifestyle_tags` using the same format
 * as registration: bare personality / lifestyle / interest values plus
 * `smoking:x`, `drinking:x`, `exercise:x`. Any other tags are kept as-is.
 */

type Option = { value: string; label: string };

const INTEREST_CHOICES: Option[] = ALL_INTEREST_OPTIONS.map((i) => ({ value: i, label: i }));

const BARE_GROUPS = {
  personality: PERSONALITY_OPTIONS as readonly Option[],
  lifestyle: LIFESTYLE_OPTIONS as readonly Option[],
  interests: INTEREST_CHOICES,
};
const PREFIX_GROUPS = {
  smoking: FREQUENCY_OPTIONS as readonly Option[],
  drinking: FREQUENCY_OPTIONS as readonly Option[],
  exercise: EXERCISE_OPTIONS as readonly Option[],
};
type BareKey = keyof typeof BARE_GROUPS;
type PrefixKey = keyof typeof PREFIX_GROUPS;
type GroupKey = BareKey | PrefixKey;

export function parseTags(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(",")
    .map((t) => t.trim())
    .filter((t) => {
      const key = t.toLowerCase();
      if (!t || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function bareMatch(tag: string, key: BareKey): string | null {
  const hit = BARE_GROUPS[key].find((o) => o.value.toLowerCase() === tag.toLowerCase());
  return hit ? hit.value : null;
}

function prefixMatch(tag: string, key: PrefixKey): string | null {
  const lower = tag.toLowerCase();
  if (!lower.startsWith(`${key}:`)) return null;
  const value = lower.slice(key.length + 1);
  return PREFIX_GROUPS[key].some((o) => o.value === value) ? value : null;
}

function groupOf(tag: string): GroupKey | null {
  for (const key of Object.keys(PREFIX_GROUPS) as PrefixKey[]) if (prefixMatch(tag, key)) return key;
  for (const key of Object.keys(BARE_GROUPS) as BareKey[]) if (bareMatch(tag, key)) return key;
  return null;
}

function selectedIn(tags: string[], key: GroupKey): string[] {
  return tags
    .map((t) =>
      key in PREFIX_GROUPS ? prefixMatch(t, key as PrefixKey) : bareMatch(t, key as BareKey)
    )
    .filter((v): v is string => Boolean(v));
}

/** Human-readable label for a stored tag, e.g. "smoking:no" -> "Smoking: No". */
export function formatLifestyleTag(tag: string): string {
  for (const key of Object.keys(PREFIX_GROUPS) as PrefixKey[]) {
    const value = prefixMatch(tag, key);
    if (value) {
      const label = PREFIX_GROUPS[key].find((o) => o.value === value)?.label ?? value;
      return `${key[0].toUpperCase()}${key.slice(1)}: ${label}`;
    }
  }
  for (const key of Object.keys(BARE_GROUPS) as BareKey[]) {
    const value = bareMatch(tag, key);
    if (value) return BARE_GROUPS[key].find((o) => o.value === value)?.label ?? value;
  }
  const [prefix, rest] = tag.split(":");
  if (rest) return `${prefix[0].toUpperCase()}${prefix.slice(1)}: ${rest.replace(/_/g, " ")}`;
  return tag;
}

interface LifestyleFieldsProps {
  value: string;
  onChange: (next: string) => void;
  inputClassName?: string;
}

export function LifestyleFields({ value, onChange }: LifestyleFieldsProps) {
  const tags = parseTags(value);

  const setGroup = (key: GroupKey, next: string[]) => {
    const kept = tags.filter((t) => groupOf(t) !== key);
    const added = key in PREFIX_GROUPS ? next.map((v) => `${key}:${v}`) : next;
    onChange([...kept, ...added].join(", "));
  };


  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField
          label="Personality"
          options={[{ value: "", label: "Not set" }, ...BARE_GROUPS.personality]}
          value={selectedIn(tags, "personality")[0] ?? ""}
          hidePlaceholderOption
          onChange={(event) => setGroup("personality", event.target.value ? [event.target.value] : [])}
        />
        <SelectField
          label="Lifestyle"
          options={[{ value: "", label: "Not set" }, ...BARE_GROUPS.lifestyle]}
          value={selectedIn(tags, "lifestyle")[0] ?? ""}
          hidePlaceholderOption
          onChange={(event) => setGroup("lifestyle", event.target.value ? [event.target.value] : [])}
        />
        <SelectField
          label="Smoking"
          options={[{ value: "", label: "Not set" }, ...PREFIX_GROUPS.smoking]}
          value={selectedIn(tags, "smoking")[0] ?? ""}
          hidePlaceholderOption
          onChange={(event) => setGroup("smoking", event.target.value ? [event.target.value] : [])}
        />
        <SelectField
          label="Drinking"
          options={[{ value: "", label: "Not set" }, ...PREFIX_GROUPS.drinking]}
          value={selectedIn(tags, "drinking")[0] ?? ""}
          hidePlaceholderOption
          onChange={(event) => setGroup("drinking", event.target.value ? [event.target.value] : [])}
        />
      </div>
      <ChipSelect
        label="Exercise"
        options={PREFIX_GROUPS.exercise}
        selected={selectedIn(tags, "exercise")}
        onChange={(next) => setGroup("exercise", next)}
        emptyHint="None"
      />
      <InterestPicker
        selected={selectedIn(tags, "interests")}
        onChange={(next) => setGroup("interests", next)}
      />
    </div>
  );
}
