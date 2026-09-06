import { forwardRef, useState } from "react";
import type { KeyboardEvent } from "react";
import clsx from "clsx";

export interface RateProps {
  value?: number;
  defaultValue?: number;
  count?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
  "aria-label"?: string;
  className?: string;
}

// No half-star support — a real, stated scope limitation, not an oversight: half-star hit-testing
// (splitting each star into two click/keyboard targets) adds real complexity this first pass
// defers, matching the project's own discipline of not fabricating precision it hasn't built.
export const Rate = forwardRef<HTMLDivElement, RateProps>(function Rate(
  { value, defaultValue = 0, count = 5, disabled, onChange, "aria-label": ariaLabel = "Rating", className },
  ref,
) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const current = value ?? internalValue;

  function setValue(next: number) {
    if (disabled) return;
    if (value === undefined) setInternalValue(next);
    onChange?.(next);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (disabled) return;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setValue(Math.min(count, current + 1));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setValue(Math.max(0, current - 1));
    }
  }

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={ariaLabel}
      className={clsx("rebar-rate", disabled && "rebar-rate-disabled", className)}
      data-rebar-component="rate"
      onKeyDown={handleKeyDown}
    >
      {Array.from({ length: count }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= current;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={current === starValue}
            aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
            className={clsx("rebar-rate-star", filled && "rebar-rate-star-filled")}
            data-rebar-part="star"
            disabled={disabled}
            tabIndex={starValue === Math.max(1, Math.ceil(current)) ? 0 : -1}
            onClick={() => setValue(starValue)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
});
