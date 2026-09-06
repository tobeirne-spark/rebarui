import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";

export interface ScatterChartSeries {
  label: string;
  /** Defaults to the next color in a small built-in palette, cycled by series index — supply one
   * explicitly only when a specific color carries real meaning (e.g. matching another chart on
   * the same page). */
  color?: string;
  values: number[];
}

export interface ScatterChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  series: ScatterChartSeries[];
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
 * A distribution scatter plot — each series' individual values plotted as a jittered column of
 * points, with a dashed line marking that series' mean. Built for comparing several runs' worth of
 * a measured value across a small number of conditions (see this project's own `/benchmarks`,
 * the real, repeated use case this component was promoted from).
 */
export function ScatterChart({
  series,
  title,
  ariaLabel,
  height = 320,
  yFormat = (v: number) => Math.round(v).toLocaleString(),
  className,
  ...props
}: ScatterChartProps) {
  const width = 700;
  const marginLeft = 62;
  const marginRight = 16;
  const marginTop = 16;
  const marginBottom = 46;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const allValues = series.flatMap((s) => s.values);
  if (allValues.length === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-scatter-chart", className)}
        data-rebar-component="scatter-chart"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(height)}
      </figure>
    );
  }
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const pad = (rawMax - rawMin) * 0.12 || rawMax * 0.1 || 1;
  const yMin = rawMin - pad;
  const yMax = rawMax + pad;
  const yScale = (v: number) => marginTop + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => yMin + ((yMax - yMin) * i) / (tickCount - 1));

  const n = series.length;
  const bandWidth = plotWidth / n;

  return (
    <figure
      className={clsx("rebar-chart", "rebar-scatter-chart", className)}
      data-rebar-component="scatter-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Scatter chart"}
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
        {series.map((s, i) => {
          const color = s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
          const cx = marginLeft + bandWidth * (i + 0.5);
          const mean = s.values.reduce((a, b) => a + b, 0) / s.values.length;
          return (
            <g key={s.label}>
              <line
                x1={cx - bandWidth * 0.32}
                y1={yScale(mean)}
                x2={cx + bandWidth * 0.32}
                y2={yScale(mean)}
                stroke={color}
                strokeWidth={2}
                strokeDasharray="4 3"
              />
              {s.values.map((v, j) => {
                // Deterministic pseudo-jitter so points within a band don't stack in a single column.
                const jitter = (((j * 7) % 11) / 10 - 0.5) * bandWidth * 0.5;
                return <circle key={j} cx={cx + jitter} cy={yScale(v)} r={4} fill={color} opacity={0.8} />;
              })}
              <text
                x={cx}
                y={height - marginBottom + 22}
                fontSize={11}
                textAnchor="middle"
                fill={color}
                style={{ whiteSpace: "pre" }}
              >
                {s.label}
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
