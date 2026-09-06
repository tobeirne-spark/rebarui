import { forwardRef, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

export interface NumberInputProps
  extends Omit<ComponentPropsWithoutRef<"input">, "size" | "value" | "defaultValue" | "onChange" | "type"> {
  size?: "sm" | "md" | "lg";
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function clamp(value: number, min?: number, max?: number): number {
  let result = value;
  if (min !== undefined) result = Math.max(min, result);
  if (max !== undefined) result = Math.min(max, result);
  return result;
}

/**
 * A numeric field with increment/decrement steppers — closes a catalogued gap (antd's
 * `InputNumber`, Carbon, Adobe Spectrum all have this; a bare `<input type="number">`'s native
 * spinner is inconsistent across browsers and unstyleable, which is why this wraps a plain text
 * input rather than `type="number"`). Both steppers and direct typing keep the value clamped to
 * `min`/`max` — heuristic #26 (input constraints are visible), not just enforced silently.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { size = "md", className, value, defaultValue, onChange, min, max, step = 1, disabled, ...props },
  ref,
) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? 0);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internalValue;

  const setValue = (next: number) => {
    const clamped = clamp(next, min, max);
    if (!isControlled) setInternalValue(clamped);
    onChange?.(clamped);
  };

  return (
    <div className={clsx("rebar-number-input", className)} data-rebar-component="number-input">
      <button
        type="button"
        className="rebar-number-input-step"
        data-rebar-part="decrement"
        aria-label="Decrease"
        disabled={disabled || (min !== undefined && current <= min)}
        onClick={() => setValue(current - step)}
      >
        −
      </button>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        className="rebar-input rebar-number-input-field"
        data-rebar-size={size}
        data-rebar-part="input"
        disabled={disabled}
        value={current}
        onChange={(e) => {
          const parsed = Number(e.target.value);
          if (!Number.isNaN(parsed)) setValue(parsed);
        }}
        {...props}
      />
      <button
        type="button"
        className="rebar-number-input-step"
        data-rebar-part="increment"
        aria-label="Increase"
        disabled={disabled || (max !== undefined && current >= max)}
        onClick={() => setValue(current + step)}
      >
        +
      </button>
    </div>
  );
});
