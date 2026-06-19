"use client";

import { cn } from "@/lib/utils";

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: readonly { value: string; label: string }[] | readonly string[];
}

export function SelectField({
  label,
  error,
  options,
  className,
  id,
  ...props
}: SelectFieldProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const normalized =
    typeof options[0] === "string"
      ? (options as readonly string[]).map((option) => ({ value: option, label: option }))
      : (options as readonly { value: string; label: string }[]);

  return (
    <div className="space-y-2">
      {label ? <label htmlFor={selectId} className="ml-1 block text-sm font-bold text-on-surface">{label}</label> : null}
      <select
        id={selectId}
        className={cn(
          "flex h-12 w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm text-on-surface shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 [color-scheme:dark]",
          className
        )}
        {...props}
      >
        <option value="">Select...</option>
        {normalized.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="ml-1 text-sm text-error">{error}</p> : null}
    </div>
  );
}
