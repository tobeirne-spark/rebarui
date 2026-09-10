import { useState } from "react";
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from "react";
import clsx from "clsx";
import { renderBionicChildren, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface SegmentedControlOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
  options: SegmentedControlOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  /** Force bionic reading on/off for option labels, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

/**
 * A pill-style single-select button group — visually distinct from `RadioGroup`, for the same
 * "which one of these" choice when the options read better as a compact row of labeled segments
 * than a stacked list of radio buttons (a view toggle, a time-range picker). A real ARIA
 * `radiogroup`, not styled buttons: arrow keys move the selection (Home/End jump to the ends),
 * matching the WAI-ARIA Authoring Practices radio-group pattern, not just mouse/tap.
 */
export function SegmentedControl({
  options,
  value,
  defaultValue,
  onValueChange,
  disabled,
  bionic,
  bionicOptions,
  className,
  ...props
}: SegmentedControlProps) {
  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internalValue;

  const select = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  const enabledOptions = options.filter((o) => !o.disabled);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = enabledOptions.findIndex((o) => o.value === current);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % enabledOptions.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + enabledOptions.length) % enabledOptions.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = enabledOptions.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const next = enabledOptions[nextIndex];
    if (next) select(next.value);
  };

  return (
    <div
      className={clsx("rebar-segmented-control", className)}
      data-rebar-component="segmented-control"
      role="radiogroup"
      {...props}
    >
      {options.map((option) => {
        const isSelected = option.value === current;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className="rebar-segmented-control-item"
            data-rebar-part="item"
            data-rebar-active={isSelected || undefined}
            disabled={disabled || option.disabled}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => select(option.value)}
            onKeyDown={handleKeyDown}
          >
            {renderBionicChildren(option.label, bionicEnabled, bionicOptions)}
          </button>
        );
      })}
    </div>
  );
}
