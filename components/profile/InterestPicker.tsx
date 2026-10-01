"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { INTEREST_GROUPS } from "@/lib/register/constants";
import { cn } from "@/lib/utils";

interface InterestPickerProps {
  label?: string;
  selected: string[];
  onChange: (next: string[]) => void;
  /** Text shown when nothing is picked, e.g. "Any" on preferences. */
  emptyHint?: string;
  /** Option groups; defaults to the interest catalogue. */
  groups?: ReadonlyArray<{ title: string; items: readonly string[] }>;
  searchPlaceholder?: string;
}

/** Grouped, searchable interest chips shared by the profile and preferences pages. */
export function InterestPicker({
  label = "Interests",
  selected,
  onChange,
  emptyHint = "None",
  groups: sourceGroups = INTEREST_GROUPS,
  searchPlaceholder = "Search interests",
}: InterestPickerProps) {
  const [query, setQuery] = useState("");
  const selectedKeys = useMemo(() => new Set(selected.map((s) => s.toLowerCase())), [selected]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sourceGroups.map((group) => ({
      title: group.title,
      items: group.items.filter((item) => !q || item.toLowerCase().includes(q)),
    })).filter((group) => group.items.length > 0);
  }, [query, sourceGroups]);

  const toggle = (item: string) => {
    const key = item.toLowerCase();
    onChange(
      selectedKeys.has(key) ? selected.filter((s) => s.toLowerCase() !== key) : [...selected, item]
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-sm font-bold text-on-surface-variant">{label}</Label>
        <span className="text-xs text-on-surface-variant">
          {selected.length ? `${selected.length} selected` : emptyHint}
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-secondary/50 px-3 focus-within:border-primary/40">
        <span className="material-symbols-outlined text-lg text-on-surface-variant">search</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-transparent py-2.5 text-sm text-on-surface outline-none"
        />
      </div>

      <div className="max-h-96 space-y-4 overflow-y-auto pr-1" data-lenis-prevent>
        {groups.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No matches for &ldquo;{query}&rdquo;.</p>
        ) : (
          groups.map((group) => (
            <div key={group.title} className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {group.title}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => {
                  const active = selectedKeys.has(item.toLowerCase());
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(item)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-outline-variant/40 bg-surface text-on-surface hover:border-primary/50"
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
