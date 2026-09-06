import { useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { Calendar } from "./Calendar";
import { Popover } from "./Popover";

export interface DatePickerProps
  extends Omit<ComponentPropsWithoutRef<"button">, "value" | "defaultValue" | "onChange"> {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
}

/**
 * A trigger button showing the picked date, opening a real `Popover` containing the real
 * `Calendar` component — this component itself owns no date-grid or navigation logic, it's pure
 * composition of the two, the same way `SplitButton` composes `Button` + `Popover` without
 * reimplementing either. Picking a day closes the popover (a single date is a complete choice,
 * unlike `TimePicker`'s deliberate stay-open behavior across an hour-and-minute pick).
 */
export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  minDate,
  maxDate,
  placeholder = "Select a date",
  disabled,
  className,
  "aria-label": ariaLabel = "Select a date",
  ...props
}: DatePickerProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internalValue;

  const [open, setOpen] = useState(false);

  const handleSelect = (date: Date) => {
    if (!isControlled) setInternalValue(date);
    onValueChange?.(date);
    setOpen(false);
  };

  const label = current
    ? current.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : placeholder;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className={clsx("rebar-date-picker-trigger", className)}
          data-rebar-component="date-picker"
          aria-label={`${ariaLabel}, current value ${current ? label : "none"}`}
          disabled={disabled}
          {...props}
        >
          {label}
        </button>
      }
    >
      <Calendar
        value={current}
        onValueChange={handleSelect}
        minDate={minDate}
        maxDate={maxDate}
      />
    </Popover>
  );
}
