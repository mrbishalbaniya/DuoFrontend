"use client";

import { Fragment } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { cn } from "@/lib/utils";

interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label?: string;
  error?: string;
  options: readonly SelectFieldOption[] | readonly string[];
  value?: string;
  /** Shaped like a native change event so existing `event.target.value`
   * call sites keep working unchanged. */
  onChange?: (event: { target: { value: string } }) => void;
  placeholder?: string;
  /** Set true when `options` already includes its own "no selection" /
   * default entry (e.g. an "All methods" filter option) so a second,
   * redundant blank row isn't added above it. */
  hidePlaceholderOption?: boolean;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export function SelectField({
  label,
  error,
  options,
  value = "",
  onChange,
  placeholder = "Select...",
  hidePlaceholderOption = false,
  className,
  id,
  name,
  disabled,
}: SelectFieldProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const normalized: readonly SelectFieldOption[] =
    typeof options[0] === "string"
      ? (options as readonly string[]).map((option) => ({ value: option, label: option }))
      : (options as readonly SelectFieldOption[]);

  const selected = normalized.find((option) => option.value === value);

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={selectId} className="ml-1 block text-sm font-bold text-on-surface">
          {label}
        </label>
      ) : null}
      {/* A native <select>'s open dropdown is rendered by the OS/browser
          shell, not the page — it can't be restyled to match a dark, brand
          themed UI (the popup background, row highlight color, etc. stay
          native no matter what CSS is applied). Headless UI's Listbox
          renders its own popup in the page, so every part of it — including
          the selected/hover highlight — can follow the app's theme. */}
      <Listbox
        value={value}
        onChange={(next: string) => onChange?.({ target: { value: next } })}
        disabled={disabled}
        name={name}
      >
        <div className="relative">
          <ListboxButton
            id={selectId}
            className={cn(
              "flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-left text-sm text-on-surface shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          >
            <span className={cn("truncate", !selected && "text-outline")}>
              {selected ? selected.label : placeholder}
            </span>
            <span className="material-symbols-outlined shrink-0 text-[20px] text-on-surface-variant">
              expand_more
            </span>
          </ListboxButton>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions
              anchor="bottom start"
              transition
              data-lenis-prevent
              className="z-50 mt-2 max-h-60 w-[var(--button-width)] overflow-auto rounded-xl border border-outline-variant/30 bg-surface-container-high p-1 shadow-xl outline-none [--anchor-gap:0.5rem]"
            >
              {hidePlaceholderOption ? null : (
                <ListboxOption
                  value=""
                  className="cursor-pointer select-none rounded-lg px-3 py-2.5 text-sm text-on-surface-variant data-focus:bg-primary/15 data-focus:text-on-surface"
                >
                  {placeholder}
                </ListboxOption>
              )}
              {normalized.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer select-none rounded-lg px-3 py-2.5 text-sm text-on-surface data-focus:bg-primary/15 data-selected:font-semibold data-selected:text-primary"
                >
                  {option.label}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
      {error ? <p className="ml-1 text-sm text-error">{error}</p> : null}
    </div>
  );
}
