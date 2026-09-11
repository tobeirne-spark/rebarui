import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface PieChartSlice {
  label: string;
  value: number;
  /** Defaults to the next color in a small built-in palette, cycled by slice index — supply one
   * explicitly only when a specific color carries real meaning. */
  color?: string;
  /** Visually pops this slice outward from the center — the standard "exploded pie" convention for
   * calling attention to one or more slices, distinct from `labelPosition` (which controls where
   * every slice's text goes, not which slice stands out). */
  exploded?: boolean;
}

export type PieChartLabelPosition = "legend" | "inside" | "outside";

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
  /** Where each slice's label/percentage appears. `"legend"` (default): a swatch + label +
   * percentage row below the chart, as before. `"inside"`: the percentage sits centered inside
   * each slice wide enough to hold it legibly (a sliver too thin to read stays unlabeled rather
   * than overflowing its own slice). `"outside"`: label + percentage placed just past the arc with
   * a short leader line — the standard convention for a pie with several small slices where
   * "inside" would be illegible. The legend row is omitted for `"inside"`/`"outside"` since the
   * per-slice labels already carry the same information. */
  labelPosition?: PieChartLabelPosition;
  /** Force bionic reading on/off for the title, overriding the ambient data-rebar-bionic setting. */
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
// The distance (in SVG units) an `exploded` slice is pushed outward along its own bisector, and
// how far past the outer radius an `"outside"` label + leader line sits.
const EXPLODE_OFFSET = 10;
const OUTSIDE_LABEL_GAP = 18;
// Extra viewBox margin reserved for the label text itself (beyond the leader-line gap above) —
// generous rather than measured, since SVG text width isn't known ahead of layout; a slice
// pointing straight left/right needs the *whole* label string to fit between the arc and the
// viewBox edge, not just the leader line's own short gap.
const OUTSIDE_TEXT_BUDGET = 110;
// A slice narrower than this fraction of the whole pie can't legibly hold its own "inside" label —
// left unlabeled rather than overflowing into its neighbors.
const MIN_INSIDE_LABEL_FRACTION = 0.06;

export function PieChart({
  slices,
  title,
  ariaLabel,
  size = 240,
  innerRadiusRatio = 0,
  labelPosition = "legend",
  bionic,
  bionicOptions,
  className,
  ...props
}: PieChartProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const hasExploded = slices.some((s) => s.exploded);
  // "outside" labels and any exploded slice both need extra breathing room past the base circle —
  // padding is added to the viewBox (not the circle itself) so the arcs stay the same size either
  // way, just with more margin around them.
  const margin =
    4 +
    (labelPosition === "outside" ? OUTSIDE_LABEL_GAP + OUTSIDE_TEXT_BUDGET : 0) +
    (hasExploded ? EXPLODE_OFFSET : 0);
  const viewSize = size + margin * 2;
  const cx = viewSize / 2;
  const cy = viewSize / 2;
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
    const midAngle = (startAngle + endAngle) / 2;
    return { ...slice, color, fraction, startAngle, endAngle, midAngle };
  });

  return (
    <figure
      className={clsx("rebar-chart", "rebar-pie-chart", className)}
      data-rebar-component="pie-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${viewSize} ${viewSize}`}
        style={{ width: "100%", maxWidth: viewSize, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Pie chart"}
      >
        {computed.map((slice) => {
          // Same angle convention `polarToCartesian` uses (0deg = 12 o'clock, clockwise) so an
          // exploded slice's push direction matches its own visual bisector exactly.
          const rad = ((slice.midAngle - 90) * Math.PI) / 180;
          const explodeDx = slice.exploded ? round(Math.cos(rad) * EXPLODE_OFFSET) : 0;
          const explodeDy = slice.exploded ? round(Math.sin(rad) * EXPLODE_OFFSET) : 0;
          const midR = (outerR + innerR) / 2;
          const insideLabelPos = polarToCartesian(cx, cy, midR, slice.midAngle);
          const outsideLabelPos = polarToCartesian(cx, cy, outerR + OUTSIDE_LABEL_GAP, slice.midAngle);
          const leaderStart = polarToCartesian(cx, cy, outerR, slice.midAngle);
          const isRightHalf = Math.cos(rad) >= 0;
          return (
            <g
              key={slice.label}
              data-rebar-part="slice-group"
              transform={explodeDx || explodeDy ? `translate(${explodeDx} ${explodeDy})` : undefined}
            >
              <path
                data-rebar-part="slice"
                data-rebar-exploded={slice.exploded || undefined}
                d={slicePath(cx, cy, outerR, innerR, slice.startAngle, slice.endAngle)}
                fill={slice.color}
              />
              {labelPosition === "inside" && slice.fraction >= MIN_INSIDE_LABEL_FRACTION ? (
                <text
                  data-rebar-part="inside-label"
                  x={insideLabelPos.x}
                  y={insideLabelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  fill="var(--rebar-color-bg-primary, #ffffff)"
                  style={{ fontWeight: 600, pointerEvents: "none" }}
                >
                  {Math.round(slice.fraction * 100)}%
                </text>
              ) : null}
              {labelPosition === "outside" ? (
                <g data-rebar-part="outside-label">
                  <line
                    x1={leaderStart.x}
                    y1={leaderStart.y}
                    x2={outsideLabelPos.x}
                    y2={outsideLabelPos.y}
                    stroke="var(--rebar-color-text-secondary, #757575)"
                    strokeWidth={1}
                  />
                  <text
                    x={outsideLabelPos.x + (isRightHalf ? 3 : -3)}
                    y={outsideLabelPos.y}
                    textAnchor={isRightHalf ? "start" : "end"}
                    dominantBaseline="middle"
                    fontSize={11}
                    fill="var(--rebar-color-text-primary, #212121)"
                  >
                    {slice.label} ({Math.round(slice.fraction * 100)}%)
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
      {labelPosition === "legend" ? (
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
      ) : null}
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
