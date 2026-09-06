import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";

export interface PieChartSlice {
  label: string;
  value: number;
  /** Defaults to the next color in a small built-in palette, cycled by slice index — supply one
   * explicitly only when a specific color carries real meaning. */
  color?: string;
}

export interface PieChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  slices: PieChartSlice[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16: a chart
   * ships with a title, not just an accessible name a sighted reader never sees. Optional only so
   * a chart embedded somewhere its own heading already serves this role doesn't get a duplicate
   * one; supplying it is the default expectation, not an edge case. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  /** Diameter in SVG units. */
  size?: number;
  /** 0 (default) renders a solid pie; e.g. 0.6 punches a donut hole 60% of the outer radius. */
  innerRadiusRatio?: number;
}

const DEFAULT_PALETTE = [
  "var(--rebar-color-primary, #0066cc)",
  "var(--rebar-color-success, #2e7d32)",
  "var(--rebar-color-warning, #f57c00)",
  "var(--rebar-color-danger, #d32f2f)",
  "var(--rebar-color-text-secondary, #757575)",
];

// Rounded to a fixed precision on purpose: `Math.cos`/`Math.sin` can differ in their last one or
// two floating-point digits between Node (server render) and a browser's own engine build (client
// hydration) for the exact same input — a real, hit-directly React hydration-mismatch warning
// (the SSR-rendered `d` attribute's digits didn't byte-match the client's own recompute). Three
// decimal places is far finer than this chart is ever displayed at, so nothing visible is lost,
// and both environments now agree on the exact same rounded string.
function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: round(cx + r * Math.cos(rad)), y: round(cy + r * Math.sin(rad)) };
}

// Builds the SVG path for one pie/donut slice, from startAngle to endAngle (degrees, clockwise
// from 12 o'clock). A slice spanning the full circle (a single-slice, 100% pie) is clamped just
// short of 360° — the SVG arc command can't express a true full circle as one arc, since its start
// and end point would coincide and leave the renderer with no way to tell which way to sweep.
function slicePath(cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number): string {
  const sweep = Math.min(endAngle - startAngle, 359.999);
  const clampedEnd = startAngle + sweep;
  const largeArc = sweep > 180 ? 1 : 0;
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, clampedEnd);

  if (innerR <= 0) {
    return [
      `M ${cx} ${cy}`,
      `L ${outerStart.x} ${outerStart.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      "Z",
    ].join(" ");
  }

  const innerAtEnd = polarToCartesian(cx, cy, innerR, clampedEnd);
  const innerAtStart = polarToCartesian(cx, cy, innerR, startAngle);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerAtEnd.x} ${innerAtEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerAtStart.x} ${innerAtStart.y}`,
    "Z",
  ].join(" ");
}

/**
 * A proportional slice chart — pie by default, donut via `innerRadiusRatio`. Built for showing how
 * a small number of parts make up a whole, with a legend row (swatch + label + percentage) below
 * the arcs rather than labels crammed inside thin slices.
 */
export function PieChart({
  slices,
  title,
  ariaLabel,
  size = 240,
  innerRadiusRatio = 0,
  className,
  ...props
}: PieChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * Math.max(0, Math.min(innerRadiusRatio, 0.95));

  const total = slices.reduce((sum, s) => sum + Math.max(s.value, 0), 0);
  if (slices.length === 0 || total === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-pie-chart", className)}
        data-rebar-component="pie-chart"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(size)}
      </figure>
    );
  }

  let cumulative = 0;
  const computed = slices.map((slice, i) => {
    const color = slice.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length] ?? "var(--rebar-color-primary, #0066cc)";
    const value = Math.max(slice.value, 0);
    const fraction = total > 0 ? value / total : 0;
    const startAngle = cumulative * 360;
    cumulative += fraction;
    const endAngle = cumulative * 360;
    return { ...slice, color, fraction, startAngle, endAngle };
  });

  return (
    <figure
      className={clsx("rebar-chart", "rebar-pie-chart", className)}
      data-rebar-component="pie-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: "100%", maxWidth: size, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Pie chart"}
      >
        {computed.map((slice) => (
          <path
            key={slice.label}
            data-rebar-part="slice"
            d={slicePath(cx, cy, outerR, innerR, slice.startAngle, slice.endAngle)}
            fill={slice.color}
          />
        ))}
      </svg>
      <div
        data-rebar-part="legend"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "var(--rebar-space-sm, 8px)",
          marginTop: "var(--rebar-space-xs, 4px)",
        }}
      >
        {computed.map((slice) => (
          <span
            key={slice.label}
            data-rebar-part="legend-item"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: "var(--rebar-font-size-sm, 12px)",
              color: "var(--rebar-color-text-primary, #212121)",
            }}
          >
            <span
              aria-hidden="true"
              data-rebar-part="legend-swatch"
              style={{ width: 10, height: 10, borderRadius: 2, background: slice.color, display: "inline-block" }}
            />
            {slice.label} ({Math.round(slice.fraction * 100)}%)
          </span>
        ))}
      </div>
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
