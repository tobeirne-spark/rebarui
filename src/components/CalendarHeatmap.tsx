import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { ChartValueTag, useChartMarkSelection } from "../chartMarkSelection";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface CalendarHeatmapCell {
  /** `"YYYY-MM-DD"`. */
  date: string;
  value: number;
}

export interface CalendarHeatmapProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  /** Sparse — a date absent from `data` renders as a distinctly empty/neutral cell rather than a
   * real value of 0, the same convention `Heatmap` already uses. */
  data: CalendarHeatmapCell[];
  /** `"YYYY-MM-DD"`. Defaults to the earliest date in `data`. */
  startDate?: string;
  /** `"YYYY-MM-DD"`. Defaults to the latest date in `data`. */
  endDate?: string;
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  /** Side length of one day cell, in SVG units. */
  cellSize?: number;
  /** Maps a value normalized to 0-1 (relative to the min/max `value` across all of `data`) to a
   * CSS color string. Defaults to a simple light-to-dark blend of the same token `Heatmap` uses. */
  colorScale?: (normalizedValue: number) => string;
  /** Force bionic reading on/off for the title, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

const DEFAULT_COLOR_SCALE = (normalizedValue: number): string => {
  const t = Math.max(0, Math.min(1, normalizedValue));
  const percent = Math.round(8 + t * 92);
  return "color-mix(in srgb, var(--rebar-color-primary, #0066cc) " + percent + "%, transparent)";
};

const MISSING_CELL_FILL = "var(--rebar-color-bg-secondary, #f0f0f0)";
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MS_PER_DAY = 86_400_000;

function parseDateUTC(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y!, (m ?? 1) - 1, d ?? 1) / MS_PER_DAY;
}

// Epoch day 0 (1970-01-01) was a Thursday — this offset maps any epoch-day count onto 0=Sunday.
function dayOfWeekUTC(epochDay: number): number {
  return ((epochDay + 4) % 7 + 7) % 7;
}

function formatDateUTC(epochDay: number): string {
  const date = new Date(epochDay * MS_PER_DAY);
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/**
 * A GitHub-contributions-style calendar — one small square per day, arranged in week columns and
 * day-of-week rows, shaded by that day's `value`. A genuinely different shape from `Heatmap`
 * (an arbitrary row/col matrix with no date semantics at all): this one lays out real calendar
 * weeks, labels months along the top, and treats a missing date as a distinctly empty cell rather
 * than a real 0 — the same sparse-data convention `Heatmap` already uses, just over a real
 * date axis instead of arbitrary category pairs.
 */
