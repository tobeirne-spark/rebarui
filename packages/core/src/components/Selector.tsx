import { useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";

export interface SelectorOption<T> {
  label: ReactNode;
  description?: ReactNode;
  value: T;
  disabled?: boolean;
}

export interface SelectorProps<T> {
  options: SelectorOption<T>[];
  multiple?: boolean;
  value?: T[];
  defaultValue?: T[];
  onValueChange?: (value: T[]) => void;
  disabled?: boolean;
  /** How many chips per row before wrapping. Omit for a plain wrapping row (the common case). */
  columns?: number;
  "aria-label"?: string;
  className?: string;
}

/**
 * A grid of selectable chips — the antd-mobile `Selector` pattern, distinct from `MultiSelect`'s
 * dropdown: every option is visible and tappable at once, no menu to open first. Reach for this
 * when the option count is small enough to show in full (a handful of filters, a single-choice
 * settings picker); reach for `MultiSelect`/`Combobox` once the list is long enough to need
 * searching or scrolling.
 */
export function Selector<T extends string | number>({
  options,
  multiple = false,
  value,
  defaultValue = [],
  onValueChange,
  disabled = false,
  columns,
  "aria-label": ariaLabel,
  className,
}: SelectorProps<T>) {
  const [internalValue, setInternalValue] = useState<T[]>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internalValue;

  const setValue = (next: T[]) => {
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  const toggle = (option: SelectorOption<T>) => {
    if (disabled || option.disabled) return;
    const isSelected = current.includes(option.value);
    if (multiple) {
      setValue(isSelected ? current.filter((v) => v !== option.value) : [...current, option.value]);
    } else {
      setValue(isSelected ? [] : [option.value]);
    }
  };

  return (
    <div
      className={clsx("rebar-selector", className)}
      data-rebar-component="selector"
      role="group"
      aria-label={ariaLabel}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}
    >
      {options.map((option, i) => {
        const isSelected = current.includes(option.value);
        const isDisabled = disabled || option.disabled;
        return (
          <button
            key={i}
            type="button"
            className="rebar-selector-chip"
            data-rebar-part="chip"
            aria-pressed={isSelected}
            disabled={isDisabled}
            onClick={() => toggle(option)}
          >
            <span className="rebar-selector-chip-label" data-rebar-part="chip-label">
              {option.label}
            </span>
            {option.description ? (
              <span className="rebar-selector-chip-description" data-rebar-part="chip-description">
                {option.description}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
