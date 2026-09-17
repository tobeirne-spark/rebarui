import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface BulletGraphMeasure {
  label: string;
  value: number;
  target: number;
  /** Three ascending thresholds marking the boundaries of the qualitative range bands (e.g.
   * "poor"/"satisfactory"/"good") the measure bar is judged against — the last value is also the
   * chart's own max unless `value`/`target` exceed it. */
  ranges: [number, number, number];
  /** Defaults to the next color in a small built-in palette, cycled by measure index. */
  color?: string;
}

export interface BulletGraphProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  measures: BulletGraphMeasure[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  valueFormat?: (v: number) => string;
  /** Height of one measure's own row, in SVG units. */
  rowHeight?: number;
  /** Force bionic reading on/off for the title/measure labels, overriding the ambient
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

// Three qualitative range bands, light to dark on a single neutral scale (never a hue at this
// level — the *bands* are context, only the measure bar and target tick carry real identity/
// meaning colors) — see this project's dataviz conventions: sequential magnitude is one hue,
// light to dark, never a rainbow.
const RANGE_SHADES = ["var(--rebar-color-bg-secondary, #f0f0f0)", "#e0e0e0", "#cfcfcf"];

/**
 * Stephen Few's bullet graph — a single measure bar against a target tick, judged in context by
 * three qualitative range bands (e.g. poor/satisfactory/good) instead of a full gauge/dial's
 * worth of chrome. Built for a compact row of KPIs — several measures stack as rows in one chart,
 * each independently scaled to its own `ranges`.
 */
export function BulletGraph({
  measures,
  title,
  ariaLabel,
  valueFormat = (v: number) => Math.round(v).toLocaleString(),
  rowHeight = 48,
  bionic,
  bionicOptions,
  className,
  ...props
}: BulletGraphProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const width = 700;
  const marginLeft = 120;
  const marginRight = 60;
  const marginTop = 16;
  const marginBottom = 8;
  const plotWidth = width - marginLeft - marginRight;
  const height = marginTop + marginBottom + measures.length * rowHeight;

  if (measures.length === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-bullet-graph", className)}
        data-rebar-component="bullet-graph"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(160)}
      </figure>
    );
  }

  return (
    <figure
      className={clsx("rebar-chart", "rebar-bullet-graph", className)}
      data-rebar-component="bullet-graph"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Bullet graph"}
      >
        {measures.map((m, i) => {
          const color = m.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
          const rowMax = Math.max(m.ranges[2], m.value, m.target) * 1.02;
          const xScale = (v: number) => marginLeft + (Math.max(0, v) / rowMax) * plotWidth;
          const rowY = marginTop + i * rowHeight;
          const rowCenter = rowY + rowHeight / 2;
          const bandEdges = [0, ...m.ranges];
          return (
            <g key={m.label} data-rebar-part="measure">
              {bandEdges.slice(0, 3).map((edge, bandIndex) => {
                const nextEdge = bandEdges[bandIndex + 1]!;
                return (
                  <rect
                    key={bandIndex}
                    x={xScale(edge)}
                    y={rowY + rowHeight * 0.15}
                    width={xScale(nextEdge) - xScale(edge)}
                    height={rowHeight * 0.7}
                    fill={RANGE_SHADES[bandIndex]}
                  />
                );
              })}
              <rect
                x={xScale(0)}
                y={rowY + rowHeight * 0.36}
                width={xScale(m.value) - xScale(0)}
                height={rowHeight * 0.28}
                fill={color}
                data-rebar-part="measure-bar"
              />
              <line
                x1={xScale(m.target)}
                y1={rowY + rowHeight * 0.12}
                x2={xScale(m.target)}
                y2={rowY + rowHeight * 0.88}
                stroke="var(--rebar-color-text-primary, #212121)"
                strokeWidth={3}
                data-rebar-part="target"
              />
              <text
                x={marginLeft - 12}
                y={rowCenter + 4}
                fontSize={12}
                textAnchor="end"
                fill="var(--rebar-color-text-primary, #212121)"
                style={{ fontWeight: 600 }}
              >
                {m.label}
              </text>
              <text
                x={width - marginRight + 10}
                y={rowCenter + 4}
                fontSize={11}
                textAnchor="start"
                fill="var(--rebar-color-text-secondary, #757575)"
              >
                {valueFormat(m.value)} / {valueFormat(m.target)}
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
          {titleContent}
        </figcaption>
      ) : null}
    </figure>
  );
}
