"use client";

import { useState } from "react";
import api from "@/lib/api";

export type WritingField = "bio" | "looking_for" | "future_goals";

/** Only the profile facts the writer uses are sent (no phone, email, etc.). */
const DRAFT_KEYS = [
  "full_name", "age", "location", "occupation", "company", "education", "fieldOfStudy",
  "work_preference", "relationship_goal", "lifestyleTagsText", "languages",
  "pref_age_min", "pref_age_max", "pref_relationship_goal",
] as const;

function pickDraft(draft: object): Record<string, unknown> {
  const src = draft as Record<string, unknown>;
  return Object.fromEntries(DRAFT_KEYS.map((k) => [k, src[k]]));
}

/**
 * "Write with Duo AI" helper under an About textarea. Suggestions come from
 * Duo's own writing assistant, built from the current (unsaved) form values.
 */
export function WritingSuggestions({
  field,
  draft,
  onPick,
}: {
  field: WritingField;
  draft: object;
  onPick: (text: string) => void;
}) {
  const [items, setItems] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [variant, setVariant] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [basedOn, setBasedOn] = useState<string[]>([]);

  const load = async (nextVariant: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getWritingSuggestions(field, pickDraft(draft), nextVariant);
      setItems(res.suggestions);
      setBasedOn(res.based_on ?? []);
      setVariant(nextVariant);
    } catch {
      setError("Couldn't get suggestions right now.");
    } finally {
      setLoading(false);
    }
  };

  if (!items) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void load(0)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>
            {loading ? "progress_activity" : "auto_fix_high"}
          </span>
          {loading ? "Writing…" : "Write with Duo AI"}
        </button>
        {error ? <span className="text-xs text-error">{error}</span> : null}
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-primary">auto_fix_high</span>
        <p className="flex-1 text-xs font-semibold text-on-surface">
          Duo AI suggestions
          {basedOn.length ? (
            <span className="font-normal text-on-surface-variant"> · based on your {basedOn.join(", ")}</span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={() => setItems(null)}
          aria-label="Hide suggestions"
          className="rounded-full p-1 text-on-surface-variant hover:bg-secondary"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      <div className="space-y-2">
        {items.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onPick(text)}
            className="group flex w-full items-start gap-2 rounded-xl bg-background/80 p-3 text-left text-sm leading-relaxed text-on-surface transition-colors hover:bg-background"
          >
            <span className="flex-1">{text}</span>
            <span className="mt-0.5 shrink-0 text-xs font-semibold text-primary opacity-70 group-hover:opacity-100">
              Use
            </span>
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-on-surface-variant">Pick one, then edit it to sound like you.</p>
        <button
          type="button"
          onClick={() => void load(variant + 1)}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[15px] ${loading ? "animate-spin" : ""}`}>refresh</span>
          More ideas
        </button>
      </div>
    </div>
  );
}
