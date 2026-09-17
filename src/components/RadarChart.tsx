import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { useSeriesFilter } from "../chartSeriesFilter";
import { renderBionicChildren, useAmbientBionic, useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface RadarChartSeries {
  label: string;
  /** Defaults to the next color in a small built-in palette, cycled by series index — supply one
   * explicitly only when a specific color carries real meaning (e.g. matching another chart on
   * the same page). */
  color?: string;
  /** One value per axis — same length and order as the chart's own `axes` prop. */
  values: number[];
}

export interface RadarChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  /** Axis labels, evenly spaced around the circle in the order given. */
  axes: string[];
  series: RadarChartSeries[];
  /** Scale ceiling for every axis. Defaults to the max value across all series, so the outermost
   * gridline ring always contains the largest plotted point. */
  maxValue?: number;
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16: a chart
   * ships with a title, not just an accessible name a sighted reader never sees. Optional only so
   * a chart embedded somewhere its own heading already serves this role doesn't get a duplicate
   * one; supplying it is the default expectation, not an edge case. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  size?: number;
  /** Makes each legend item a real toggle button that hides/shows its own series' polygon —
   * off by default (the legend stays plain, non-interactive labels unless this is set). Axis
   * scale stays fixed to the full, unfiltered dataset regardless, so toggling a series doesn't
   * make the remaining ones jump to a new scale. */
  filterable?: boolean;
  /** Force bionic reading on/off for the title and legend labels, overriding the ambient
   * data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

const DEFAULT_PALETTE = [
  "var(--rebar-color-primary, #0066cc)",
  "var(--rebar-color-success, #2e7d32)",
  "var(--rebar-color-warning, #f57c00)",
  "var(--rebar-color-danger, #d32f2f)",
  "var(--rebar-color-text-secondary, #757575)",
];

const RING_COUNT = 4;

// Rounded on purpose — see PieChart.tsx's `round` for why: Math.cos/Math.sin can differ in their
// last floating-point digit between server (Node) and client (browser) for the same input,
// producing a real React hydration-mismatch warning on the rendered point-string otherwise.
function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * A multi-axis polygon comparison chart ("radar"/"spider" chart) — one filled polygon per series,
 * each vertex scaled along its own axis from a shared center. Built for comparing several items
 * across the same small set of dimensions (e.g. a product/spec comparison) at a glance.
 */
export function RadarChart({
  axes,
  series,
  maxValue,
  title,
  ariaLabel,
  size = 280,
  filterable,
  bionic,
  bionicOptions,
  className,
  ...props
}: RadarChartProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;
  const { toggle, isVisible } = useSeriesFilter(series.map((s) => s.label));
  const n = axes.length;
  const margin = 34;
  const center = size / 2;
  const radius = Math.max(size / 2 - margin, 1);

  const allValues = series.flatMap((s) => s.values);
  if (series.length === 0 || allValues.length === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-radar-chart", className)}
        data-rebar-component="radar-chart"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(size)}
      </figure>
    );
  }
  const rawMax = allValues.length ? Math.max(0, ...allValues) : 0;
  const scaleMax = maxValue ?? (rawMax || 1);

  const angleFor = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const pointFor = (i: number, value: number) => {
    const angle = angleFor(i);
    const r = (Math.max(value, 0) / scaleMax) * radius;
    return { x: round(center + r * Math.cos(angle)), y: round(center + r * Math.sin(angle)) };
  };
  const polygonPoints = (valueAt: (i: number) => number) =>
    Array.from({ length: n }, (_, i) => pointFor(i, valueAt(i)))
      .map((p) => `${p.x},${p.y}`)
      .join(" ");

  const ringPolygons = Array.from({ length: RING_COUNT }, (_, ringIndex) => {
    const ringValue = (scaleMax * (ringIndex + 1)) / RING_COUNT;
    return polygonPoints(() => ringValue);
  });

  return (
    <figure
      className={clsx("rebar-chart", "rebar-radar-chart", className)}
      data-rebar-component="radar-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: "100%", maxWidth: size, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Radar chart"}
      >
        {ringPolygons.map((points, i) => (
          <polygon
            key={i}
            data-rebar-part="radar-grid-ring"
            points={points}
            fill="none"
            stroke="var(--rebar-color-border, #e0e0e0)"
            strokeWidth={1}
          />
        ))}
        {axes.map((axis, i) => {
          const angle = angleFor(i);
          const outer = pointFor(i, scaleMax);
          const labelRadius = radius + 14;
          const labelPoint = {
            x: round(center + labelRadius * Math.cos(angle)),
            y: round(center + labelRadius * Math.sin(angle)),
          };
          const cosA = Math.cos(angle);
          const textAnchor = cosA > 0.15 ? "start" : cosA < -0.15 ? "end" : "middle";
          return (
            <g key={axis}>
              <line
                data-rebar-part="radar-axis-line"
                x1={center}
                y1={center}
                x2={outer.x}
                y2={outer.y}
                stroke="var(--rebar-color-border, #e0e0e0)"
                strokeWidth={1}
              />
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                fontSize={11}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fill="var(--rebar-color-text-secondary, #757575)"
              >
                {axis}
              </text>
            </g>
          );
        })}
        {series.map((s, i) => {
          if (filterable && !isVisible(s.label)) return null;
          const color = s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
          const points = polygonPoints((axisIndex) => s.values[axisIndex] ?? 0);
          return (
            <polygon
              key={s.label}
              data-rebar-part="radar-series"
              points={points}
              fill={color}
              fillOpacity={0.18}
              stroke={color}
              strokeWidth={2}
            />
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
          {titleContent}
        </figcaption>
      ) : null}
      {series.length ? (
        <div
          data-rebar-part="legend"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "var(--rebar-space-sm)",
            marginTop: "var(--rebar-space-xs)",
          }}
        >
          {series.map((s, i) => {
            const color = s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
            const swatch = (
              <span
                aria-hidden="true"
                data-rebar-part="legend-swatch"
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: color,
                }}
              />
            );
            const label = renderBionicChildren(s.label, bionicEnabled, bionicOptions);
            return filterable ? (
              <button
                key={s.label}
                type="button"
                data-rebar-part="legend-item"
                className={clsx(
                  "rebar-chart-filter-button",
                  !isVisible(s.label) && "rebar-chart-filter-button-inactive",
                )}
                style={{ display: "inline-flex", alignItems: "center", gap: "var(--rebar-space-xs)" }}
                aria-pressed={isVisible(s.label)}
                onClick={() => toggle(s.label)}
              >
                {swatch}
                {label}
              </button>
            ) : (
              <span
                key={s.label}
                data-rebar-part="legend-item"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--rebar-space-xs)",
                  fontSize: "var(--rebar-font-size-sm)",
                  color: "var(--rebar-color-text-secondary, #757575)",
                }}
              >
                {swatch}
                {label}
              </span>
            );
          })}
        </div>
      ) : null}
    </figure>
  );
}
