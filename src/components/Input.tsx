import { forwardRef } from "react";
import type { ChangeEvent, ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

export interface InputProps extends Omit<ComponentPropsWithoutRef<"input">, "size"> {
  size?: "sm" | "md" | "lg";
  /**
   * A format mask applied as the user types — `9` accepts a digit, `a` a letter, `*` any
   * character; every other character in the mask is a literal, inserted automatically (e.g.
   * `"(999) 999-9999"` or `"aaa-9999"`). Not a validation constraint by itself — pair with
   * `pattern`/`required` for that (see ref/HEURISTICS.md #26, constraints are shown, not just
   * enforced silently). Catalogued as a real, common gap (formatted phone/card-number fields)
   * rather than a new component — see ref/COMPONENT_BUILD_PLAN.md.
   */
  mask?: string;
}

/** Formats `raw` (mask-relevant characters only, in order) against `mask`, inserting the mask's
 * own literal characters as soon as enough input exists to reach them. */
function applyMask(mask: string, raw: string): string {
  let result = "";
  let rawIndex = 0;
  for (let i = 0; i < mask.length && rawIndex < raw.length; i++) {
    const maskChar = mask[i];
    const rawChar = raw[rawIndex] ?? "";
    if (maskChar === "9") {
      if (!/[0-9]/.test(rawChar)) return result;
      result += rawChar;
      rawIndex++;
    } else if (maskChar === "a") {
      if (!/[a-zA-Z]/.test(rawChar)) return result;
      result += rawChar;
      rawIndex++;
    } else if (maskChar === "*") {
      result += rawChar;
      rawIndex++;
    } else {
      result += maskChar;
      if (rawChar === maskChar) rawIndex++;
    }
  }
  return result;
}

/** The mask's own placeholder characters stripped out, leaving just what the user actually typed. */
function extractRaw(mask: string, value: string): string {
  const maskChars = new Set(mask.split("").filter((c) => c !== "9" && c !== "a" && c !== "*"));
  return value
    .split("")
    .filter((c) => !maskChars.has(c))
    .join("");
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = "md", className, mask, onChange, ...props },
  ref,
) {
  const handleMaskedChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (mask) {
      const raw = extractRaw(mask, event.target.value);
      event.target.value = applyMask(mask, raw);
    }
    onChange?.(event);
  };

  return (
    <input
      ref={ref}
      className={clsx("rebar-input", className)}
      data-rebar-component="input"
      data-rebar-size={size}
      onChange={mask ? handleMaskedChange : onChange}
      placeholder={mask ? mask.replace(/9/g, "_").replace(/a/g, "_") : undefined}
      {...props}
    />
  );
});
