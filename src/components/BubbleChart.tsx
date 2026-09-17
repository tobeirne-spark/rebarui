import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { ChartValueTag, useChartMarkSelection } from "../chartMarkSelection";
import { computeTrendline } from "../chartTrendline";
import { renderBionicChildren, useAmbientBionic, useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface BubbleChartPoint {
  x: number;
  y: number;
  /** Mapped to marker radius via sqrt scaling — see the component doc comment below for why. */
  size: number;
}

export interface BubbleChartSeries {
  label: string;
  /** Defaults to the next color in a small built-in palette, cycled by series index — supply one
   * explicitly only when a specific color carries real meaning (e.g. matching another chart on
   * the same page). */
  color?: string;
  points: BubbleChartPoint[];
}

export interface BubbleChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  series: BubbleChartSeries[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16: a chart
   * ships with a title, not just an accessible name a sighted reader never sees. Optional only so
   * a chart embedded somewhere its own heading already serves this role doesn't get a duplicate
   * one; supplying it is the default expectation, not an edge case. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  height?: number;
  xFormat?: (v: number) => string;
  yFormat?: (v: number) => string;
  /** Adds a dashed linear-regression trendline per series, computed over its own real x/y points
   * (not `size`) — off by default. */
  trendline?: boolean;
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

// Never let a point vanish to an invisible dot or blow up past its neighbors, however extreme the
// real `size` values are — a bounded footprint regardless of the underlying data (see
// ref/HEURISTICS.md #45).
const MIN_RADIUS = 4;
const MAX_RADIUS = 24;

/**
 * A scatter chart with a third dimension encoded as marker size — each point's `size` value maps
 * to circle radius via **sqrt scaling** (radius proportional to the square root of `size`, so
 * *area* — not radius — ends up proportional to the real value). This is the perceptually accurate
 * mapping for a size-encoded quantity: a viewer judges a circle's size by its area, not its radius,
 * so scaling radius linearly with the value would make a 2x-bigger number look ~4x bigger (area
 * grows with the square of radius). Radii are clamped to a fixed range (4-24px by default)
 * computed relative to the min/max `size` across every point, so the smallest real value never
 * disappears and the largest never overwhelms the plot.
 */
export function BubbleChart({
  series,
  title,
  ariaLabel,
  height = 320,
  xFormat = (v: number) => Math.round(v).toLocaleString(),
  yFormat = (v: number) => Math.round(v).toLocaleString(),
  trendline,
  bionic,
  bionicOptions,
  className,
  ...props
}: BubbleChartProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;
  const { activeKey, isSelected, getMarkProps, backgroundProps } = useChartMarkSelection<string>();
  const width = 700;
  const marginLeft = 62;
  const marginRight = 24;
  const marginTop = 16;
  const marginBottom = 46;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-bubble-chart", className)}
        data-rebar-component="bubble-chart"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(height)}
      </figure>
    );
  }
  const xs = allPoints.map((p) => p.x);
  const ys = allPoints.map((p) => p.y);
  const sizes = allPoints.map((p) => p.size);

  const rawXMin = xs.length ? Math.min(...xs) : 0;
  const rawXMax = xs.length ? Math.max(...xs) : 1;
  const xPad = (rawXMax - rawXMin) * 0.1 || rawXMax * 0.1 || 1;
  const xMin = rawXMin - xPad;
  const xMax = rawXMax + xPad;

  const rawYMin = ys.length ? Math.min(...ys) : 0;
  const rawYMax = ys.length ? Math.max(...ys) : 1;
  const yPad = (rawYMax - rawYMin) * 0.12 || rawYMax * 0.1 || 1;
  const yMin = rawYMin - yPad;
  const yMax = rawYMax + yPad;

  const xScale = (v: number) => marginLeft + ((v - xMin) / (xMax - xMin)) * plotWidth;
  const yScale = (v: number) => marginTop + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;

  const sizeMin = sizes.length ? Math.min(...sizes) : 0;
  const sizeMax = sizes.length ? Math.max(...sizes) : 1;
  const sqrtMin = Math.sqrt(Math.max(sizeMin, 0));
  const sqrtMax = Math.sqrt(Math.max(sizeMax, 0));
  const radiusFor = (size: number) => {
    if (sqrtMax === sqrtMin) return (MIN_RADIUS + MAX_RADIUS) / 2;
    const t = (Math.sqrt(Math.max(size, 0)) - sqrtMin) / (sqrtMax - sqrtMin);
    return MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);
  };

  const yTickCount = 5;
  const yTicks = Array.from({ length: yTickCount }, (_, i) => yMin + ((yMax - yMin) * i) / (yTickCount - 1));
  const xTickCount = 5;
  const xTicks = Array.from({ length: xTickCount }, (_, i) => xMin + ((xMax - xMin) * i) / (xTickCount - 1));

  return (
    <figure
      className={clsx("rebar-chart", "rebar-bubble-chart", className)}
      data-rebar-component="bubble-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Bubble chart"}
        {...backgroundProps}
      >
        <rect x={0} y={0} width={width} height={height} fill="transparent" data-rebar-part="chart-background" />
        {yTicks.map((t, i) => {
          const y = yScale(t);
          return (
            <g key={`y-${i}`}>
              <line x1={marginLeft} y1={y} x2={width - marginRight} y2={y} stroke="var(--rebar-color-border, #e0e0e0)" strokeWidth={1} />
              <text x={marginLeft - 8} y={y + 4} fontSize={11} textAnchor="end" fill="var(--rebar-color-text-secondary, #757575)">
                {yFormat(t)}
              </text>
            </g>
          );
        })}
        {xTicks.map((t, i) => (
          <text
            key={`x-${i}`}
            x={xScale(t)}
            y={height - marginBottom + 20}
            fontSize={11}
            textAnchor="middle"
            fill="var(--rebar-color-text-secondary, #757575)"
          >
            {xFormat(t)}
          </text>
        ))}
        {series.map((s, i) => {
          const color = s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
          const trend = trendline ? computeTrendline(s.points.map((p) => ({ x: p.x, y: p.y }))) : null;
          return (
            <g key={s.label}>
              {trend
                ? (() => {
                    const x1 = Math.min(...s.points.map((p) => p.x));
                    const x2 = Math.max(...s.points.map((p) => p.x));
                    return (
                      <line
                        x1={xScale(x1)}
                        y1={yScale(trend.slope * x1 + trend.intercept)}
                        x2={xScale(x2)}
                        y2={yScale(trend.slope * x2 + trend.intercept)}
                        stroke={color}
                        strokeWidth={1.5}
                        strokeDasharray="2 4"
                        opacity={0.6}
                        data-rebar-part="trendline"
                      />
                    );
                  })()
                : null}
              {s.points.map((p, j) => {
                const key = `${i}:${j}`;
                const selected = isSelected(key);
                return (
                  <circle
                    key={j}
                    data-rebar-part="bubble"
                    cx={xScale(p.x)}
                    cy={yScale(p.y)}
                    r={radiusFor(p.size)}
                    fill={color}
                    opacity={selected ? 0.9 : 0.65}
                    stroke={selected ? "var(--rebar-color-bg-primary, #ffffff)" : undefined}
                    strokeWidth={selected ? 2 : undefined}
                    style={{ cursor: "pointer" }}
                    {...getMarkProps(key)}
                  />
                );
              })}
            </g>
          );
        })}
        {activeKey
          ? (() => {
              const [seriesIndexStr, pointIndexStr] = activeKey.split(":");
              const seriesIndex = Number(seriesIndexStr);
              const pointIndex = Number(pointIndexStr);
              const activeSeries = series[seriesIndex];
              const point = activeSeries?.points[pointIndex];
              if (!activeSeries || !point) return null;
              return (
                <ChartValueTag
                  x={xScale(point.x)}
                  y={yScale(point.y)}
                  viewBoxWidth={width}
                  viewBoxHeight={height}
                  accentColor={activeSeries.color ?? DEFAULT_PALETTE[seriesIndex % DEFAULT_PALETTE.length]}
                  lines={[activeSeries.label, `x: ${xFormat(point.x)}  y: ${yFormat(point.y)}`, `size: ${Math.round(point.size).toLocaleString()}`]}
                />
              );
            })()
          : null}
      </svg>
      {series.length ? (
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
          {series.map((s, i) => {
            const color = s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
            return (
              <span
                key={s.label}
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
                  style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }}
                />
                {renderBionicChildren(s.label, bionicEnabled, bionicOptions)}
              </span>
            );
          })}
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
