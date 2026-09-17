import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { ChartValueTag, useChartMarkSelection } from "../chartMarkSelection";
import { ChartFilterFooter, useSeriesFilter } from "../chartSeriesFilter";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface StackedLineChartSeries {
  label: string;
  /** Defaults to the next color in a small built-in palette, cycled by series index. */
  color?: string;
  values: number[];
}

export interface StackedLineChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  /** Drawn bottom-to-top in this order — each series' line plots its own value *plus* every
   * series before it in this list, the same stacking order `StackedBarChart`'s segments use. */
  series: StackedLineChartSeries[];
  xLabels: string[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  height?: number;
  yFormat?: (v: number) => string;
  labelStep?: number;
  /** Adds a row of toggle buttons (one per series) below the chart — hiding one drops it from the
   * stack entirely and the remaining lines' cumulative sums recompute without it, the same
   * behavior `StackedBarChart`'s own `filterable` segments already have. Off by default. */
  filterable?: boolean;
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
 * A multi-series line chart where each line plots a *cumulative running total* (itself plus every
 * series stacked below it), not its own raw values — showing each series' individual contribution
 * to a growing whole without the visual weight `StackedAreaChart`'s filled bands carry, useful
 * when the reader mainly needs to compare shapes/slopes rather than read the exact fill volume at
 * a glance. The topmost line is always the grand total.
 */
export function StackedLineChart({
  series,
  xLabels,
  title,
  ariaLabel,
  height = 300,
  yFormat = (v: number) => Math.round(v).toLocaleString(),
  labelStep = 1,
  filterable,
  bionic,
  bionicOptions,
  className,
  ...props
}: StackedLineChartProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const { activeKey, isSelected, getMarkProps, backgroundProps } = useChartMarkSelection<string>();
  const { hidden, toggle, isVisible } = useSeriesFilter(series.map((s) => s.label));
  const visibleSeries = filterable ? series.filter((s) => isVisible(s.label)) : series;
  const width = 700;
  const marginLeft = 62;
  const marginRight = 20;
  const marginTop = 16;
  const marginBottom = 60;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  if (visibleSeries.length === 0 || xLabels.length < 2) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-stacked-line-chart", className)}
        data-rebar-component="stacked-line-chart"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(height)}
        {filterable ? <ChartFilterFooter labels={series.map((s) => s.label)} hidden={hidden} onToggle={toggle} /> : null}
      </figure>
    );
  }

  // Cumulative running total per x position — cumulative[i][j] is the sum of series 0..i's own
  // value at position j, so the last series' cumulative line is always the grand total.
  const cumulative: number[][] = [];
  visibleSeries.forEach((s, i) => {
    const prev = cumulative[i - 1];
    cumulative.push(s.values.map((v, j) => v + (prev ? prev[j]! : 0)));
  });

  const topLine = cumulative[cumulative.length - 1] ?? [];
  const yMax = (Math.max(0, ...topLine) || 1) * 1.08;
  const yMin = 0;
  const yScale = (v: number) => marginTop + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;
  const xScale = (i: number) => marginLeft + (plotWidth * i) / (xLabels.length - 1);

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => yMin + ((yMax - yMin) * i) / (tickCount - 1));

  return (
    <figure
      className={clsx("rebar-chart", "rebar-stacked-line-chart", className)}
      data-rebar-component="stacked-line-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Stacked line chart"}
        {...backgroundProps}
      >
        <rect x={0} y={0} width={width} height={height} fill="transparent" data-rebar-part="chart-background" />
        {ticks.map((t, i) => {
          const y = yScale(t);
          return (
            <g key={i}>
              <line x1={marginLeft} y1={y} x2={width - marginRight} y2={y} stroke="var(--rebar-color-border, #e0e0e0)" strokeWidth={1} />
              <text x={marginLeft - 8} y={y + 4} fontSize={11} textAnchor="end" fill="var(--rebar-color-text-secondary, #757575)">
                {yFormat(t)}
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
        {visibleSeries.map((s, i) => {
          const originalIndex = series.indexOf(s);
          const color = s.color ?? DEFAULT_PALETTE[originalIndex % DEFAULT_PALETTE.length];
          const values = cumulative[i]!;
          const points = values.map((v, j) => `${xScale(j)},${yScale(v)}`).join(" ");
          return (
            <g key={s.label}>
              <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} />
              {values.map((v, j) => {
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
        {visibleSeries.map((s, i) => {
          const originalIndex = series.indexOf(s);
          return (
            <text
              key={s.label}
              x={width - marginRight}
              y={marginTop + 12 + i * 16}
              fontSize={11}
              textAnchor="end"
              fill={s.color ?? DEFAULT_PALETTE[originalIndex % DEFAULT_PALETTE.length]}
            >
              {s.label}
            </text>
          );
        })}
        {activeKey
          ? (() => {
              const [seriesIndexStr, pointIndexStr] = activeKey.split(":");
              const seriesIndex = Number(seriesIndexStr);
              const pointIndex = Number(pointIndexStr);
              const activeSeries = visibleSeries[seriesIndex];
              const value = cumulative[seriesIndex]?.[pointIndex];
              if (!activeSeries || value === undefined) return null;
              const originalIndex = series.indexOf(activeSeries);
              return (
                <ChartValueTag
                  x={xScale(pointIndex)}
                  y={yScale(value)}
                  viewBoxWidth={width}
                  viewBoxHeight={height}
                  accentColor={activeSeries.color ?? DEFAULT_PALETTE[originalIndex % DEFAULT_PALETTE.length]}
                  lines={[`${activeSeries.label} (cumulative)`, `${xLabels[pointIndex]}: ${yFormat(value)}`]}
                />
              );
            })()
          : null}
      </svg>
      {filterable ? <ChartFilterFooter labels={series.map((s) => s.label)} hidden={hidden} onToggle={toggle} /> : null}
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
