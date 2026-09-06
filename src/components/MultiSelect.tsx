import { forwardRef, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps extends Omit<ComponentPropsWithoutRef<"button">, "onChange" | "defaultValue"> {
  options: MultiSelectOption[];
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * A closed-menu multi-select — a `Select`-style trigger that opens a checklist popover, the same
 * shape as MUI's `Select multiple` or a native `<select multiple>`: pick from a small, already-
 * known set of options with checkboxes, no typing. Deliberately distinct from `Combobox`'s
 * `multiple` mode (a type-to-filter search field with chips, AntD's `Select mode="multiple"`
 * shape) — both are real, established patterns for "select more than one," not the same
 * interaction with different styling, so this stays its own component rather than folding into
 * `Combobox` (the same reasoning already applied to keeping `SegmentedControl` separate from
 * `RadioGroup`). Reach for this when the option list is short enough to scan without searching;
 * reach for `Combobox`'s `multiple` mode once it's long enough that finding an option by typing
 * beats scanning a flat list (see ref/HEURISTICS.md #42).
 *
 * Built on Radix's `DropdownMenu` with `CheckboxItem`s (the same primitive `Dropdown` already
 * wraps) rather than Radix's `Select`, which has no multi-select mode at all — checked directly
 * against Radix's own docs, not assumed. Each pick calls `event.preventDefault()` in `onSelect` to
 * keep the menu open across selections, the same "stays open so picking several doesn't mean
 * reopening it every time" behavior `Combobox`'s `multiple` mode already has.
 */
export const MultiSelect = forwardRef<HTMLButtonElement, MultiSelectProps>(function MultiSelect(
  { options, values, defaultValues, onValuesChange, placeholder = "Select…", disabled, className, ...props },
  ref,
) {
  const [internalValues, setInternalValues] = useState<string[]>(defaultValues ?? []);
  const isControlled = values !== undefined;
  const selectedValues = isControlled ? values : internalValues;

  const toggle = (value: string) => {
    const next = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    if (!isControlled) setInternalValues(next);
    onValuesChange?.(next);
  };

  const selectedLabels = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);

  // Never grows with the selection: one pick shows that option's own label (truncated by the
  // trigger's own width, like any other single-line text); two or more shows a count instead of
  // joining every label end to end, which would otherwise make the trigger's "natural" width grow
  // without bound as more options get checked.
  const summary =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} selected`;

  return (
    // Non-modal: Radix's default (`modal`) traps focus and marks the rest of the page
    // `aria-hidden` while open — reasonable for a one-shot action menu, wrong here, since this
    // menu is meant to stay open across several picks specifically so a person can watch
    // whatever it's filtering update live as they check boxes. A modal trap would hide that
    // live-updating content from assistive tech the whole time the menu is open.
    <RadixDropdownMenu.Root modal={false}>
      <RadixDropdownMenu.Trigger asChild>
        <button
          ref={ref}
          type="button"
          className={clsx("rebar-select-trigger", "rebar-multi-select-trigger", className)}
          data-rebar-component="multi-select"
          disabled={disabled}
          {...props}
        >
          <span className="rebar-multi-select-trigger-value" data-rebar-part="value">
            {summary}
          </span>
          <span className="rebar-select-icon" aria-hidden="true">
            ▾
          </span>
        </button>
      </RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content
          className="rebar-dropdown-content rebar-multi-select-content"
          data-rebar-part="content"
          sideOffset={4}
        >
          {options.map((option) => (
            <RadixDropdownMenu.CheckboxItem
              key={option.value}
              checked={selectedValues.includes(option.value)}
              onCheckedChange={() => toggle(option.value)}
              onSelect={(event) => event.preventDefault()}
              disabled={option.disabled}
              className="rebar-dropdown-item rebar-multi-select-item"
              data-rebar-part="item"
            >
              <span className="rebar-multi-select-item-box" aria-hidden="true">
                <RadixDropdownMenu.ItemIndicator className="rebar-multi-select-item-check">
                  ✓
                </RadixDropdownMenu.ItemIndicator>
              </span>
              {option.label}
            </RadixDropdownMenu.CheckboxItem>
          ))}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  );
});
