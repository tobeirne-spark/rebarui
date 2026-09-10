import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface GanttChartTask {
  id: string;
  label: string;
  start: Date;
  end: Date;
  /** 0-1. Renders a partial fill inside the task's own bar when provided; the bar renders as a
   * single solid color when omitted. */
  progress?: number;
  /** Ids of tasks that must complete before this one starts. A dangling id (no matching task) is
   * silently skipped rather than throwing — a caller mid-edit of a task list may reference a task
   * that's been renamed or removed. */
  dependsOn?: string[];
}

export interface GanttChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  tasks: GanttChartTask[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  rowHeight?: number;
  width?: number;
  /** Formats an axis tick's `Date` for display. Defaults to a fixed "Mon D" format computed from
   * UTC fields (not `toLocaleDateString`/`Intl`) so the same `Date` renders identical text
   * regardless of the server's or a viewer's own locale/timezone — a locale- or timezone-dependent
   * format string here would be a real server/client hydration mismatch risk, the same class of
   * bug this project's chart components already guard against for trig-derived SVG coordinates
   * (see `PieChart.tsx`'s `round()` helper). */
  dateFormat?: (d: Date) => string;
  /** Force bionic reading on/off for the title, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function defaultDateFormat(d: Date): string {
  return `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/**
 * A project timeline — one horizontal bar per task, positioned and sized proportional to a shared
 * date axis spanning the earliest `start` to the latest `end` across all `tasks`, with a real
 * completion fill (`progress`) and simple elbow connector lines for `dependsOn` relationships.
 * Purely presentational and static — no drag-to-reschedule, no zoom; a task list this small
 * doesn't need pan/zoom chrome, and reordering/resizing belongs to whatever owns the underlying
 * schedule data, not to this chart.
 */
export function GanttChart({
  tasks,
  title,
  ariaLabel,
  rowHeight = 32,
  width = 640,
  dateFormat = defaultDateFormat,
  bionic,
  bionicOptions,
  className,
  ...props
}: GanttChartProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const marginLeft = 140;
  const marginRight = 16;
  const marginTop = 28;
  const marginBottom = 12;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = tasks.length * rowHeight;
  const height = marginTop + plotHeight + marginBottom;

  if (tasks.length === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-gantt-chart", className)}
        data-rebar-component="gantt-chart"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(200)}
      </figure>
    );
  }
  const times = tasks.flatMap((t) => [t.start.getTime(), t.end.getTime()]);
  const rawMin = times.length ? Math.min(...times) : 0;
  const rawMax = times.length ? Math.max(...times) : 0;
  const rawRange = rawMax - rawMin;
  // A single instant (one task, or every task sharing the same start/end) has no real range to
  // scale against — fall back to a symmetric one-day window so the axis still renders sensibly
  // instead of dividing by zero.
  const oneDay = 24 * 60 * 60 * 1000;
  const domainMin = rawRange > 0 ? rawMin : rawMin - oneDay / 2;
  const domainMax = rawRange > 0 ? rawMax : rawMax + oneDay / 2;
  const domainRange = domainMax - domainMin;

  const xScale = (t: number) => marginLeft + ((t - domainMin) / domainRange) * plotWidth;

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => domainMin + (domainRange * i) / (tickCount - 1));

  const taskIndexById = new Map(tasks.map((t, i) => [t.id, i]));

  return (
    <figure
      className={clsx("rebar-chart", "rebar-gantt-chart", className)}
      data-rebar-component="gantt-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Gantt chart"}
      >
        {ticks.map((t, i) => {
          const x = xScale(t);
          return (
            <g key={i}>
              <line
                data-rebar-part="tick-line"
                x1={x}
                y1={marginTop}
                x2={x}
                y2={marginTop + plotHeight}
                stroke="var(--rebar-color-border, #e0e0e0)"
                strokeWidth={1}
              />
              <text
                data-rebar-part="tick-label"
                x={x}
                y={marginTop - 10}
                fontSize={11}
                textAnchor="middle"
                fill="var(--rebar-color-text-secondary, #757575)"
              >
                {dateFormat(new Date(t))}
              </text>
            </g>
          );
        })}
        {tasks.map((task, i) => {
          const rowTop = marginTop + i * rowHeight;
          const rowMidY = rowTop + rowHeight / 2;
          const barHeight = rowHeight * 0.6;
          const barY = rowTop + (rowHeight - barHeight) / 2;
          const barStartX = xScale(task.start.getTime());
          const barEndX = xScale(task.end.getTime());
          const barWidth = Math.max(barEndX - barStartX, 2);
          const hasProgress = task.progress !== undefined;
          const progressWidth = hasProgress ? barWidth * Math.max(0, Math.min(1, task.progress as number)) : 0;

          return (
            <g key={task.id}>
              <text
                data-rebar-part="row-label"
                x={marginLeft - 8}
                y={rowMidY + 4}
                fontSize={12}
                textAnchor="end"
                fill="var(--rebar-color-text-primary, #212121)"
              >
                {task.label}
              </text>
              <rect
                data-rebar-part="bar"
                data-task-id={task.id}
                x={barStartX}
                y={barY}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={hasProgress ? "var(--rebar-color-bg-secondary, #f0f0f0)" : "var(--rebar-color-primary, #0066cc)"}
                stroke="var(--rebar-color-border, #e0e0e0)"
                strokeWidth={1}
              >
                <title>{`${task.label}: ${task.start.toDateString()} - ${task.end.toDateString()}`}</title>
              </rect>
              {hasProgress ? (
                <rect
                  data-rebar-part="progress-fill"
                  data-task-id={task.id}
                  x={barStartX}
                  y={barY}
                  width={progressWidth}
                  height={barHeight}
                  rx={4}
                  fill="var(--rebar-color-primary, #0066cc)"
                />
              ) : null}
            </g>
          );
        })}
        {tasks.flatMap((task) => {
          const toIndex = taskIndexById.get(task.id);
          if (toIndex === undefined || !task.dependsOn) return [];
          return task.dependsOn.flatMap((depId) => {
            const fromIndex = taskIndexById.get(depId);
            const fromTask = tasks.find((t) => t.id === depId);
            if (fromIndex === undefined || !fromTask) return [];

            const fromX = xScale(fromTask.end.getTime());
            const fromY = marginTop + fromIndex * rowHeight + rowHeight / 2;
            const toX = xScale(task.start.getTime());
            const toY = marginTop + toIndex * rowHeight + rowHeight / 2;
            const midX = fromX + (toX - fromX) / 2;
            const points = `${fromX},${fromY} ${midX},${fromY} ${midX},${toY} ${toX},${toY}`;
            // A small fixed-size arrowhead pointing into the dependent task's bar start — axis-
            // aligned offsets only, no trig involved.
            const arrow = `M ${toX - 6},${toY - 4} L ${toX},${toY} L ${toX - 6},${toY + 4}`;

            return [
              <g key={`${depId}->${task.id}`}>
                <polyline
                  data-rebar-part="dependency-line"
                  data-from={depId}
                  data-to={task.id}
                  points={points}
                  fill="none"
                  stroke="var(--rebar-color-text-secondary, #757575)"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
                <path d={arrow} fill="none" stroke="var(--rebar-color-text-secondary, #757575)" strokeWidth={1.5} />
              </g>,
            ];
          });
        })}
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
