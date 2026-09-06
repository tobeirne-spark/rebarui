import { forwardRef, useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { Popover } from "./Popover";

export interface TimePickerProps
  extends Omit<ComponentPropsWithoutRef<"button">, "value" | "defaultValue" | "onChange"> {
  /** 24-hour `"HH:MM"`, e.g. `"14:30"` — the wire format regardless of display `format`. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (time: string) => void;
  /** Display format only; `value` is always 24-hour `"HH:MM"`. Defaults to `"12h"`. */
  format?: "12h" | "24h";
  /** e.g. `15` shows only `:00`/`:15`/`:30`/`:45`. Defaults to `1` (every minute). */
  minuteStep?: number;
}

interface ParsedTime {
  hour: number;
  minute: number;
}

function parseTime(time: string): ParsedTime {
  const [h, m] = time.split(":").map((part) => Number.parseInt(part, 10));
  return { hour: Number.isFinite(h) ? h! : 0, minute: Number.isFinite(m) ? m! : 0 };
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDisplay(time: string, format: "12h" | "24h"): string {
  const { hour, minute } = parseTime(time);
  const mm = String(minute).padStart(2, "0");
  if (format === "24h") return `${String(hour).padStart(2, "0")}:${mm}`;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${mm} ${period}`;
}

function minutesForStep(step: number): number[] {
  const minutes: number[] = [];
  for (let m = 0; m < 60; m += step) minutes.push(m);
  return minutes;
}

/**
 * Patterned after `Select`/`ColorPicker`: a trigger button showing the current time, opening a
 * real `Popover` containing two scrollable value columns (hour, minute — plain vertically-stacked
 * real `<button>`s, not a native `<select>`) plus an AM/PM toggle in 12-hour format. Picking an
 * hour or minute applies immediately, same as `Select`'s own no-separate-confirm-step behavior.
 *
 * Unlike `Select` (whose Radix `Item` closes the popover on pick, a fine convention for a single,
 * complete choice), this component keeps the popover open across an hour *and* a minute pick —
 * closing on the first would force reopening it to set the second half of the value. It still
 * closes normally on outside click/Escape (`Popover`'s own default), and immediately reflects
 * every pick in the trigger label, so nothing about the value is left unconfirmed.
 */
export const TimePicker = forwardRef<HTMLButtonElement, TimePickerProps>(function TimePicker(
  {
    value,
    defaultValue = "00:00",
    onValueChange,
    format = "12h",
    minuteStep = 1,
    disabled,
    className,
    "aria-label": ariaLabel = "Select a time",
    ...props
  },
  ref,
) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internalValue;

  const setValue = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  const [open, setOpen] = useState(false);

  const { hour: hour24, minute } = parseTime(current);
  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const displayHour = hour24 % 12 === 0 ? 12 : hour24 % 12;

  const hourValues = format === "24h" ? Array.from({ length: 24 }, (_, i) => i) : Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteValues = minutesForStep(minuteStep);

  const selectHour = (h: number) => {
    if (format === "24h") {
      setValue(formatTime(h, minute));
      return;
    }
    const nextHour24 = period === "PM" ? (h % 12) + 12 : h % 12;
    setValue(formatTime(nextHour24, minute));
  };

  const selectMinute = (m: number) => {
    setValue(formatTime(hour24, m));
  };

  const selectPeriod = (nextPeriod: "AM" | "PM") => {
    const nextHour24 = nextPeriod === "PM" ? (displayHour % 12) + 12 : displayHour % 12;
    setValue(formatTime(nextHour24, minute));
  };

  const selectedHourRef = useRef<HTMLButtonElement | null>(null);
  const selectedMinuteRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    selectedHourRef.current?.scrollIntoView({ block: "nearest" });
    selectedMinuteRef.current?.scrollIntoView({ block: "nearest" });
  }, [open]);

  const currentHourValue = format === "24h" ? hour24 : displayHour;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          ref={ref}
          type="button"
          className={clsx("rebar-time-picker-trigger", className)}
          data-rebar-component="time-picker"
          aria-label={`${ariaLabel}, current time ${formatDisplay(current, format)}`}
          disabled={disabled}
          {...props}
        >
          {formatDisplay(current, format)}
        </button>
      }
    >
      <div className="rebar-time-picker-panel" data-rebar-part="panel">
        <div className="rebar-time-picker-column" data-rebar-part="hours" role="listbox" aria-label="Hour">
          {hourValues.map((h) => {
            const selected = h === currentHourValue;
            return (
              <button
                key={h}
                ref={selected ? selectedHourRef : undefined}
                type="button"
                role="option"
                aria-selected={selected}
                className="rebar-time-picker-option"
                data-rebar-part="hour"
                data-rebar-selected={selected || undefined}
                onClick={() => selectHour(h)}
              >
                {format === "24h" ? String(h).padStart(2, "0") : h}
              </button>
            );
          })}
        </div>
        <div className="rebar-time-picker-column" data-rebar-part="minutes" role="listbox" aria-label="Minute">
          {minuteValues.map((m) => {
            const selected = m === minute;
            return (
              <button
                key={m}
                ref={selected ? selectedMinuteRef : undefined}
                type="button"
                role="option"
                aria-selected={selected}
                className="rebar-time-picker-option"
                data-rebar-part="minute"
                data-rebar-selected={selected || undefined}
                onClick={() => selectMinute(m)}
              >
                {String(m).padStart(2, "0")}
              </button>
            );
          })}
        </div>
        {format === "12h" ? (
          <div className="rebar-time-picker-period" data-rebar-part="period-toggle">
            <button
              type="button"
              className="rebar-time-picker-period-option"
              data-rebar-part="period-am"
              data-rebar-selected={period === "AM" || undefined}
              aria-pressed={period === "AM"}
              onClick={() => selectPeriod("AM")}
            >
              AM
            </button>
            <button
              type="button"
              className="rebar-time-picker-period-option"
              data-rebar-part="period-pm"
              data-rebar-selected={period === "PM" || undefined}
              aria-pressed={period === "PM"}
              onClick={() => selectPeriod("PM")}
            >
              PM
            </button>
          </div>
        ) : null}
      </div>
    </Popover>
  );
});
