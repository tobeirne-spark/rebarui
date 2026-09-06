import { useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { Toggle } from "./Toggle";

export interface ToggleGroupItem {
  value: string;
  /** Rendered as the `Toggle`'s children — text, an icon, or both. */
  label: ReactNode;
  disabled?: boolean;
  /** Required when `label` is icon-only, same rule as a standalone `Toggle`. */
  "aria-label"?: string;
}

interface ToggleGroupSharedProps {
  items: ToggleGroupItem[];
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export type ToggleGroupProps = ToggleGroupSharedProps &
  (
    | {
        /** Exclusive: at most one item pressed. Clicking the pressed item clears it (empty string). */
        type: "single";
        value?: string;
        defaultValue?: string;
        onValueChange?: (value: string) => void;
      }
    | {
        /** Non-exclusive: any number of items pressed independently. */
        type: "multiple";
        value?: string[];
        defaultValue?: string[];
        onValueChange?: (value: string[]) => void;
      }
  ) &
  Omit<ComponentPropsWithoutRef<"div">, "onChange" | "children" | "defaultValue">;

/**
 * Several `Toggle`s composed as one group — the natural next step once more than one pressable
 * button needs to live together in a toolbar, borrowing Radix/shadcn's real `type="single" |
 * "multiple"` distinction rather than inventing a new one: `"single"` behaves like an exclusive
 * choice (but visually and semantically still a set of independent pressed buttons, each with its
 * own `aria-pressed` — NOT `SegmentedControl`'s `radiogroup`/`radio` roles, which is the right
 * shape when the options are a single logical field, not a row of independent toggle buttons);
 * `"multiple"` lets any number stay pressed at once (e.g. Bold + Italic + Underline all active
 * together).
 *
 * Deliberately thin: each item renders as a real, fully-controlled `Toggle` (this component owns
 * the pressed set; `Toggle`'s own internal uncontrolled state never engages here), so no new
 * interaction logic exists beyond "which values are currently in the pressed set" — no keyboard
 * roving-tabindex model, no custom ARIA composite widget. That is a real, accepted gap versus
 * `SegmentedControl`'s arrow-key navigation: a `ToggleGroup` is a set of ordinary Tab-able
 * buttons, not one ARIA composite control, so Tab visits every item, matching how a real toolbar
 * of independent toggle buttons (Bold/Italic/Underline) behaves in every editor this pattern is
 * modeled on.
 */
export function ToggleGroup(props: ToggleGroupProps) {
  const { items, disabled, size = "md", className, ...rest } = props;
  const groupProps = { items, disabled, size, className };
  return rest.type === "single" ? (
    <ToggleGroupSingle
      {...groupProps}
      value={rest.value}
      defaultValue={rest.defaultValue}
      onValueChange={rest.onValueChange}
    />
  ) : (
    <ToggleGroupMultiple
      {...groupProps}
      value={rest.value}
      defaultValue={rest.defaultValue}
      onValueChange={rest.onValueChange}
    />
  );
}

interface InnerProps extends ToggleGroupSharedProps {
  className?: string;
}

function ToggleGroupSingle({
  items,
  disabled,
  size,
  className,
  value,
  defaultValue,
  onValueChange,
}: InnerProps & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const current = isControlled ? value : internalValue;

  const select = (next: string) => {
    const nextValue = next === current ? "" : next;
    if (!isControlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <div
      className={clsx("rebar-toggle-group", className)}
      data-rebar-component="toggle-group"
      data-rebar-toggle-group-type="single"
    >
      {items.map((item) => (
        <Toggle
          key={item.value}
          size={size}
          disabled={disabled || item.disabled}
          pressed={item.value === current}
          onPressedChange={() => select(item.value)}
          data-rebar-part="item"
          aria-label={item["aria-label"]}
        >
          {item.label}
        </Toggle>
      ))}
    </div>
  );
}

function ToggleGroupMultiple({
  items,
  disabled,
  size,
  className,
  value,
  defaultValue,
  onValueChange,
}: InnerProps & {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}) {
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue ?? []);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internalValue;

  const toggle = (itemValue: string) => {
    const nextValue = current.includes(itemValue)
      ? current.filter((v) => v !== itemValue)
      : [...current, itemValue];
    if (!isControlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <div
      className={clsx("rebar-toggle-group", className)}
      data-rebar-component="toggle-group"
      data-rebar-toggle-group-type="multiple"
    >
      {items.map((item) => (
        <Toggle
          key={item.value}
          size={size}
          disabled={disabled || item.disabled}
          pressed={current.includes(item.value)}
          onPressedChange={() => toggle(item.value)}
          data-rebar-part="item"
          aria-label={item["aria-label"]}
        >
          {item.label}
        </Toggle>
      ))}
    </div>
  );
}
