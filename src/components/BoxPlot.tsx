import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";

export interface BoxPlotGroup {
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  /** Defaults to the next color in a small built-in palette, cycled by group index — supply one
   * explicitly only when a specific color carries real meaning (e.g. matching another chart on
   * the same page). */
  color?: string;
}

export interface BoxPlotProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  /** Pre-computed five-number summary per group — this component draws the box/whiskers, it
   * doesn't compute quartiles from raw sample data. */
  groups: BoxPlotGroup[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16: a chart
   * ships with a title, not just an accessible name a sighted reader never sees. Optional only so
   * a chart embedded somewhere its own heading already serves this role doesn't get a duplicate
   * one; supplying it is the default expectation, not an edge case. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  height?: number;
  yFormat?: (v: number) => string;
}

const DEFAULT_PALETTE = [
  "var(--rebar-color-text-secondary, #757575)",
  "var(--rebar-color-primary, #0066cc)",
  "var(--rebar-color-success, #2e7d32)",
  "var(--rebar-color-warning, #f57c00)",
  "var(--rebar-color-danger, #d32f2f)",
];

/**
 * A statistical distribution chart — each group drawn as a vertical box-and-whisker from a
 * pre-computed five-number summary (min/q1/median/q3/max), side by side on a shared numeric
 * y-scale. Built for comparing the spread of several groups' worth of a measured value at a
 * glance, without plotting every raw sample.
 */
export function BoxPlot({
  groups,
  title,
  ariaLabel,
  height = 320,
  yFormat = (v: number) => Math.round(v).toLocaleString(),
  className,
  ...props
}: BoxPlotProps) {
  const width = 700;
  const marginLeft = 62;
  const marginRight = 16;
  const marginTop = 16;
  const marginBottom = 46;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  if (groups.length === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-box-plot", className)}
        data-rebar-component="box-plot"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(height)}
      </figure>
    );
  }
  const allValues = groups.flatMap((g) => [g.min, g.max]);
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const pad = (rawMax - rawMin) * 0.12 || rawMax * 0.1 || 1;
  const yMin = rawMin - pad;
  const yMax = rawMax + pad;
  const yScale = (v: number) => marginTop + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => yMin + ((yMax - yMin) * i) / (tickCount - 1));

  const n = groups.length;
  const bandWidth = plotWidth / n;
  const boxWidth = bandWidth * 0.4;

  return (
    <figure
      className={clsx("rebar-chart", "rebar-box-plot", className)}
      data-rebar-component="box-plot"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Box plot"}
      >
        {ticks.map((t, i) => {
          const y = yScale(t);
          return (
            <g key={i}>
              <line x1={marginLeft} y1={y} x2={width - marginRight} y2={y} stroke="var(--rebar-color-border, #e0e0e0)" strokeWidth={1} />
              <text x={marginLeft - 8} y={y + 4} fontSize={11} textAnchor="end" fill="var(--rebar-color-text-secondary, #757575)">
                {yFormat(t)}
              </text>
            </g>
          );
        })}
        {groups.map((g, i) => {
          const color = g.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
          const cx = marginLeft + bandWidth * (i + 0.5);
          const yMinPx = yScale(g.min);
          const yMaxPx = yScale(g.max);
          const yQ1 = yScale(g.q1);
          const yQ3 = yScale(g.q3);
          const yMedian = yScale(g.median);
          const boxTop = Math.min(yQ1, yQ3);
          const boxHeight = Math.abs(yQ1 - yQ3);
          return (
            <g key={g.label} data-rebar-part="box-plot-group">
              <line
                data-rebar-part="box-plot-whisker"
                x1={cx}
                y1={yMaxPx}
                x2={cx}
                y2={yMinPx}
                stroke={color}
                strokeWidth={2}
              />
              <rect
                data-rebar-part="box-plot-box"
                x={cx - boxWidth / 2}
                y={boxTop}
                width={boxWidth}
                height={boxHeight}
                fill={color}
                fillOpacity={0.25}
                stroke={color}
                strokeWidth={2}
              />
              <line
                data-rebar-part="box-plot-median"
                x1={cx - boxWidth / 2}
                y1={yMedian}
                x2={cx + boxWidth / 2}
                y2={yMedian}
                stroke={color}
                strokeWidth={2}
              />
              <text
                x={cx}
                y={height - marginBottom + 22}
                fontSize={12}
                textAnchor="middle"
                fill={color}
                style={{ fontWeight: 600 }}
              >
                {g.label}
              </text>
            </g>
          );
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
          {title}
        </figcaption>
      ) : null}
    </figure>
  );
}
