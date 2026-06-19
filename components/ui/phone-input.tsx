"use client";

import PhoneInput, {
  isValidPhoneNumber,
  type Value,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { DuoCountrySelect } from "./phone-country-select";

interface DuoPhoneInputProps {
  id?: string;
  value?: Value;
  onChange: (value: Value) => void;
  required?: boolean;
  placeholder?: string;
}

export function DuoPhoneInput({
  id = "phone",
  value,
  onChange,
  required = true,
  placeholder = "Enter mobile number",
}: DuoPhoneInputProps) {
  return (
    <PhoneInput
      id={id}
      international
      defaultCountry="NP"
      countryCallingCodeEditable={false}
      countrySelectComponent={DuoCountrySelect}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="duo-phone-input"
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
