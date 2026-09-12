import { forwardRef } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import clsx from "clsx";
import { ChevronDownIcon } from "./icons";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Matches `Button`'s own three-tier scale (`sm`=32px, `md`=44px, `lg`=48px) exactly, so a
   * `Select` placed beside a `Button` in the same toolbar/row lines up by default instead of
   * needing a one-off height override — see `ref/HEURISTICS.md`'s form-control sizing heuristic.
   * Default `"md"`. */
  size?: "sm" | "md" | "lg";
  className?: string;
  "aria-label"?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { options, value, defaultValue, onValueChange, placeholder, disabled, size = "md", className, ...props },
  ref,
) {
  return (
    <RadixSelect.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        ref={ref}
        className={clsx("rebar-select-trigger", className)}
        data-rebar-component="select"
        data-rebar-size={size}
        {...props}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className="rebar-select-icon" aria-hidden="true">
          <ChevronDownIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content className="rebar-select-content" data-rebar-part="content">
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="rebar-select-item"
                data-rebar-part="item"
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="rebar-select-item-indicator">
                  ✓
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
});
