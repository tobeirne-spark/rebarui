import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { ChartValueTag, useChartMarkSelection } from "../chartMarkSelection";
import { ChartFilterFooter, useSeriesFilter } from "../chartSeriesFilter";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface RibbonChartSeries {
  label: string;
  /** Defaults to the next color in a small built-in palette, cycled by series index. */
  color?: string;
  /** One value per x position — only the *rank* of this value among the other series at the same
   * position is plotted, not its magnitude (see `BarChart`/`LineChart` for magnitude charts). */
  values: number[];
}

export interface RibbonChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  series: RibbonChartSeries[];
  xLabels: string[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  height?: number;
  labelStep?: number;
  /** Adds a row of toggle buttons (one per series) below the chart — hiding one removes it from
   * the ranking entirely (the remaining series re-rank to fill the gap), not just from view. Off
   * by default. */
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

// Builds one closed, smoothly-curved ribbon polygon across every x position — the top edge left
// to right (bezier-smoothed through each rank-center minus half the ribbon width), then the
// bottom edge back right to left, closing the shape. One continuous path per series rather than a
// disconnected segment per x-step, so a ribbon reads as one flowing band, not a chain of patches.
function buildRibbonPath(xs: number[], centers: number[], halfWidth: number): string {
  const top = centers.map((c) => c - halfWidth);
  const bottom = centers.map((c) => c + halfWidth);
  let d = `M ${xs[0]},${top[0]}`;
  for (let i = 1; i < xs.length; i++) {
    const cx = (xs[i - 1]! + xs[i]!) / 2;
    d += ` C ${cx},${top[i - 1]} ${cx},${top[i]} ${xs[i]},${top[i]}`;
  }
  d += ` L ${xs[xs.length - 1]},${bottom[bottom.length - 1]}`;
  for (let i = xs.length - 2; i >= 0; i--) {
    const cx = (xs[i]! + xs[i + 1]!) / 2;
    d += ` C ${cx},${bottom[i + 1]} ${cx},${bottom[i]} ${xs[i]},${bottom[i]}`;
  }
  return d + " Z";
}

/**
 * A rank-based ribbon/bump chart — each series is a thick band whose vertical position at every x
 * step reflects its *rank* among the other series there (1st, 2nd, 3rd, ...), not its raw value.
 * Built for leaderboard-style "who's ahead over time" comparisons where the relative order matters
 * more than the exact magnitude gap between series — see `LineChart`/`StackedLineChart` for
 * magnitude-based comparisons instead. Ties are broken by each series' own position in `series`
 * (stable), so a tie never flickers rank between two otherwise-identical values.
 */
export function RibbonChart({
  series,
  xLabels,
  title,
  ariaLabel,
  height = 320,
  labelStep = 1,
  filterable,
  bionic,
  bionicOptions,
  className,
  ...props
}: RibbonChartProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const { activeKey, isSelected, getMarkProps, backgroundProps } = useChartMarkSelection<string>();
  const { hidden, toggle, isVisible } = useSeriesFilter(series.map((s) => s.label));
  const visibleSeries = filterable ? series.filter((s) => isVisible(s.label)) : series;
  const width = 700;
  const marginLeft = 20;
  const marginRight = 120;
  const marginTop = 24;
  const marginBottom = 40;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  if (visibleSeries.length === 0 || xLabels.length < 2) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-ribbon-chart", className)}
        data-rebar-component="ribbon-chart"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(height)}
        {filterable ? <ChartFilterFooter labels={series.map((s) => s.label)} hidden={hidden} onToggle={toggle} /> : null}
      </figure>
    );
  }

  const n = visibleSeries.length;
  const rowHeight = plotHeight / n;
  const halfWidth = rowHeight * 0.36;
  const xScale = (j: number) => marginLeft + (plotWidth * j) / (xLabels.length - 1);
  const yForRank = (rank: number) => marginTop + (rank - 0.5) * rowHeight;

  // ranks[j][seriesIndex] = 1-based rank of that series at x position j (1 = highest value).
  const ranks: number[][] = xLabels.map((_, j) => {
    const order = visibleSeries
      .map((s, i) => ({ i, v: s.values[j] ?? -Infinity }))
      .sort((a, b) => b.v - a.v || a.i - b.i);
    const rankAt: number[] = new Array(n);
    order.forEach((entry, rankIndex) => {
      rankAt[entry.i] = rankIndex + 1;
    });
    return rankAt;
  });

  const xs = xLabels.map((_, j) => xScale(j));

  return (
    <figure
      className={clsx("rebar-chart", "rebar-ribbon-chart", className)}
      data-rebar-component="ribbon-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Ribbon chart"}
        {...backgroundProps}
      >
        <rect x={0} y={0} width={width} height={height} fill="transparent" data-rebar-part="chart-background" />
        {xLabels.map((label, j) => {
          if (j % labelStep !== 0 && j !== xLabels.length - 1) return null;
          return (
            <text
              key={label}
              x={xScale(j)}
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
          const centers = ranks.map((rankAt) => yForRank(rankAt[i]!));
          return (
            <path
              key={s.label}
              d={buildRibbonPath(xs, centers, halfWidth)}
              fill={color}
              fillOpacity={0.75}
              stroke={color}
              strokeWidth={1}
              style={{ cursor: "pointer" }}
              data-rebar-part="mark"
              {...getMarkProps(s.label)}
            />
          );
        })}
        {visibleSeries.map((s, i) => {
          const originalIndex = series.indexOf(s);
          const lastRank = ranks[ranks.length - 1]![i]!;
          const selected = isSelected(s.label);
          return (
            <text
              key={s.label}
              x={xs[xs.length - 1]! + 10}
              y={yForRank(lastRank) + 4}
              fontSize={12}
              fill={s.color ?? DEFAULT_PALETTE[originalIndex % DEFAULT_PALETTE.length]}
              style={{ fontWeight: selected ? 700 : 600 }}
            >
              {s.label}
            </text>
          );
        })}
        {activeKey
          ? (() => {
              const activeSeries = visibleSeries.find((s) => s.label === activeKey);
              if (!activeSeries) return null;
              const i = visibleSeries.indexOf(activeSeries);
              const lastJ = xLabels.length - 1;
              const rank = ranks[lastJ]![i]!;
              const originalIndex = series.indexOf(activeSeries);
              return (
                <ChartValueTag
                  x={xs[lastJ]!}
                  y={yForRank(rank)}
                  viewBoxWidth={width}
                  viewBoxHeight={height}
                  accentColor={activeSeries.color ?? DEFAULT_PALETTE[originalIndex % DEFAULT_PALETTE.length]}
                  lines={[activeSeries.label, `Rank ${rank} of ${n} (${xLabels[lastJ]})`]}
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
