import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

export interface StackedBarChartSegment {
  label: string;
  value: number;
  /** Defaults to the next color in a small built-in palette, cycled within each bar's own
   * segments — supply one explicitly when a segment's color needs to carry specific meaning. */
  color?: string;
}

export interface StackedBarChartBar {
  label: string;
  segments: StackedBarChartSegment[];
}

export interface StackedBarChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  bars: StackedBarChartBar[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  height?: number;
  yFormat?: (v: number) => string;
}

const DEFAULT_PALETTE = [
  "var(--rebar-color-primary, #0066cc)",
  "var(--rebar-color-success, #2e7d32)",
  "var(--rebar-color-warning, #f57c00)",
  "var(--rebar-color-danger, #d32f2f)",
  "var(--rebar-color-text-secondary, #757575)",
];

// The default palette is `var(--rebar-color-*, #hex)` strings, not plain hex — a caller can also
// pass either shape. Previously this only recognized a bare `#hex` and silently fell back to dark
// text for anything else, so every default-palette segment (including --rebar-color-danger, a
// dark red) always got dark label text with no real contrast check at all — a genuine, untested
// contrast risk for the actual default case. Extracting the `var(...)`'s own fallback hex (a
// literal in the string we control, not a runtime-resolved custom property) fixes the common case;
// a color this can't parse at all (e.g. an `hsl(...)` the caller supplies) keeps the same safe
// dark-text fallback as before.
function readableLabelColor(color: string): string {
  const hexMatch = color.match(/#[0-9a-fA-F]{6}/);
  if (!hexMatch) return "#212121";
  const n = parseInt(hexMatch[0].slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  // Perceived brightness (ITU-R BT.601) — cheaper than full relative luminance, plenty accurate
  // for picking readable label text against a solid, deliberately fixed data color.
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#212121" : "#ffffff";
}

/**
 * A stacked bar chart — each bar broken into labeled cost/quantity segments, with the bar's own
 * total shown above it. Built for comparing the composition of a small number of totals (see this
 * project's own `/benchmarks`, the real, repeated use case this component was promoted from).
 */
export function StackedBarChart({
  bars,
  title,
  ariaLabel,
  height = 340,
  yFormat = (v: number) => `$${Math.round(v).toLocaleString()}`,
  className,
  ...props
}: StackedBarChartProps) {
  const width = 700;
  const marginLeft = 74;
  const marginRight = 16;
  const marginTop = 16;
  const marginBottom = 34;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const totals = bars.map((b) => b.segments.reduce((a, s) => a + s.value, 0));
  const yMax = Math.max(...totals) * 1.1;
  const yScale = (v: number) => (v / yMax) * plotHeight;

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => (yMax * i) / (tickCount - 1));

  const n = bars.length;
  const bandWidth = plotWidth / n;
  const barWidth = bandWidth * 0.46;

  return (
    <figure
      className={clsx("rebar-chart", "rebar-stacked-bar-chart", className)}
      data-rebar-component="stacked-bar-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Stacked bar chart"}
      >
        {ticks.map((t, i) => {
          const y = marginTop + plotHeight - yScale(t);
          return (
            <g key={i}>
              <line
                x1={marginLeft}
                y1={y}
                x2={width - marginRight}
                y2={y}
                stroke="var(--rebar-color-border, #e0e0e0)"
                strokeWidth={1}
              />
              <text x={marginLeft - 8} y={y + 4} fontSize={11} textAnchor="end" fill="var(--rebar-color-text-secondary, #757575)">
                {yFormat(t)}
              </text>
            </g>
          );
        })}
        {bars.map((bar, i) => {
          const cx = marginLeft + bandWidth * (i + 0.5);
          let cumulative = 0;
          const total = totals[i] ?? 0;
          return (
            <g key={bar.label}>
              {bar.segments.map((seg, j) => {
                const color = seg.color ?? DEFAULT_PALETTE[j % DEFAULT_PALETTE.length] ?? "var(--rebar-color-primary, #0066cc)";
                const segHeight = Math.max(yScale(seg.value), seg.value > 0 ? 1.5 : 0);
                const yTop = marginTop + plotHeight - yScale(cumulative) - segHeight;
                cumulative += seg.value;
                const showLabel = segHeight >= 22;
                return (
                  <g key={j}>
                    <rect x={cx - barWidth / 2} y={yTop} width={barWidth} height={segHeight} fill={color} />
                    {showLabel ? (
                      <text
                        x={cx}
                        y={yTop + segHeight / 2 + 4}
                        fontSize={11}
                        textAnchor="middle"
                        fill={readableLabelColor(color)}
                      >
                        {seg.label} ({yFormat(seg.value)})
                      </text>
                    ) : null}
                  </g>
                );
              })}
              <text
                x={cx}
                y={marginTop + plotHeight - yScale(total) - 10}
                fontSize={13}
                textAnchor="middle"
                fill="var(--rebar-color-text-primary, #212121)"
                style={{ fontWeight: 600 }}
              >
                {yFormat(total)}
              </text>
              <text
                x={cx}
                y={marginTop + plotHeight + 22}
                fontSize={12}
                textAnchor="middle"
                fill="var(--rebar-color-text-primary, #212121)"
                style={{ fontWeight: 600 }}
              >
                {bar.label}
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
