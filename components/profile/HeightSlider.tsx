"use client";

import type { CSSProperties } from "react";
import { Label } from "@/components/ui/label";
import "@/components/dashboard/discovery-filters.css";

/** Height range in whole inches: 4'6" to 7'0". */
const MIN_IN = 54;
const MAX_IN = 84;
const DEFAULT_IN = 65;

const CM_PER_IN = 2.54;

/** Reads "168 cm", "5'6\"", "5 ft 6 in" or "5'6\" (168 cm)" into inches. */
export function parseHeightInches(value: string): number | null {
  const text = (value || "").trim();
  if (!text) return null;
  const cm = text.match(/(\d{2,3})\s*cm/i);
  if (cm) return Math.round(Number(cm[1]) / CM_PER_IN);
  const ftIn = text.match(/(\d)\s*(?:'|ft|feet)\s*(\d{1,2})?/i);
  if (ftIn) return Number(ftIn[1]) * 12 + Number(ftIn[2] ?? 0);
  return null;
}

export function formatHeight(inches: number): string {
  const ft = Math.floor(inches / 12);
  const inch = inches % 12;
  return `${ft}'${inch}" (${Math.round(inches * CM_PER_IN)} cm)`;
}

// Same slider look as the match page Distance filter.
const sliderVars = {
  "--dfs-fill": "rgba(118, 118, 128, 0.22)",
  "--dfs-accent": "var(--color-primary)",
  "--dfs-ease": "cubic-bezier(0.32, 0.72, 0, 1)",
} as CSSProperties;

interface HeightSliderProps {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  /** Label when no height is set. */
  emptyLabel?: string;
  /** Show a "Clear" link (off where height is required). */
  clearable?: boolean;
}

export function HeightSlider({
  label = "Height",
  value,
  onChange,
  emptyLabel = "Not set",
  clearable = true,
}: HeightSliderProps) {
  const parsed = parseHeightInches(value);
  const inches = Math.min(MAX_IN, Math.max(MIN_IN, parsed ?? DEFAULT_IN));
  const pct = ((inches - MIN_IN) / (MAX_IN - MIN_IN)) * 100;

  return (
    <div className="space-y-2" style={sliderVars}>
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-sm font-bold text-on-surface-variant">{label}</Label>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-on-surface">
            {parsed === null ? emptyLabel : formatHeight(inches)}
          </span>
          {clearable && parsed !== null ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>
      <div className="dfs-range">
        <div className="dfs-range-track" aria-hidden />
        <div
          className="dfs-range-fill"
          aria-hidden
          style={{ left: 0, width: parsed === null ? 0 : `${pct}%` }}
        />
        <input
          type="range"
          min={MIN_IN}
          max={MAX_IN}
          step={1}
          value={inches}
          onChange={(event) => onChange(formatHeight(Number(event.target.value)))}
          className="dfs-range-input"
          aria-label={label}
          aria-valuetext={parsed === null ? emptyLabel : formatHeight(inches)}
        />
      </div>
      <div className="flex justify-between text-xs text-on-surface-variant">
        <span>4&apos;6&quot;</span>
        <span>7&apos;0&quot;</span>
      </div>
    </div>
  );
}

const shortHeight = (inches: number) => `${Math.floor(inches / 12)}'${inches % 12}"`;

interface HeightRangeSliderProps {
  label?: string;
  /** Saved heights ("" = no limit on that side). */
  minValue: string;
  maxValue: string;
  onChange: (min: string, max: string) => void;
}

/**
 * Two-handle height range, same look as the match page Age filter. A handle
 * left at its end means "no limit" on that side and is saved as "".
 */
export function HeightRangeSlider({ label = "Height", minValue, maxValue, onChange }: HeightRangeSliderProps) {
  const min = Math.min(MAX_IN, Math.max(MIN_IN, parseHeightInches(minValue) ?? MIN_IN));
  const max = Math.min(MAX_IN, Math.max(min, parseHeightInches(maxValue) ?? MAX_IN));
  const span = MAX_IN - MIN_IN;
  const pct = (value: number) => ((value - MIN_IN) / span) * 100;
  // When both thumbs meet at the top end, the min thumb must sit on top to stay draggable.
  const minOnTop = min >= MAX_IN - 1;
  const anyHeight = min === MIN_IN && max === MAX_IN;

  const emit = (nextMin: number, nextMax: number) =>
    onChange(nextMin <= MIN_IN ? "" : formatHeight(nextMin), nextMax >= MAX_IN ? "" : formatHeight(nextMax));

  const summary = anyHeight
    ? "Any height"
    : `${min === MIN_IN ? `Under ${shortHeight(max)}` : max === MAX_IN ? `${shortHeight(min)}+` : `${shortHeight(min)} – ${shortHeight(max)}`}`;

  return (
    <div className="space-y-2" style={sliderVars}>
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-sm font-bold text-on-surface-variant">{label}</Label>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-on-surface">{summary}</span>
          {!anyHeight ? (
            <button
              type="button"
              onClick={() => onChange("", "")}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>
      <div className="dfs-range">
        <div className="dfs-range-track" aria-hidden />
        <div
          className="dfs-range-fill"
          aria-hidden
          style={{ left: `${pct(min)}%`, width: `${Math.max(0, pct(max) - pct(min))}%` }}
        />
        <input
          type="range"
          min={MIN_IN}
          max={MAX_IN}
          step={1}
          value={min}
          onChange={(event) => emit(Math.min(Number(event.target.value), max), max)}
          className="dfs-range-input"
          style={minOnTop ? { zIndex: 4 } : undefined}
          aria-label="Minimum height"
          aria-valuetext={formatHeight(min)}
        />
        <input
          type="range"
          min={MIN_IN}
          max={MAX_IN}
          step={1}
          value={max}
          onChange={(event) => emit(min, Math.max(Number(event.target.value), min))}
          className="dfs-range-input"
          aria-label="Maximum height"
          aria-valuetext={formatHeight(max)}
        />
      </div>
      <div className="flex justify-between text-xs text-on-surface-variant">
        <span>4&apos;6&quot;</span>
        <span>7&apos;0&quot;</span>
      </div>
    </div>
  );
}
