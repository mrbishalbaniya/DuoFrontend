"use client";

import type { ProfileChecklistItem } from "@/types";
import { cn } from "@/lib/utils";

const SECTION_ICONS: Record<string, string> = {
  Photos: "photo_library",
  Personal: "person",
  "Religion & Background": "temple_hindu",
  "Education & Career": "school",
  "Lifestyle & Interests": "style",
  About: "format_quote",
  Verification: "verified_user",
};

interface ProfileChecklistProps {
  items: ProfileChecklistItem[];
  /** Opens the editor (or page) for a section with missing items. */
  onOpenSection: (section: string) => void;
}

/** Completeness checklist grouped by profile section, built from real profile data. */
export function ProfileChecklist({ items, onOpenSection }: ProfileChecklistProps) {
  const sections: { name: string; items: ProfileChecklistItem[] }[] = [];
  for (const item of items) {
    const group = sections.find((entry) => entry.name === item.section);
    if (group) group.items.push(item);
    else sections.push({ name: item.section, items: [item] });
  }

  if (!sections.length) return null;

  return (
    <ul className="space-y-2">
      {sections.map((section) => {
        const done = section.items.filter((item) => item.done).length;
        const complete = done === section.items.length;
        const missing = section.items.filter((item) => !item.done).map((item) => item.label);
        return (
          <li key={section.name}>
            <button
              type="button"
              onClick={() => onOpenSection(section.name)}
              disabled={complete}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors",
                complete ? "cursor-default" : "hover:bg-secondary/60"
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-lg",
                  complete ? "text-accent" : "text-primary/40"
                )}
                style={complete ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {complete ? "check_circle" : SECTION_ICONS[section.name] ?? "add_circle"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-on-surface">{section.name}</span>
                {!complete ? (
                  <span className="block truncate text-xs text-on-surface-variant">
                    Add {missing.join(", ").toLowerCase()}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "shrink-0 text-xs font-bold",
                  complete ? "text-accent" : "text-on-surface-variant"
                )}
              >
                {done}/{section.items.length}
              </span>
              {!complete ? (
                <span className="material-symbols-outlined shrink-0 text-base text-on-surface-variant">
                  chevron_right
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
