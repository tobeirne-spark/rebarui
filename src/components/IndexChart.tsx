import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { ChartValueTag, useChartMarkSelection } from "../chartMarkSelection";
import { ChartFilterFooter, useSeriesFilter } from "../chartSeriesFilter";
import { computeTrendline } from "../chartTrendline";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface IndexChartSeries {
  label: string;
  /** Defaults to the next color in a small built-in palette, cycled by series index. */
  color?: string;
  /** Raw values — rebased internally to `baseValue` at the series' own first point, so series
   * starting from very different absolute scales become comparable by relative change. */
  values: number[];
}

export interface IndexChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  series: IndexChartSeries[];
  xLabels: string[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  height?: number;
  labelStep?: number;
  /** The index value every series is rebased to at its own first point. Default `100` (the
   * conventional "indexed to 100" reading — a value of 110 later means "+10% since the start"). */
  baseValue?: number;
  /** Adds a row of toggle buttons (one per series) below the chart that hide/show that series'
   * whole line — off by default. */
  filterable?: boolean;
  /** Adds a dashed linear-regression trendline per series, computed over its own rebased (index)
   * values against position — off by default. */
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
 * A multi-series line chart that rebases every series to a common starting index (`baseValue`,
 * default 100) instead of plotting raw values — the standard "indexed to 100" comparison for
 * series on very different absolute scales (e.g. comparing several stocks' relative performance
 * regardless of their actual share price). A dashed reference line marks `baseValue` itself (no
 * change since the start). Otherwise the exact same shape/scaling/interaction conventions as
 * `LineChart`, which this is a rebasing variant of, not a redesign.
 */
export function IndexChart({
  series,
  xLabels,
  title,
  ariaLabel,
  height = 300,
  labelStep = 1,
  baseValue = 100,
  filterable,
  trendline,
  bionic,
  bionicOptions,
  className,
  ...props
}: IndexChartProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const { activeKey, isSelected, getMarkProps, backgroundProps } = useChartMarkSelection<string>();
  const { hidden, toggle, isVisible } = useSeriesFilter(series.map((s) => s.label));
  const width = 700;
  const marginLeft = 62;
  const marginRight = 20;
  const marginTop = 16;
  const marginBottom = 60;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  // Rebase each series to baseValue at its own first value — a series starting at 0 has no
  // meaningful percent change, so it's left flat at baseValue rather than dividing by zero.
  const indexedSeries = series.map((s) => {
    const first = s.values[0];
    const indexed = !first ? s.values.map(() => baseValue) : s.values.map((v) => (v / first) * baseValue);
    return { ...s, indexed };
  });

  const allValues = indexedSeries.flatMap((s) => s.indexed);
  const allFilteredOut = filterable && series.length > 0 && series.every((s) => !isVisible(s.label));
  if (allValues.length === 0 || xLabels.length < 2 || allFilteredOut) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-index-chart", className)}
        data-rebar-component="index-chart"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(height)}
        {filterable ? <ChartFilterFooter labels={series.map((s) => s.label)} hidden={hidden} onToggle={toggle} /> : null}
      </figure>
    );
  }
  const rawMin = Math.min(baseValue, ...allValues);
  const rawMax = Math.max(baseValue, ...allValues);
  const pad = (rawMax - rawMin) * 0.08 || rawMax * 0.05 || 1;
  const yMin = rawMin - pad;
  const yMax = rawMax + pad;
  const yScale = (v: number) => marginTop + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;
  const xScale = (i: number) => marginLeft + (plotWidth * i) / (xLabels.length - 1);

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => yMin + ((yMax - yMin) * i) / (tickCount - 1));

  return (
    <figure
      className={clsx("rebar-chart", "rebar-index-chart", className)}
      data-rebar-component="index-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Index chart"}
        {...backgroundProps}
      >
        <rect x={0} y={0} width={width} height={height} fill="transparent" data-rebar-part="chart-background" />
        {ticks.map((t, i) => {
          const y = yScale(t);
          return (
            <g key={i}>
              <line x1={marginLeft} y1={y} x2={width - marginRight} y2={y} stroke="var(--rebar-color-border, #e0e0e0)" strokeWidth={1} />
              <text x={marginLeft - 8} y={y + 4} fontSize={11} textAnchor="end" fill="var(--rebar-color-text-secondary, #757575)">
                {Math.round(t)}
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
        <g>
          <line
            x1={marginLeft}
            y1={yScale(baseValue)}
            x2={width - marginRight}
            y2={yScale(baseValue)}
            stroke="var(--rebar-color-text-secondary, #757575)"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          <text x={width - marginRight} y={yScale(baseValue) - 4} fontSize={10} textAnchor="end" fill="var(--rebar-color-text-secondary, #757575)">
            {baseValue}
          </text>
        </g>
        {indexedSeries.map((s, i) => {
          if (filterable && !isVisible(s.label)) return null;
          const color = s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
          const points = s.indexed.map((v, j) => `${xScale(j)},${yScale(v)}`).join(" ");
          const trend = trendline ? computeTrendline(s.indexed.map((v, j) => ({ x: j, y: v }))) : null;
          return (
            <g key={s.label}>
              <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} />
              {trend ? (
                <line
                  x1={xScale(0)}
                  y1={yScale(trend.intercept)}
                  x2={xScale(s.indexed.length - 1)}
                  y2={yScale(trend.slope * (s.indexed.length - 1) + trend.intercept)}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeDasharray="2 4"
                  opacity={0.6}
                  data-rebar-part="trendline"
                />
              ) : null}
              {s.indexed.map((v, j) => {
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
        {(() => {
          let visibleLabelIndex = 0;
          return indexedSeries.map((s, i) => {
            if (filterable && !isVisible(s.label)) return null;
            const labelSlot = visibleLabelIndex++;
            return (
              <text
                key={s.label}
                x={width - marginRight}
                y={marginTop + 12 + labelSlot * 16}
                fontSize={11}
                textAnchor="end"
                fill={s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]}
              >
                {s.label}
              </text>
            );
          });
        })()}
        {activeKey
          ? (() => {
              const [seriesIndexStr, pointIndexStr] = activeKey.split(":");
              const seriesIndex = Number(seriesIndexStr);
              const pointIndex = Number(pointIndexStr);
              const activeSeries = indexedSeries[seriesIndex];
              const value = activeSeries?.indexed[pointIndex];
              if (!activeSeries || value === undefined) return null;
              if (filterable && !isVisible(activeSeries.label)) return null;
              return (
                <ChartValueTag
                  x={xScale(pointIndex)}
                  y={yScale(value)}
                  viewBoxWidth={width}
                  viewBoxHeight={height}
                  accentColor={activeSeries.color ?? DEFAULT_PALETTE[seriesIndex % DEFAULT_PALETTE.length]}
                  lines={[activeSeries.label, `${xLabels[pointIndex]}: ${Math.round(value)}`]}
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
