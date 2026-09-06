import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";

export interface CandlestickDataPoint {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandlestickChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  data: CandlestickDataPoint[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  height?: number;
  /** Fill for a candle that closed at or above its own open. */
  upColor?: string;
  /** Fill for a candle that closed below its own open. */
  downColor?: string;
  yFormat?: (v: number) => string;
}

/**
 * A financial price-range chart — one candle per data point: a thin "wick" line spanning the
 * period's full high/low range, and a filled "body" rectangle spanning open/close, colored by
 * whether the period closed up or down. The y-axis range and tick spacing reuse the same approach
 * `LineChart`/`ScatterChart` already use for theirs (min/max of the data's own range, padded, split
 * into an evenly spaced set of ticks) rather than inventing a new axis convention for this chart.
 */
export function CandlestickChart({
  data,
  title,
  ariaLabel,
  height = 320,
  upColor = "var(--rebar-color-success, #2e7d32)",
  downColor = "var(--rebar-color-danger, #d32f2f)",
  yFormat = (v: number) => v.toFixed(2),
  className,
  ...props
}: CandlestickChartProps) {
  const width = 700;
  const marginLeft = 62;
  const marginRight = 20;
  const marginTop = 16;
  const marginBottom = 34;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  if (data.length === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-candlestick-chart", className)}
        data-rebar-component="candlestick-chart"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(height)}
      </figure>
    );
  }
  const highs = data.map((d) => d.high);
  const lows = data.map((d) => d.low);
  const rawMin = Math.min(...lows);
  const rawMax = Math.max(...highs);
  const pad = (rawMax - rawMin) * 0.08 || rawMax * 0.05 || 1;
  const yMin = Math.max(0, rawMin - pad);
  const yMax = rawMax + pad;
  const yScale = (v: number) => marginTop + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => yMin + ((yMax - yMin) * i) / (tickCount - 1));

  const n = data.length;
  const bandWidth = plotWidth / Math.max(n, 1);
  const bodyWidth = bandWidth * 0.5;

  return (
    <figure
      className={clsx("rebar-chart", "rebar-candlestick-chart", className)}
      data-rebar-component="candlestick-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Candlestick chart"}
      >
        {ticks.map((t, i) => {
          const y = yScale(t);
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
        {data.map((d, i) => {
          const cx = marginLeft + bandWidth * (i + 0.5);
          const isUp = d.close >= d.open;
          const color = isUp ? upColor : downColor;
          const bodyTop = yScale(Math.max(d.open, d.close));
          const bodyBottom = yScale(Math.min(d.open, d.close));
          const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
          return (
            <g key={`${d.label}-${i}`} data-rebar-part="candle">
              <line x1={cx} y1={yScale(d.high)} x2={cx} y2={yScale(d.low)} stroke={color} strokeWidth={1.5} />
              <rect x={cx - bodyWidth / 2} y={bodyTop} width={bodyWidth} height={bodyHeight} fill={color} />
              <text
                x={cx}
                y={marginTop + plotHeight + 22}
                fontSize={11}
                textAnchor="middle"
                fill="var(--rebar-color-text-primary, #212121)"
              >
                {d.label}
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
