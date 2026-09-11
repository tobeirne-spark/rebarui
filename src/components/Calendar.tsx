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

type CalendarView = "day" | "month" | "year";

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString("en-US", { month: "short" }),
);

/** The 12-year window a "year" view page shows, given any year currently being browsed —
 * e.g. browsing 2026 shows 2016-2027 (a fixed, calendar-page-style grid, not centered on the
 * year, so paging by a full window is always a clean, predictable jump). */
function decadeStart(year: number): number {
  return Math.floor(year / 12) * 12;
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
 *
 * The header label is a real drill-up control, the standard calendar-widget pattern for jumping
 * years at a time instead of clicking "next month" dozens of times: click it in the day grid to
 * jump to a 12-month grid for the year, click again there to jump to a 12-year grid. Picking a
 * month/year drills back down one level (never further than day view) and — only once an actual
 * day is clicked — commits `value`/`onValueChange`; browsing through month/year views never picks
 * a date on its own, matching the same "navigating never implies picking" rule `month` already
 * follows. This browsing state (`view`, which year/decade is currently shown while drilled up) is
 * purely local UI state, deliberately not exposed as another controlled prop — a caller only ever
 * needs to know the final committed `month`/`value`, not which intermediate picker was open.
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

  const [view, setView] = useState<CalendarView>("day");
  const [browseYear, setBrowseYear] = useState(currentMonth.getFullYear());

  const openMonthView = () => {
    setBrowseYear(currentMonth.getFullYear());
    setView("month");
  };
  const openYearView = () => setView("year");

  const pickMonth = (monthIndex: number) => {
    setMonth(new Date(browseYear, monthIndex, 1));
    setView("day");
  };
  const pickYear = (year: number) => {
    setBrowseYear(year);
    setView("month");
  };

  const cells = buildMonthGrid(currentMonth);
  const selectedKey = currentValue ? dayKey(currentValue) : undefined;
  const todayKey = dayKey(new Date());
  const minKey = minDate ? dayKey(minDate) : undefined;
  const maxKey = maxDate ? dayKey(maxDate) : undefined;

  const monthLabel = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const currentDecadeStart = decadeStart(browseYear);

  const headerLabel = view === "day" ? monthLabel : view === "month" ? String(browseYear) : `${currentDecadeStart}–${currentDecadeStart + 11}`;
  const prevLabel = view === "day" ? "Previous month" : view === "month" ? "Previous year" : "Previous 12 years";
  const nextLabel = view === "day" ? "Next month" : view === "month" ? "Next year" : "Next 12 years";
  const handlePrev = () => {
    if (view === "day") goToPrevMonth();
    else if (view === "month") setBrowseYear((y) => y - 1);
    else setBrowseYear((y) => y - 12);
  };
  const handleNext = () => {
    if (view === "day") goToNextMonth();
    else if (view === "month") setBrowseYear((y) => y + 1);
    else setBrowseYear((y) => y + 12);
  };

  return (
    <div className={clsx("rebar-calendar", className)} data-rebar-component="calendar" data-rebar-view={view} {...props}>
      <div className="rebar-calendar-header" data-rebar-part="header">
        <Button
          type="button"
          variant="secondary"
          className="rebar-calendar-nav"
          aria-label={prevLabel}
          onClick={handlePrev}
        >
          <ChevronLeftIcon />
        </Button>
        {view === "year" ? (
          <span className="rebar-calendar-label" data-rebar-part="label">
            {headerLabel}
          </span>
        ) : (
          <button
            type="button"
            className="rebar-calendar-label rebar-calendar-label-button"
            data-rebar-part="label"
            onClick={view === "day" ? openMonthView : openYearView}
            aria-label={`${headerLabel}, ${view === "day" ? "show month picker" : "show year picker"}`}
          >
            {headerLabel}
          </button>
        )}
        <Button
          type="button"
          variant="secondary"
          className="rebar-calendar-nav"
          aria-label={nextLabel}
          onClick={handleNext}
        >
          <ChevronRightIcon />
        </Button>
      </div>

      {view === "day" ? (
        <>
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
        </>
      ) : view === "month" ? (
        <div className="rebar-calendar-grid rebar-calendar-grid-month" data-rebar-part="month-grid">
          {MONTH_LABELS.map((label, monthIndex) => {
            const isCurrent = browseYear === currentMonth.getFullYear() && monthIndex === currentMonth.getMonth();
            return (
              <button
                key={label}
                type="button"
                className="rebar-calendar-cell"
                data-rebar-part="month-cell"
                data-rebar-selected={isCurrent || undefined}
                onClick={() => pickMonth(monthIndex)}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rebar-calendar-grid rebar-calendar-grid-year" data-rebar-part="year-grid">
          {Array.from({ length: 12 }, (_, i) => currentDecadeStart + i).map((year) => {
            const isCurrent = year === currentMonth.getFullYear();
            return (
              <button
                key={year}
                type="button"
                className="rebar-calendar-cell"
                data-rebar-part="year-cell"
                data-rebar-selected={isCurrent || undefined}
                onClick={() => pickYear(year)}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
