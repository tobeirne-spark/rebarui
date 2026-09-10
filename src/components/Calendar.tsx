import { useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export interface CalendarProps extends Omit<ComponentPropsWithoutRef<"div">, "value" | "defaultValue"> {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date) => void;
  /** Which month is currently displayed — independent of `value`, since the calendar can be
   * navigated without a date actually being picked. */
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  /** Dates outside this range render disabled, not selectable. */
  minDate?: Date;
  maxDate?: Date;
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Midnight-normalized epoch ms — the only thing worth comparing dates by here, never
 * time-of-day (a `Date` passed in as `value` may legitimately carry a time component). */
function dayKey(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

interface GridCell {
  date: Date;
  inCurrentMonth: boolean;
}

/** Plain `Date` math — no date library. A fixed 6-row (42-cell) grid, leading/trailing days
 * pulled from the adjacent months via `Date`'s own overflow normalization (`new Date(y, m, 0)`
 * is the last day of month `m - 1`, `new Date(y, m + 1, n)` rolls forward correctly however far
 * `n` overflows). */
function buildMonthGrid(month: Date): GridCell[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();

  const cells: GridCell[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, monthIndex - 1, daysInPrevMonth - i), inCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, monthIndex, d), inCurrentMonth: true });
  }
  let trailing = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(year, monthIndex + 1, trailing), inCurrentMonth: false });
    trailing++;
  }
  return cells;
}

/**
 * A standalone month-grid display for picking (or just displaying) a date — not wrapped in a
 * popover itself; a future `DatePicker` layers a real `Popover` around this instead of this
 * component reimplementing that shell. Two independent controlled/uncontrolled pairs, per
 * robot.md's pattern: `value`/`onValueChange` (the picked date) and `month`/`onMonthChange`
 * (which month is displayed) — navigating months never implies picking a date.
 */
export const Calendar = ({
  value,
  defaultValue,
  onValueChange,
  month,
  defaultMonth,
  onMonthChange,
  minDate,
  maxDate,
  className,
  ...props
}: CalendarProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isValueControlled = value !== undefined;
  const currentValue = isValueControlled ? value : internalValue;

  const setValue = (next: Date) => {
    if (!isValueControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  const [internalMonth, setInternalMonth] = useState(defaultMonth ?? value ?? new Date());
  const isMonthControlled = month !== undefined;
  const currentMonth = isMonthControlled ? month : internalMonth;

  const setMonth = (next: Date) => {
    if (!isMonthControlled) setInternalMonth(next);
    onMonthChange?.(next);
  };

  const goToPrevMonth = () => setMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const goToNextMonth = () => setMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const cells = buildMonthGrid(currentMonth);
  const selectedKey = currentValue ? dayKey(currentValue) : undefined;
  const todayKey = dayKey(new Date());
  const minKey = minDate ? dayKey(minDate) : undefined;
  const maxKey = maxDate ? dayKey(maxDate) : undefined;

  const monthLabel = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className={clsx("rebar-calendar", className)} data-rebar-component="calendar" {...props}>
      <div className="rebar-calendar-header" data-rebar-part="header">
        <Button
          type="button"
          variant="secondary"
          className="rebar-calendar-nav"
          aria-label="Previous month"
          onClick={goToPrevMonth}
        >
          <ChevronLeftIcon />
        </Button>
        <span className="rebar-calendar-label" data-rebar-part="label">
          {monthLabel}
        </span>
        <Button
          type="button"
          variant="secondary"
          className="rebar-calendar-nav"
          aria-label="Next month"
          onClick={goToNextMonth}
        >
          <ChevronRightIcon />
        </Button>
      </div>
      <div className="rebar-calendar-weekdays" data-rebar-part="weekdays">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={`${label}-${i}`} className="rebar-calendar-weekday" aria-hidden="true">
            {label}
          </div>
        ))}
      </div>
      <div className="rebar-calendar-grid" data-rebar-part="grid">
        {cells.map(({ date, inCurrentMonth }) => {
          const key = dayKey(date);
          const outOfRange = (minKey !== undefined && key < minKey) || (maxKey !== undefined && key > maxKey);
          const disabled = !inCurrentMonth || outOfRange;
          const selected = selectedKey !== undefined && key === selectedKey;
          const isToday = key === todayKey;

          return (
            <button
              key={date.toISOString()}
              type="button"
              className="rebar-calendar-day"
              data-rebar-part="day"
              data-rebar-selected={selected || undefined}
              data-rebar-today={isToday || undefined}
              data-rebar-outside={!inCurrentMonth || undefined}
              disabled={disabled}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={selected}
              aria-label={date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              tabIndex={inCurrentMonth ? 0 : -1}
              onClick={() => {
                if (disabled) return;
                setValue(date);
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};
