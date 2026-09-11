"use client";

import PhoneInput, {
  isValidPhoneNumber,
  type Value,
} from "react-phone-number-input";
// Bundled, locally-served flag icons — the library's default flagUrl points
// at a GitHub Pages URL (purecatamphetamine.github.io), which the app's CSP
// doesn't allow and shouldn't need to: hotlinking flags at runtime is an
// unnecessary external dependency when the same SVGs ship in the package.
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { DuoCountrySelect } from "./phone-country-select";

interface DuoPhoneInputProps {
  id?: string;
  value?: Value;
  onChange: (value: Value) => void;
  required?: boolean;
  placeholder?: string;
  /** "compact" matches the ~48px height of the app's other form fields
   * (Input/SelectField) — use it whenever this sits in a grid alongside
   * them, e.g. a profile edit form. The registration flow's larger default
   * size is unaffected. */
  size?: "default" | "compact";
}

export function DuoPhoneInput({
  id = "phone",
  value,
  onChange,
  required = true,
  placeholder = "Enter mobile number",
  size = "default",
}: DuoPhoneInputProps) {
  return (
    <PhoneInput
      id={id}
      international
      defaultCountry="NP"
      countryCallingCodeEditable={false}
      countrySelectComponent={DuoCountrySelect}
      flags={flags}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={
        size === "compact" ? "duo-phone-input duo-phone-input--compact" : "duo-phone-input"
      }
      numberInputProps={{
        id: `${id}-number`,
        className: "duo-phone-input__number",
        required,
        autoComplete: "tel",
      }}
    />
  );
}

export { isValidPhoneNumber, type Value };
