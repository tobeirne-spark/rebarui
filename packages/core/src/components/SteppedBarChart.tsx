import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface SteppedBarChartBar {
  label: string;
  value: number;
  /** Defaults to the next color in a small built-in palette, cycled by bar index. */
  color?: string;
}

export interface SteppedBarChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  bars: SteppedBarChartBar[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  height?: number;
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

/**
 * A bar chart with no gutter between bars — each one spans its full category band, so the tops
 * together form one continuous staircase silhouette (traced explicitly with a bold outline on
 * top, not left for the reader to infer from adjacency alone). For a category sequence where the
 * *shape of change* across categories matters as much as each individual value — a binned/ordinal
 * axis, not `BarChart`'s independent, gapped comparisons.
 */
export function SteppedBarChart({
  bars,
  title,
  ariaLabel,
  height = 340,
  bionic,
  bionicOptions,
  className,
  ...props
}: SteppedBarChartProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const width = 700;
  const marginLeft = 74;
  const marginRight = 16;
  const marginTop = 16;
  const marginBottom = 34;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  if (bars.length === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-stepped-bar-chart", className)}
        data-rebar-component="stepped-bar-chart"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(height)}
      </figure>
    );
  }
  const yMax = Math.max(...bars.map((b) => b.value)) * 1.1 || 1;
  const yScale = (v: number) => (v / yMax) * plotHeight;

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => (yMax * i) / (tickCount - 1));

  const n = bars.length;
  const bandWidth = plotWidth / n;

  // The bold outline tracing every bar's own top edge, left-to-right — a real staircase path, not
  // just bars placed edge-to-edge and left for the eye to connect.
  const outlinePoints: string[] = [];
  bars.forEach((bar, i) => {
    const xLeft = marginLeft + bandWidth * i;
    const xRight = marginLeft + bandWidth * (i + 1);
    const yTop = marginTop + plotHeight - Math.max(yScale(bar.value), bar.value > 0 ? 1.5 : 0);
    outlinePoints.push(`${xLeft},${yTop}`, `${xRight},${yTop}`);
  });

  return (
    <figure
      className={clsx("rebar-chart", "rebar-stepped-bar-chart", className)}
      data-rebar-component="stepped-bar-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Stepped bar chart"}
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
                {Math.round(t).toLocaleString()}
              </text>
            </g>
          );
        })}
        {bars.map((bar, i) => {
          const color = bar.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length] ?? "var(--rebar-color-primary, #0066cc)";
          const xLeft = marginLeft + bandWidth * i;
          const barHeight = Math.max(yScale(bar.value), bar.value > 0 ? 1.5 : 0);
          const yTop = marginTop + plotHeight - barHeight;
          return (
            <g key={bar.label}>
              <rect
                x={xLeft}
                y={yTop}
                width={bandWidth}
                height={barHeight}
                fill={color}
                stroke="var(--rebar-color-bg-primary, #ffffff)"
                strokeWidth={1}
              />
              <text
                x={xLeft + bandWidth / 2}
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
        <polyline
          points={outlinePoints.join(" ")}
          fill="none"
          stroke="var(--rebar-color-text-primary, #212121)"
          strokeWidth={2}
          data-rebar-part="outline"
        />
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
