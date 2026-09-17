import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { computeTrendline } from "../chartTrendline";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface BarChartBar {
  label: string;
  value: number;
  /** Defaults to the next color in a small built-in palette, cycled by bar index. */
  color?: string;
}

export interface BarChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  bars: BarChartBar[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  height?: number;
  /** Adds a dashed linear-regression trendline across the bars (treating each bar's position as
   * its x value) — off by default. Only meaningful when the bars represent an ordered sequence
   * (e.g. consecutive months), not an arbitrary unordered category list. */
  trendline?: boolean;
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
 * A single-series bar chart — one bar per category. A direct simplification of `StackedBarChart`
 * (each bar has exactly one segment instead of several) — reuses its exact axis/scaling math.
 */
export function BarChart({
  bars,
  title,
  ariaLabel,
  height = 340,
  trendline,
  bionic,
  bionicOptions,
  className,
  ...props
}: BarChartProps) {
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
        className={clsx("rebar-chart", "rebar-bar-chart", className)}
        data-rebar-component="bar-chart"
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
  const barWidth = bandWidth * 0.46;

  return (
    <figure
      className={clsx("rebar-chart", "rebar-bar-chart", className)}
      data-rebar-component="bar-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Bar chart"}
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
          const cx = marginLeft + bandWidth * (i + 0.5);
          const barHeight = Math.max(yScale(bar.value), bar.value > 0 ? 1.5 : 0);
          const yTop = marginTop + plotHeight - barHeight;
          return (
            <g key={bar.label}>
              <rect x={cx - barWidth / 2} y={yTop} width={barWidth} height={barHeight} fill={color} />
              <text
                x={cx}
                y={yTop - 8}
                fontSize={13}
                textAnchor="middle"
                fill="var(--rebar-color-text-primary, #212121)"
                style={{ fontWeight: 600 }}
              >
                {Math.round(bar.value).toLocaleString()}
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
        {trendline
          ? (() => {
              const trend = computeTrendline(bars.map((bar, i) => ({ x: i, y: bar.value })));
              if (!trend) return null;
              const yAt = (x: number) => marginTop + plotHeight - yScale(trend.slope * x + trend.intercept);
              const x1 = marginLeft + bandWidth * 0.5;
              const x2 = marginLeft + bandWidth * (bars.length - 0.5);
              return (
                <line
                  x1={x1}
                  y1={yAt(0)}
                  x2={x2}
                  y2={yAt(bars.length - 1)}
                  stroke="var(--rebar-color-text-secondary, #757575)"
                  strokeWidth={1.5}
                  strokeDasharray="2 4"
                  opacity={0.7}
                  data-rebar-part="trendline"
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
