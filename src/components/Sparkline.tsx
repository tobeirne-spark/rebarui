import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

export interface SparklineProps extends Omit<ComponentPropsWithoutRef<"svg">, "color" | "width" | "height" | "values"> {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  /** Required — a sparkline has no visible caption/legend of its own, so the accessible name has
   * to come from the caller. */
  ariaLabel: string;
}

/**
 * A tiny, axis-less trend line — no ticks, no x labels, no legend, just the line itself, meant to
 * sit inline (a table cell, a stat card). Reuses `LineChart`'s scaling math, stripped down to a
 * single series and no chrome.
 */
export function Sparkline({
  values,
  color = "var(--rebar-color-primary, #0066cc)",
  width = 120,
  height = 32,
  ariaLabel,
  className,
  ...props
}: SparklineProps) {
  const inset = 2;
  const plotWidth = width - inset * 2;
  const plotHeight = height - inset * 2;

  // An empty `values` array previously fed straight into Math.min(...[])/Math.max(...[]) —
  // Infinity/-Infinity in JS — producing NaN points. This has no chrome to show a real "no data"
  // message in (it's meant to sit inline in a table cell/stat card, per its own doc comment above),
  // so the honest fallback is a flat baseline line rather than nothing or a mismatched Empty
  // illustration — still visibly "a sparkline," just with no data to trend.
  const rawMin = values.length > 0 ? Math.min(...values) : 0;
  const rawMax = values.length > 0 ? Math.max(...values) : 0;
  const pad = (rawMax - rawMin) * 0.08 || rawMax * 0.05 || 1;
  const yMin = Math.max(0, rawMin - pad);
  const yMax = rawMax + pad;
  const yScale = (v: number) => inset + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;

  const points =
    values.length > 1
      ? values.map((v, i) => `${inset + (plotWidth * i) / (values.length - 1)},${yScale(v)}`).join(" ")
      : `${inset},${yScale(values[0] ?? 0)} ${inset + plotWidth},${yScale(values[0] ?? 0)}`;

  return (
    <svg
      className={clsx("rebar-chart", "rebar-sparkline", className)}
      data-rebar-component="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ display: "inline-block", verticalAlign: "middle" }}
      role="img"
      aria-label={ariaLabel}
      {...props}
    >
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
