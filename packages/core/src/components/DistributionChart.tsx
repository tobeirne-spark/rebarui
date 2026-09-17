import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { ChartValueTag, useChartMarkSelection } from "../chartMarkSelection";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface DistributionSeries {
  label: string;
  mean: number;
  stdDev: number;
  /** Defaults to the next color in a small built-in palette, cycled by series index. */
  color?: string;
}

export interface DistributionChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  series: DistributionSeries[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  height?: number;
  xFormat?: (v: number) => string;
  /** Shades the ±1 standard-deviation band under each curve (the "68% of the data" convention).
   * Default `true`. */
  showStdDevBand?: boolean;
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

const SAMPLE_COUNT = 120;
// A normal curve is, in principle, nonzero everywhere — 4 standard deviations either side of the
// mean is the conventional cutoff for "close enough to zero to stop drawing" (>99.99% of the real
// area under the curve), the same convention most statistical plotting tools use.
const DOMAIN_STD_DEVS = 4;

function normalPdf(x: number, mean: number, stdDev: number): number {
  const variance = stdDev * stdDev;
  return Math.exp(-((x - mean) ** 2) / (2 * variance)) / Math.sqrt(2 * Math.PI * variance);
}

// Rounded to a fixed precision on purpose: `Math.exp` (used by `normalPdf` above) isn't required
// by IEEE-754 to be correctly rounded, unlike e.g. `Math.sqrt` — it can differ in its last one or
// two floating-point digits between Node (server render) and a browser's own engine build (client
// hydration) for the exact same input, a real hydration-mismatch class this project's own
// `PieChart`/`GaugeChart`/`RadarChart`/`NodeLinkGraph` already hit and fixed the same way. Every
// pdf-derived coordinate is rounded before it reaches a JSX attribute so both environments agree
// on the exact same string.
function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * A parametric normal ("bell curve") distribution plot — each series drawn from its own
 * `mean`/`stdDev`, not from raw sample data. This is a deliberate scope choice, not an oversight:
 * computing a real kernel-density estimate from raw samples is a substantially bigger statistical
 * undertaking than this project's low-fidelity philosophy calls for, and the parametric case (a
 * known or already-summarized distribution — a test-score curve, a tolerance band, a confidence
 * interval) is the far more common real need. A caller with raw samples computes their own
 * mean/stdDev first (a two-line reduction) rather than this component attempting KDE internally.
 */
export function DistributionChart({
  series,
  title,
  ariaLabel,
  height = 320,
  xFormat = (v: number) => Math.round(v).toLocaleString(),
  showStdDevBand = true,
  bionic,
  bionicOptions,
  className,
  ...props
}: DistributionChartProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const { activeKey, isSelected, getMarkProps, backgroundProps } = useChartMarkSelection<string>();
  const width = 700;
  const marginLeft = 20;
  const marginRight = 20;
  const marginTop = 16;
  const marginBottom = 40;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  if (series.length === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-distribution-chart", className)}
        data-rebar-component="distribution-chart"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(height)}
      </figure>
    );
  }

  const domainMin = Math.min(...series.map((s) => s.mean - DOMAIN_STD_DEVS * s.stdDev));
  const domainMax = Math.max(...series.map((s) => s.mean + DOMAIN_STD_DEVS * s.stdDev));
  const domainSpan = domainMax - domainMin || 1;

  const samplesBySeries = series.map((s) =>
    Array.from({ length: SAMPLE_COUNT + 1 }, (_, i) => {
      const x = domainMin + (domainSpan * i) / SAMPLE_COUNT;
      return { x, y: normalPdf(x, s.mean, s.stdDev) };
    }),
  );

  const peakY = Math.max(...samplesBySeries.flatMap((samples) => samples.map((p) => p.y)), 1e-9);

  const xScale = (x: number) => round(marginLeft + ((x - domainMin) / domainSpan) * plotWidth);
  const yScale = (y: number) => round(marginTop + plotHeight - (y / peakY) * plotHeight);
  const baselineY = marginTop + plotHeight;

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => domainMin + (domainSpan * i) / (tickCount - 1));

  return (
    <figure
      className={clsx("rebar-chart", "rebar-distribution-chart", className)}
      data-rebar-component="distribution-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Distribution chart"}
        {...backgroundProps}
      >
        <rect x={0} y={0} width={width} height={height} fill="transparent" data-rebar-part="chart-background" />
        <line x1={marginLeft} y1={baselineY} x2={width - marginRight} y2={baselineY} stroke="var(--rebar-color-border, #e0e0e0)" strokeWidth={1} />
        {ticks.map((t, i) => (
          <text
            key={i}
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
          const color = s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length] ?? "var(--rebar-color-primary, #0066cc)";
          const samples = samplesBySeries[i]!;
          const linePoints = samples.map((p) => `${xScale(p.x)},${yScale(p.y)}`).join(" ");
          const areaPoints = `${xScale(samples[0]!.x)},${baselineY} ${linePoints} ${xScale(samples[samples.length - 1]!.x)},${baselineY}`;
          const bandX1 = xScale(s.mean - s.stdDev);
          const bandX2 = xScale(s.mean + s.stdDev);
          const markKey = String(i);
          const selected = isSelected(markKey);
          return (
            <g key={s.label} data-rebar-part="series">
              {showStdDevBand ? (
                <rect
                  data-rebar-part="stddev-band"
                  x={bandX1}
                  y={marginTop}
                  width={bandX2 - bandX1}
                  height={plotHeight}
                  fill={color}
                  fillOpacity={0.08}
                />
              ) : null}
              <polygon points={areaPoints} fill={color} fillOpacity={0.18} stroke="none" />
              <polyline points={linePoints} fill="none" stroke={color} strokeWidth={2.5} />
              <line
                data-rebar-part="mean-line"
                x1={xScale(s.mean)}
                y1={yScale(normalPdf(s.mean, s.mean, s.stdDev))}
                x2={xScale(s.mean)}
                y2={baselineY}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              <circle
                data-rebar-part="mean-mark"
                cx={xScale(s.mean)}
                cy={yScale(normalPdf(s.mean, s.mean, s.stdDev))}
                r={selected ? 6 : 4}
                fill={color}
                stroke="var(--rebar-color-bg-primary, #ffffff)"
                strokeWidth={selected ? 2 : 1}
                style={{ cursor: "pointer" }}
                {...getMarkProps(markKey)}
              />
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
              const seriesIndex = Number(activeKey);
              const activeSeries = series[seriesIndex];
              if (!activeSeries) return null;
              return (
                <ChartValueTag
                  x={xScale(activeSeries.mean)}
                  y={yScale(normalPdf(activeSeries.mean, activeSeries.mean, activeSeries.stdDev))}
                  viewBoxWidth={width}
                  viewBoxHeight={height}
                  accentColor={activeSeries.color ?? DEFAULT_PALETTE[seriesIndex % DEFAULT_PALETTE.length]}
                  lines={[activeSeries.label, `mean ${xFormat(activeSeries.mean)}, σ ${xFormat(activeSeries.stdDev)}`]}
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
