import { parsePhoneNumber } from "react-phone-number-input";

export function splitPhoneValue(value?: string) {
  if (!value) return null;

  const parsed = parsePhoneNumber(value);
  if (!parsed) return null;

  return {
    phone_country_code: `+${parsed.countryCallingCode}`,
    phone_number: parsed.nationalNumber,
  };
}
