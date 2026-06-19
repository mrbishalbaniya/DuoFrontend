"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";

type CountryOption = {
  value?: string;
  label: string;
  divider?: boolean;
};

type CountryIconProps = {
  country?: string;
  label?: string;
  aspectRatio?: number;
  "aria-hidden"?: boolean;
};

type DuoCountrySelectProps = {
  value?: string;
  onChange: (value?: string) => void;
  options: CountryOption[];
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  iconComponent?: ComponentType<CountryIconProps>;
  onFocus?: () => void;
  onBlur?: () => void;
};

export function DuoCountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
  className,
  iconComponent: Icon,
  onFocus,
  onBlur,
}: DuoCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedOption = useMemo(() => {
    for (const option of options) {
      if (!option.divider && (option.value ?? undefined) === (value ?? undefined)) {
        return option;
      }
    }
    return undefined;
  }, [options, value]);

  const selectableOptions = useMemo(
    () => options.filter((option) => !option.divider),
    [options]
  );

  const close = useCallback(() => {
    setOpen(false);
    onBlur?.();
  }, [onBlur]);

  const openMenu = useCallback(() => {
    if (disabled || readOnly) return;
    setOpen(true);
    onFocus?.();
  }, [disabled, readOnly, onFocus]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const pick = (next?: string) => {
    onChange(next);
    close();
  };

  return (
    <div
      ref={rootRef}
      className={`PhoneInputCountry duo-phone-country${className ? ` ${className}` : ""}`}
    >
      <button
        type="button"
        className="duo-phone-country__trigger"
        disabled={disabled || readOnly}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? close() : openMenu())}
      >
        {Icon && selectedOption ? (
          <Icon aria-hidden country={value} label={selectedOption.label} />
        ) : null}
        <span className="duo-phone-country__arrow PhoneInputCountrySelectArrow" aria-hidden />
      </button>

      {open ? (
        <ul id={listId} role="listbox" className="duo-phone-country__menu">
          {selectableOptions.map((option) => {
            const isSelected =
              (option.value ?? undefined) === (value ?? undefined);

            return (
              <li
                key={option.value ?? "international"}
                role="option"
                aria-selected={isSelected}
                className={`duo-phone-country__option${isSelected ? " is-selected" : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(option.value)}
              >
                {Icon && option.value ? (
                  <Icon aria-hidden country={option.value} label={option.label} />
                ) : null}
                <span>{option.label}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
