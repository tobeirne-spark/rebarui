import { useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { NumberInput } from "./NumberInput";

export interface DatePickerProps
  extends Omit<ComponentPropsWithoutRef<"div">, "value" | "defaultValue" | "onChange"> {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date) => void;
  /** Bounds the committed date (clamped after a complete year is typed — see the year field's own
   * comment below for why a *typed-mid-year* clamp would otherwise fight the user). */
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();
// A year somewhere in a real human lifetime range by default — not an arbitrary 0-9999 spinner.
// Only used when the caller doesn't supply minDate/maxDate.
const DEFAULT_MIN_YEAR = CURRENT_YEAR - 120;
const DEFAULT_MAX_YEAR = CURRENT_YEAR + 10;

function daysInMonth(year: number, month: number): number {
  // Day 0 of the *next* month is the last day of this one — a real, standard JS Date trick, not a
  // hand-rolled leap-year table.
  return new Date(year, month, 0).getDate();
}

function clampToRange(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * A compact day/month/year numeric-triplet input — bounded numeric entry (12 months, a day count
 * that depends on the selected month/year, a year within a real human lifetime range), closer in
 * spirit to `NumberInput` than to a second `Calendar`. Replaces the previous Popover+Calendar
 * composition entirely: a full calendar grid here just duplicated `Calendar` itself, where this is
 * the faster, keyboard-first shape for someone who already knows the date they want (a birthdate,
 * a known deadline) and would rather type three numbers than browse a grid. Reach for `Calendar`
 * directly (in a `Popover` if a trigger-button shape is wanted) when browsing/visual picking is
 * actually the point.
 */
export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  minDate,
  maxDate,
  disabled,
  className,
  ...props
}: DatePickerProps) {
  const fallback = defaultValue ?? new Date();
  const [internalValue, setInternalValue] = useState(fallback);
  const isControlled = value !== undefined;
  const current = isControlled ? (value ?? fallback) : internalValue;

  const day = current.getDate();
  const month = current.getMonth() + 1;
  const year = current.getFullYear();

  const minYear = minDate ? minDate.getFullYear() : DEFAULT_MIN_YEAR;
  const maxYear = maxDate ? maxDate.getFullYear() : DEFAULT_MAX_YEAR;

  const commit = (nextDay: number, nextMonth: number, nextYear: number) => {
    const clampedMonth = clampToRange(nextMonth, 1, 12);
    const clampedDay = clampToRange(nextDay, 1, daysInMonth(nextYear, clampedMonth));
    // `setFullYear` (not the `new Date(year, ...)` constructor) specifically because a year being
    // typed one digit at a time is briefly < 100 — the constructor (and the legacy `setYear`)
    // special-case any 0-99 year as 1900-1999, which would make an in-progress "1" silently become
    // 1901 and re-render the field showing "1901" instead of "1". `setFullYear` sets the exact
    // year given, no remapping, at any value.
    let next = new Date();
    next.setFullYear(nextYear, clampedMonth - 1, clampedDay);
    next.setHours(0, 0, 0, 0);
    if (minDate && next < minDate) next = minDate;
    if (maxDate && next > maxDate) next = maxDate;
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  // The year field deliberately does NOT pass min/max to NumberInput and doesn't clamp until the
  // typed number is at least a plausible 4-digit year: a real, hit-directly usability bug in an
  // earlier draft — clamping a partial year (e.g. the "1" typed on the way to "1998") straight to
  // a bound like 1906 immediately overwrites the field back to "1906" mid-keystroke, making it
  // impossible to type a multi-digit year one digit at a time. Once the year is plausible, real
  // bounds apply the same way day/month's always do.
  const commitYear = (typedYear: number) => {
    const bounded = typedYear >= 1000 ? clampToRange(typedYear, minYear, maxYear) : typedYear;
    commit(day, month, bounded);
  };

  return (
    <div
      className={clsx("rebar-date-picker", className)}
      data-rebar-component="date-picker"
      role="group"
      aria-label="Date"
      {...props}
    >
      <NumberInput
        aria-label="Day"
        data-rebar-part="day"
        value={day}
        min={1}
        max={daysInMonth(year, month)}
        disabled={disabled}
        onChange={(next) => commit(next, month, year)}
        style={{ width: 48 }}
      />
      <span className="rebar-date-picker-separator" aria-hidden="true">
        /
      </span>
      <NumberInput
        aria-label="Month"
        data-rebar-part="month"
        value={month}
        min={1}
        max={12}
        disabled={disabled}
        onChange={(next) => commit(day, next, year)}
        style={{ width: 48 }}
      />
      <span className="rebar-date-picker-separator" aria-hidden="true">
        /
      </span>
      <NumberInput
        aria-label="Year"
        data-rebar-part="year"
        value={year}
        disabled={disabled}
        onChange={commitYear}
        style={{ width: 72 }}
      />
    </div>
  );
}
