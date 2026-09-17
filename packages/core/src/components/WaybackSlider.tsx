import { useState } from "react";
import clsx from "clsx";
import { Slider } from "./Slider";

export interface WaybackSliderProps {
  /** Each entry's own reporting/snapshot date, in chronological order — the *only* shape this
   * component knows about. It has no idea what a "snapshot" actually contains (a Gantt chart's
   * task list, a PERT chart's task graph, or anything else): the caller keeps one full historical
   * copy of their own data per date and picks which one to feed its real chart based on which date
   * this slider currently reports, the same "pass in historical snapshots, scrub through them
   * directly" shape requested for both `GanttChart` and `PertChart` rather than either maintaining
   * separate baseline objects internally. */
  dates: Date[];
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date) => void;
  dateFormat?: (d: Date) => string;
  "aria-label"?: string;
  className?: string;
}

function defaultDateFormat(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Dates compared by day, not by exact millisecond — a caller's own `value` (e.g. reconstructed
// from a stored date string, or `new Date()` for "today") only needs to name the same *day* as one
// of `dates` to resolve to that snapshot, not survive a millisecond-exact round-trip.
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * A scrubber over a caller-supplied list of historical snapshot dates — "scrub through real past
 * reports directly" instead of maintaining separate baseline objects, the same mechanism shared by
 * `GanttChart` and `PertChart`'s own wayback-slider asks (composed by the caller alongside either
 * chart, not built into them — this component has no idea which chart, if any, is listening).
 * Built entirely on the real `Slider` (a discrete 0..dates.length-1 index underneath), not a
 * reimplemented drag mechanism.
 */
export function WaybackSlider({
  dates,
  value,
  defaultValue,
  onValueChange,
  dateFormat = defaultDateFormat,
  "aria-label": ariaLabel = "Reporting date",
  className,
}: WaybackSliderProps) {
  const lastIndex = Math.max(dates.length - 1, 0);
  const resolveIndex = (d: Date | undefined): number => {
    if (!d) return lastIndex;
    const found = dates.findIndex((candidate) => sameDay(candidate, d));
    return found >= 0 ? found : lastIndex;
  };

  const [internalIndex, setInternalIndex] = useState(() => resolveIndex(defaultValue));
  const isControlled = value !== undefined;
  const currentIndex = isControlled ? resolveIndex(value) : internalIndex;
  const currentDate = dates[currentIndex];

  const setIndex = (next: number) => {
    if (!isControlled) setInternalIndex(next);
    const nextDate = dates[next];
    if (nextDate) onValueChange?.(nextDate);
  };

  if (dates.length === 0) return null;

  return (
    <div className={clsx("rebar-wayback-slider", className)} data-rebar-component="wayback-slider">
      <div className="rebar-wayback-slider-header">
        <span className="rebar-wayback-slider-date" data-rebar-part="current-date">
          {currentDate ? dateFormat(currentDate) : ""}
        </span>
        {currentIndex === lastIndex ? (
          <span className="rebar-wayback-slider-latest" data-rebar-part="latest-badge">
            Latest
          </span>
        ) : null}
      </div>
      <Slider
        value={currentIndex}
        onValueChange={setIndex}
        min={0}
        max={lastIndex}
        step={1}
        aria-label={ariaLabel}
      />
      <div className="rebar-wayback-slider-ticks" data-rebar-part="ticks">
        <span>{dates[0] ? dateFormat(dates[0]) : ""}</span>
        {dates.length > 1 ? <span>{dateFormat(dates[lastIndex]!)}</span> : null}
      </div>
    </div>
  );
}
