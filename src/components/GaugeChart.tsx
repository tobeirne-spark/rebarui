import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

export interface GaugeChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  value: number;
  min?: number;
  max?: number;
  /** A short caption under the numeric value (e.g. "CPU usage") — distinct from `title`, which is
   * the whole chart's own caption. */
  label?: string;
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` (then `label`) when omitted — the chart's own `role="img"` accessible
   * name. */
  ariaLabel?: string;
  size?: number;
  valueFormat?: (v: number) => string;
}

// Rounded on purpose — see PieChart.tsx's `round` for why: Math.cos/Math.sin can differ in their
// last floating-point digit between server (Node) and client (browser) for the same input,
// producing a real React hydration-mismatch warning on the rendered path string otherwise.
function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: round(cx + r * Math.cos(rad)), y: round(cy + r * Math.sin(rad)) };
}

// A single arc from startAngle to endAngle (degrees, clockwise from 12 o'clock, so -90..90 traces
// the top half-circle left-to-right). Returns "" for a zero-length sweep — a fully-empty gauge
// (value clamped down to `min`) has nothing to draw, and an SVG arc command with coincident start
// and end points is degenerate rather than simply invisible.
function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  if (endAngle <= startAngle) return "";
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/**
 * A single-value radial dial — a half-circle track plus a filled arc showing where `value` sits
 * between `min` and `max`, with the number itself printed in the center. Built for a single at-a-
 * glance metric (a load %, a score) rather than a series over time.
 */
export function GaugeChart({
  value,
  min = 0,
  max = 100,
  label,
  title,
  ariaLabel,
  size = 240,
  valueFormat = (v: number) => Math.round(v).toLocaleString(),
  className,
  ...props
}: GaugeChartProps) {
  const width = size;
  const height = size * 0.62;
  const cx = width / 2;
  const cy = height - size * 0.1;
  const r = size / 2 - size * 0.1;
  const strokeWidth = Math.max(size * 0.09, 10);

  const range = max - min;
  // Clamped strictly for the arc's own fill fraction — a value overshooting `max` (a real sensor
  // spike, say) still pegs the needle at full rather than overflowing past the track or rendering a
  // backwards arc. The raw, unclamped `value` is still what's printed in the center (ref/HEURISTICS
  // #2, match the real world) so an overshoot is visible as a number, not silently hidden.
  const rawFraction = range !== 0 ? (value - min) / range : 0;
  const fraction = Math.max(0, Math.min(1, rawFraction));

  const trackStart = -90;
  const trackEnd = 90;
  const valueEnd = trackStart + 180 * fraction;

  return (
    <figure
      className={clsx("rebar-chart", "rebar-gauge-chart", className)}
      data-rebar-component="gauge-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? label ?? "Gauge chart"}
      >
        <path
          data-rebar-part="track"
          d={arcPath(cx, cy, r, trackStart, trackEnd)}
          fill="none"
          stroke="var(--rebar-color-border, #e0e0e0)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {valueEnd > trackStart ? (
          <path
            data-rebar-part="value"
            d={arcPath(cx, cy, r, trackStart, valueEnd)}
            fill="none"
            stroke="var(--rebar-color-primary, #0066cc)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        ) : null}
        <text
          x={cx}
          y={cy - size * 0.02}
          fontSize={size * 0.14}
          textAnchor="middle"
          fill="var(--rebar-color-text-primary, #212121)"
          style={{ fontWeight: 600 }}
        >
          {valueFormat(value)}
        </text>
        {label ? (
          <text x={cx} y={cy + size * 0.09} fontSize={size * 0.055} textAnchor="middle" fill="var(--rebar-color-text-secondary, #757575)">
            {label}
          </text>
        ) : null}
        <text x={cx - r} y={cy + size * 0.09} fontSize={11} textAnchor="middle" fill="var(--rebar-color-text-secondary, #757575)">
          {valueFormat(min)}
        </text>
        <text x={cx + r} y={cy + size * 0.09} fontSize={11} textAnchor="middle" fill="var(--rebar-color-text-secondary, #757575)">
          {valueFormat(max)}
        </text>
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
