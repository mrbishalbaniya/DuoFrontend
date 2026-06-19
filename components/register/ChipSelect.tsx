"use client";

import { cn } from "@/lib/utils";

interface ChipSelectProps<T extends string> {
  label?: string;
  value: T | "";
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  error?: string;
  columns?: 2 | 3;
}

export function ChipSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
  columns = 2,
}: ChipSelectProps<T>) {
  return (
    <div className="space-y-3">
      {label ? <p className="ml-1 text-sm font-bold text-on-surface">{label}</p> : null}
      <div
        className={cn(
          "grid gap-2",
          columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
        )}
      >
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98]",
                active
                  ? "gradient-brand text-white shadow-lg shadow-primary/20"
                  : "bg-surface-variant text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error ? <p className="ml-1 text-sm text-error">{error}</p> : null}
    </div>
  );
}

interface MultiChipSelectProps {
  label?: string;
  values: string[];
  options: readonly string[];
  onChange: (values: string[]) => void;
  min?: number;
  error?: string;
}

export function MultiChipSelect({
  label,
  values,
  options,
  onChange,
  min = 0,
  error,
}: MultiChipSelectProps) {
  const toggle = (option: string) => {
    if (values.includes(option)) {
      onChange(values.filter((value) => value !== option));
      return;
    }
    onChange([...values, option]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        {label ? <p className="ml-1 text-sm font-bold text-on-surface">{label}</p> : null}
        {min > 0 ? (
          <p className="text-xs font-medium text-on-surface-variant">
            {values.length}/{min} minimum
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95",
                active
                  ? "bg-primary-container text-white shadow-sm"
                  : "bg-surface-variant text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error ? <p className="ml-1 text-sm text-error">{error}</p> : null}
    </div>
  );
}