export function CalendarHeatmap({
  data,
  startDate,
  endDate,
  title,
  ariaLabel,
  cellSize = 12,
  colorScale = DEFAULT_COLOR_SCALE,
  bionic,
  bionicOptions,
  className,
  ...props
}: CalendarHeatmapProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const { activeKey, isSelected, getMarkProps, backgroundProps } = useChartMarkSelection<string>();

  if (data.length === 0 && !startDate && !endDate) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-calendar-heatmap", className)}
        data-rebar-component="calendar-heatmap"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(160)}
      </figure>
    );
  }

  const lookup = new Map<number, number>();
  for (const cell of data) lookup.set(parseDateUTC(cell.date), cell.value);

  const dataEpochDays = data.map((d) => parseDateUTC(d.date));
  const rangeStart = startDate ? parseDateUTC(startDate) : Math.min(...dataEpochDays);
  const rangeEnd = endDate ? parseDateUTC(endDate) : Math.max(...dataEpochDays);
  const alignedStart = rangeStart - dayOfWeekUTC(rangeStart);
  const totalDays = rangeEnd - alignedStart + 1;
  const weekCount = Math.ceil(totalDays / 7);

  const values = data.map((d) => d.value);
  const valueMin = values.length ? Math.min(...values) : 0;
  const valueMax = values.length ? Math.max(...values) : 1;
  const valueRange = valueMax - valueMin;

  const dayLabelWidth = 28;
  const monthLabelHeight = 16;
  const legendHeight = 20;
  const gap = 2;
  const width = dayLabelWidth + weekCount * (cellSize + gap);
  const gridHeight = 7 * (cellSize + gap);
  const height = monthLabelHeight + gridHeight + legendHeight;

  const cellX = (week: number) => dayLabelWidth + week * (cellSize + gap);
  const cellY = (dow: number) => monthLabelHeight + dow * (cellSize + gap);

  // A month label goes at the first column whose top (Sunday) row falls in a month different
  // from the previous column's — so each month is labeled exactly once, at the week it begins.
  const monthLabels: { week: number; label: string }[] = [];
  let lastMonth = -1;
  for (let week = 0; week < weekCount; week++) {
    const epochDay = alignedStart + week * 7;
    const date = new Date(epochDay * MS_PER_DAY);
    const month = date.getUTCMonth();
    if (month !== lastMonth) {
      monthLabels.push({ week, label: MONTH_NAMES[month]! });
      lastMonth = month;
    }
  }

  const activeEpochDay = activeKey ? Number(activeKey) : null;
  const activeValue = activeEpochDay !== null ? lookup.get(activeEpochDay) : undefined;

  return (
    <figure
      className={clsx("rebar-chart", "rebar-calendar-heatmap", className)}
      data-rebar-component="calendar-heatmap"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Calendar heatmap"}
        {...backgroundProps}
      >
        <rect x={0} y={0} width={width} height={height} fill="transparent" data-rebar-part="chart-background" />
        {monthLabels.map(({ week, label }) => (
          <text
            key={week}
            x={cellX(week)}
            y={monthLabelHeight - 5}
            fontSize={10}
            fill="var(--rebar-color-text-secondary, #757575)"
          >
            {label}
          </text>
        ))}
        {[1, 3, 5].map((dow) => (
          <text
            key={dow}
            x={dayLabelWidth - 6}
            y={cellY(dow) + cellSize - 2}
            fontSize={9}
            textAnchor="end"
            fill="var(--rebar-color-text-secondary, #757575)"
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow]}
          </text>
        ))}
        {Array.from({ length: weekCount * 7 }, (_, i) => alignedStart + i).map((epochDay) => {
          if (epochDay < rangeStart || epochDay > rangeEnd) return null;
          const week = Math.floor((epochDay - alignedStart) / 7);
          const dow = dayOfWeekUTC(epochDay);
          const hasValue = lookup.has(epochDay);
          const value = lookup.get(epochDay);
          const normalized = hasValue && valueRange !== 0 ? ((value as number) - valueMin) / valueRange : hasValue ? 1 : 0;
          const fill = hasValue ? colorScale(normalized) : MISSING_CELL_FILL;
          const key = String(epochDay);
          const selected = hasValue && isSelected(key);
          return (
            <rect
              key={epochDay}
              data-rebar-part={hasValue ? "cell" : "cell-missing"}
              x={cellX(week)}
              y={cellY(dow)}
              width={cellSize}
              height={cellSize}
              rx={2}
              fill={fill}
              stroke={selected ? "var(--rebar-color-border-strong, #333333)" : "transparent"}
              strokeWidth={selected ? 1.5 : 0}
              style={hasValue ? { cursor: "pointer" } : undefined}
              {...(hasValue ? getMarkProps(key) : {})}
            >
              <title>{formatDateUTC(epochDay) + ": " + (hasValue ? value : "no data")}</title>
            </rect>
          );
        })}
        <text
          x={dayLabelWidth}
          y={monthLabelHeight + gridHeight + 14}
          fontSize={10}
          fill="var(--rebar-color-text-secondary, #757575)"
        >
          Less
        </text>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <rect
            key={i}
            x={dayLabelWidth + 34 + i * (cellSize + gap)}
            y={monthLabelHeight + gridHeight + 4}
            width={cellSize}
            height={cellSize}
            rx={2}
            fill={colorScale(t)}
          />
        ))}
        <text
          x={dayLabelWidth + 34 + 5 * (cellSize + gap) + 6}
          y={monthLabelHeight + gridHeight + 14}
          fontSize={10}
          fill="var(--rebar-color-text-secondary, #757575)"
        >
          More
        </text>
        {activeEpochDay !== null && activeValue !== undefined
          ? (() => {
              const week = Math.floor((activeEpochDay - alignedStart) / 7);
              const dow = dayOfWeekUTC(activeEpochDay);
              return (
                <ChartValueTag
                  x={cellX(week) + cellSize / 2}
                  y={cellY(dow)}
                  viewBoxWidth={width}
                  viewBoxHeight={height}
                  lines={[formatDateUTC(activeEpochDay), String(activeValue)]}
                />
              );
            })()
          : null}
      </svg>
      {title ? (
        <figcaption
          data-rebar-part="title"
          style={{
            textAlign: "center",
            fontSize: "var(--rebar-font-size-sm)",
            color: "var(--rebar-color-text-secondary, #757575)",
            marginTop: "var(--rebar-space-xs)",
          }}
        >
          {titleContent}
        </figcaption>
      ) : null}
    </figure>
  );
}
