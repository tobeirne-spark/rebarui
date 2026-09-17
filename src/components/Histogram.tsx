import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { ChartValueTag, useChartMarkSelection } from "../chartMarkSelection";
import { ChartFilterFooter, useSeriesFilter } from "../chartSeriesFilter";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface HistogramSeries {
  label: string;
  /** Defaults to the next color in a small built-in palette, cycled by series index. */
  color?: string;
  /** Raw sample values — binned internally, not pre-aggregated counts. */
  values: number[];
}

export interface HistogramProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  series: HistogramSeries[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  height?: number;
  /** Number of bins, shared across every series so their bars line up for comparison. Defaults to
   * Sturges' rule (`ceil(log2(n) + 1)`, a standard, simple bin-count heuristic) off the combined
   * sample count across all series. */
  binCount?: number;
  /** Formats a bin's own edge value for its x-axis label. */
  xFormat?: (v: number) => string;
  /** Formats a bin's count for the y-axis/value tag. */
  yFormat?: (v: number) => string;
  /** Adds a row of toggle buttons (one per series) below the chart — off by default. Only
   * meaningful with more than one series. */
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

function sturges(n: number): number {
  return Math.max(1, Math.ceil(Math.log2(Math.max(n, 1)) + 1));
}

/**
 * A real histogram — bins raw sample values into a fixed number of equal-width buckets and plots
 * each bucket's count as a touching bar (no gutter, the standard histogram silhouette). Distinct
 * from `DistributionChart`, which plots a *parametric* normal curve from an already-computed
 * `mean`/`stdDev` rather than binning real samples — this is the raw-data counterpart for when a
 * caller has the actual measurements, not just their summary statistics. Multiple series share one
 * set of bin edges (computed from the combined range of all of them) so their bars line up, and
 * render as semi-transparent overlapping bars rather than grouped side-by-side ones — the standard
 * way to compare overlapping distributions without a bar for every series at every bin crowding
 * the plot.
 */
export function Histogram({
  series,
  title,
  ariaLabel,
  height = 320,
  binCount,
  xFormat = (v: number) => (Number.isInteger(v) ? v.toLocaleString() : v.toFixed(1)),
  yFormat = (v: number) => Math.round(v).toLocaleString(),
  filterable,
  bionic,
  bionicOptions,
  className,
  ...props
}: HistogramProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const { activeKey, isSelected, getMarkProps, backgroundProps } = useChartMarkSelection<string>();
  const { hidden, toggle, isVisible } = useSeriesFilter(series.map((s) => s.label));
  const visibleSeries = filterable ? series.filter((s) => isVisible(s.label)) : series;
  const width = 700;
  const marginLeft = 62;
  const marginRight = 20;
  const marginTop = 16;
  const marginBottom = 46;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const allValues = visibleSeries.flatMap((s) => s.values);
  if (allValues.length === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-histogram", className)}
        data-rebar-component="histogram"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(height)}
        {filterable ? <ChartFilterFooter labels={series.map((s) => s.label)} hidden={hidden} onToggle={toggle} /> : null}
      </figure>
    );
  }

  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const bins = binCount ?? sturges(allValues.length);
  const span = dataMax - dataMin || 1;
  const binWidth = span / bins;
  const edges = Array.from({ length: bins + 1 }, (_, i) => dataMin + i * binWidth);

  const binIndexFor = (v: number) => {
    if (binWidth === 0) return 0;
    const i = Math.floor((v - dataMin) / binWidth);
    return Math.min(bins - 1, Math.max(0, i));
  };

  const counts = visibleSeries.map((s) => {
    const c = new Array(bins).fill(0);
    for (const v of s.values) c[binIndexFor(v)]++;
    return c;
  });

  const yMax = (Math.max(0, ...counts.flat()) || 1) * 1.1;
  const yScale = (v: number) => (v / yMax) * plotHeight;
  const xScale = (binIndex: number) => marginLeft + (plotWidth * binIndex) / bins;

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => (yMax * i) / (tickCount - 1));

  return (
    <figure
      className={clsx("rebar-chart", "rebar-histogram", className)}
      data-rebar-component="histogram"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Histogram"}
        {...backgroundProps}
      >
        <rect x={0} y={0} width={width} height={height} fill="transparent" data-rebar-part="chart-background" />
        {ticks.map((t, i) => {
          const y = marginTop + plotHeight - yScale(t);
          return (
            <g key={i}>
              <line x1={marginLeft} y1={y} x2={width - marginRight} y2={y} stroke="var(--rebar-color-border, #e0e0e0)" strokeWidth={1} />
              <text x={marginLeft - 8} y={y + 4} fontSize={11} textAnchor="end" fill="var(--rebar-color-text-secondary, #757575)">
                {yFormat(t)}
              </text>
            </g>
          );
        })}
        {edges.map((edge, i) => {
          if (i % Math.ceil((bins + 1) / 8) !== 0 && i !== bins) return null;
          return (
            <text
              key={i}
              x={xScale(i)}
              y={height - marginBottom + 18}
              fontSize={10}
              textAnchor="middle"
              fill="var(--rebar-color-text-secondary, #757575)"
            >
              {xFormat(edge)}
            </text>
          );
        })}
        {visibleSeries.map((s, i) => {
          const originalIndex = series.indexOf(s);
          const color = s.color ?? DEFAULT_PALETTE[originalIndex % DEFAULT_PALETTE.length];
          return (
            <g key={s.label}>
              {counts[i]!.map((count, binIndex) => {
                if (count === 0) return null;
                const barHeight = yScale(count);
                const key = `${i}:${binIndex}`;
                const selected = isSelected(key);
                return (
                  <rect
                    key={binIndex}
                    x={xScale(binIndex)}
                    y={marginTop + plotHeight - barHeight}
                    width={plotWidth / bins}
                    height={barHeight}
                    fill={color}
                    fillOpacity={visibleSeries.length > 1 ? 0.55 : 0.85}
                    stroke={selected ? "var(--rebar-color-text-primary, #212121)" : "var(--rebar-color-bg-primary, #ffffff)"}
                    strokeWidth={selected ? 1.5 : 1}
                    style={{ cursor: "pointer" }}
                    data-rebar-part="mark"
                    {...getMarkProps(key)}
                  />
                );
              })}
            </g>
          );
        })}
        {visibleSeries.length > 1
          ? visibleSeries.map((s, i) => {
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
            })
          : null}
        {activeKey
          ? (() => {
              const [seriesIndexStr, binIndexStr] = activeKey.split(":");
              const seriesIndex = Number(seriesIndexStr);
              const binIndex = Number(binIndexStr);
              const activeSeries = visibleSeries[seriesIndex];
              const count = counts[seriesIndex]?.[binIndex];
              if (!activeSeries || count === undefined) return null;
              const originalIndex = series.indexOf(activeSeries);
              const barHeight = yScale(count);
              return (
                <ChartValueTag
                  x={xScale(binIndex) + plotWidth / bins / 2}
                  y={marginTop + plotHeight - barHeight}
                  viewBoxWidth={width}
                  viewBoxHeight={height}
                  accentColor={activeSeries.color ?? DEFAULT_PALETTE[originalIndex % DEFAULT_PALETTE.length]}
                  lines={[
                    visibleSeries.length > 1 ? activeSeries.label : "Bin",
                    `${xFormat(edges[binIndex]!)}–${xFormat(edges[binIndex + 1]!)}: ${yFormat(count)}`,
                  ]}
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
