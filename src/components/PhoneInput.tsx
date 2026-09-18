import { useState } from "react";
import clsx from "clsx";
import { Select } from "./Select";
import { Input } from "./Input";
import type { SelectOption } from "./Select";

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2 code, e.g. `"US"`. */
  code: string;
  /** E.164 calling code, e.g. `"+1"`. */
  dialCode: string;
  name: string;
  /** A format mask for the national number, in `Input`'s own `mask` syntax (`9` = digit). Falls
   * back to a plain, unformatted digit field when unset. */
  mask?: string;
}

export const DEFAULT_PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "US", dialCode: "+1", name: "United States", mask: "(999) 999-9999" },
  { code: "CA", dialCode: "+1", name: "Canada", mask: "(999) 999-9999" },
  { code: "GB", dialCode: "+44", name: "United Kingdom", mask: "9999 999999" },
  { code: "AU", dialCode: "+61", name: "Australia", mask: "9999 999 999" },
  { code: "DE", dialCode: "+49", name: "Germany" },
  { code: "FR", dialCode: "+33", name: "France", mask: "9 99 99 99 99" },
  { code: "IN", dialCode: "+91", name: "India", mask: "99999 99999" },
  { code: "JP", dialCode: "+81", name: "Japan", mask: "99-9999-9999" },
  { code: "BR", dialCode: "+55", name: "Brazil", mask: "(99) 99999-9999" },
  { code: "NZ", dialCode: "+64", name: "New Zealand" },
];

export interface PhoneInputProps {
  /** The full value as `"<dialCode> <nationalNumber>"` (e.g. `"+1 (555) 123-4567"`). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  countries?: PhoneCountry[];
  defaultCountryCode?: string;
  placeholder?: string;
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
}

function parseValue(value: string | undefined, countries: PhoneCountry[]): { countryCode: string; national: string } {
  if (!value) return { countryCode: countries[0]?.code ?? "", national: "" };
  const match = countries
    .slice()
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((c) => value.startsWith(c.dialCode));
  if (!match) return { countryCode: countries[0]?.code ?? "", national: value };
  return { countryCode: match.code, national: value.slice(match.dialCode.length).trim() };
}

/**
 * A country-code select paired with a national-number field whose format mask changes with the
 * selected country — real branching state (the country choice changes both the mask and, in a
 * real app, the validation rule), not just formatting. Deliberately distinct from `Input`'s own
 * `mask` prop (already shipped for exactly "a formatted phone/card-number field" — see
 * `ref/COMPONENT_BUILD_PLAN.md`): that covers a single fixed format, not switching between
 * countries' different formats behind one field. Ships a small (10-country) built-in list and
 * per-country masks for the ones with a common short format — not a `libphonenumber`-equivalent
 * validation library; real production use should still validate server-side.
 */
export function PhoneInput({
  value,
  defaultValue,
  onValueChange,
  countries = DEFAULT_PHONE_COUNTRIES,
  defaultCountryCode,
  placeholder,
  "aria-label": ariaLabel = "Phone number",
  disabled,
  className,
}: PhoneInputProps) {
  const initial = parseValue(value ?? defaultValue, countries);
  const [internalCountryCode, setInternalCountryCode] = useState(defaultCountryCode ?? initial.countryCode);
  const [internalNational, setInternalNational] = useState(initial.national);

  const isControlled = value !== undefined;
  const parsed = isControlled ? parseValue(value, countries) : null;
  const countryCode = isControlled ? parsed!.countryCode : internalCountryCode;
  const national = isControlled ? parsed!.national : internalNational;

  const country = countries.find((c) => c.code === countryCode) ?? countries[0];

  const options: SelectOption[] = countries.map((c) => ({
    value: c.code,
    label: `${c.name} (${c.dialCode})`,
  }));

  const emit = (nextCountryCode: string, nextNational: string) => {
    const nextCountry = countries.find((c) => c.code === nextCountryCode) ?? countries[0];
    onValueChange?.(`${nextCountry!.dialCode} ${nextNational}`.trim());
  };

  return (
    <div className={clsx("rebar-phone-input", className)} data-rebar-component="phone-input">
      <div className="rebar-phone-input-country" data-rebar-part="country">
        <Select
          options={options}
          value={countryCode}
          onValueChange={(next) => {
            if (!isControlled) setInternalCountryCode(next);
            emit(next, national);
          }}
          disabled={disabled}
          aria-label="Country"
        />
      </div>
      <Input
        type="tel"
        className="rebar-phone-input-national"
        data-rebar-part="national"
        mask={country?.mask}
        aria-label={ariaLabel}
        placeholder={placeholder ?? (country?.mask ? undefined : "Phone number")}
        disabled={disabled}
        value={national}
        onChange={(e) => {
          if (!isControlled) setInternalNational(e.target.value);
          emit(countryCode, e.target.value);
        }}
      />
    </div>
  );
}
