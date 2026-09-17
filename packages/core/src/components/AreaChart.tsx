import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { ChartValueTag, useChartMarkSelection } from "../chartMarkSelection";
import { computeTrendline } from "../chartTrendline";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface AreaChartSeries {
  label: string;
  /** Defaults to the next color in a small built-in palette, cycled by series index. */
  color?: string;
  values: number[];
}

export interface AreaChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  series: AreaChartSeries[];
  xLabels: string[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  height?: number;
  labelStep?: number;
  /** Adds a dashed linear-regression trendline per series — off by default. */
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
 * A multi-series area chart over an ordered x-axis — the same shape as `LineChart` (same
 * scaling/label logic, reused exactly), with the area under each line filled using the series'
 * own color at low opacity so overlapping series stay legible.
 */
export function AreaChart({
  series,
  xLabels,
  title,
  ariaLabel,
  height = 300,
  labelStep = 1,
  trendline,
  bionic,
  bionicOptions,
  className,
  ...props
}: AreaChartProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const { activeKey, isSelected, getMarkProps, backgroundProps } = useChartMarkSelection<string>();
  const width = 700;
  const marginLeft = 62;
  const marginRight = 20;
  const marginTop = 16;
  const marginBottom = 60;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const allValues = series.flatMap((s) => s.values);
  if (allValues.length === 0 || xLabels.length < 2) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-area-chart", className)}
        data-rebar-component="area-chart"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(height)}
      </figure>
    );
  }
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const pad = (rawMax - rawMin) * 0.08 || rawMax * 0.05 || 1;
  const yMin = Math.max(0, rawMin - pad);
  const yMax = rawMax + pad;
  const yScale = (v: number) => marginTop + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;
  const xScale = (i: number) => marginLeft + (plotWidth * i) / (xLabels.length - 1);
  const baselineY = marginTop + plotHeight;

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => yMin + ((yMax - yMin) * i) / (tickCount - 1));

  return (
    <figure
      className={clsx("rebar-chart", "rebar-area-chart", className)}
      data-rebar-component="area-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Area chart"}
        {...backgroundProps}
      >
        <rect x={0} y={0} width={width} height={height} fill="transparent" data-rebar-part="chart-background" />
        {ticks.map((t, i) => {
          const y = yScale(t);
          return (
            <g key={i}>
              <line x1={marginLeft} y1={y} x2={width - marginRight} y2={y} stroke="var(--rebar-color-border, #e0e0e0)" strokeWidth={1} />
              <text x={marginLeft - 8} y={y + 4} fontSize={11} textAnchor="end" fill="var(--rebar-color-text-secondary, #757575)">
                {Math.round(t).toLocaleString()}
              </text>
            </g>
          );
        })}
        {xLabels.map((label, i) => {
          if (i % labelStep !== 0 && i !== xLabels.length - 1) return null;
          return (
            <text
              key={label}
              x={xScale(i)}
              y={height - marginBottom + 20}
              fontSize={11}
              textAnchor="middle"
              fill="var(--rebar-color-text-secondary, #757575)"
            >
              {label}
            </text>
          );
        })}
        {series.map((s, i) => {
          const color = s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
          const linePoints = s.values.map((v, j) => `${xScale(j)},${yScale(v)}`).join(" ");
          const areaPoints = `${xScale(0)},${baselineY} ${linePoints} ${xScale(s.values.length - 1)},${baselineY}`;
          const trend = trendline ? computeTrendline(s.values.map((v, j) => ({ x: j, y: v }))) : null;
          return (
            <g key={s.label}>
              <polygon points={areaPoints} fill={color} fillOpacity={0.18} stroke="none" />
              <polyline points={linePoints} fill="none" stroke={color} strokeWidth={2.5} />
              {trend ? (
                <line
                  x1={xScale(0)}
                  y1={yScale(trend.intercept)}
                  x2={xScale(s.values.length - 1)}
                  y2={yScale(trend.slope * (s.values.length - 1) + trend.intercept)}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeDasharray="2 4"
                  opacity={0.6}
                  data-rebar-part="trendline"
                />
              ) : null}
              {s.values.map((v, j) => {
                const key = `${i}:${j}`;
                const selected = isSelected(key);
                return (
                  <circle
                    key={j}
                    cx={xScale(j)}
                    cy={yScale(v)}
                    r={selected ? 5.5 : 3.5}
                    fill={color}
                    stroke={selected ? "var(--rebar-color-bg-primary, #ffffff)" : undefined}
                    strokeWidth={selected ? 1.5 : undefined}
                    style={{ cursor: "pointer" }}
                    data-rebar-part="mark"
                    {...getMarkProps(key)}
                  />
                );
              })}
            </g>
          );
        })}
        {series.map((s, i) => (
          <text
            key={s.label}
            x={width - marginRight}
            y={marginTop + 12 + i * 16}
            fontSize={11}
            textAnchor="end"
            fill={s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]}
          >
            {s.label}
          </text>
        ))}
        {activeKey
          ? (() => {
              const [seriesIndexStr, pointIndexStr] = activeKey.split(":");
              const seriesIndex = Number(seriesIndexStr);
              const pointIndex = Number(pointIndexStr);
              const activeSeries = series[seriesIndex];
              const value = activeSeries?.values[pointIndex];
              if (!activeSeries || value === undefined) return null;
              return (
                <ChartValueTag
                  x={xScale(pointIndex)}
                  y={yScale(value)}
                  viewBoxWidth={width}
                  viewBoxHeight={height}
                  accentColor={activeSeries.color ?? DEFAULT_PALETTE[seriesIndex % DEFAULT_PALETTE.length]}
                  lines={[activeSeries.label, `${xLabels[pointIndex]}: ${Math.round(value).toLocaleString()}`]}
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
