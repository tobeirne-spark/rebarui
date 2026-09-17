import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface FunnelChartStage {
  label: string;
  value: number;
  /** Defaults to the next color in a small built-in palette, cycled by stage index. */
  color?: string;
}

export interface FunnelChartMilestone {
  /** Places this milestone at the boundary just below this stage index (0-based) — e.g. `0`
   * marks the line between the first and second stages. */
  afterStageIndex: number;
  label: string;
}

export interface FunnelChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  stages: FunnelChartStage[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  /** Height, in SVG units, of each stage's own band (not the whole chart). */
  height?: number;
  valueFormat?: (v: number) => string;
  /** Dashed marker lines at specific stage boundaries — a target/checkpoint callout distinct from
   * the stages themselves (e.g. "industry benchmark" or "Q3 goal"), the same visual convention
   * `LineChart`'s own `crossoverIndex` marker uses. */
  milestones?: FunnelChartMilestone[];
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
 * A staged, narrowing-bar chart (Visitors → Signups → Purchases, ...) — each stage's width scaled
 * against the first stage's value, drawn as a continuous trapezoid that tapers from its own width
 * down to the next stage's, so the whole shape reads as one funnel rather than disconnected bars.
 */
export function FunnelChart({
  stages,
  title,
  ariaLabel,
  height = 64,
  valueFormat = (v: number) => Math.round(v).toLocaleString(),
  milestones = [],
  bionic,
  bionicOptions,
  className,
  ...props
}: FunnelChartProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  if (stages.length === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-funnel-chart", className)}
        data-rebar-component="funnel-chart"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(height)}
      </figure>
    );
  }
  const width = 700;
  const marginLeft = 130;
  const marginRight = 100;
  const marginTop = 16;
  const marginBottom = 16;
  const plotWidth = width - marginLeft - marginRight;
  const maxShapeWidth = plotWidth * 0.92;
  const cx = marginLeft + plotWidth / 2;
  const svgHeight = marginTop + marginBottom + height * stages.length;

  const firstValue = Math.max(stages[0]?.value ?? 0, 0);
  const widths = stages.map((stage) => {
    const value = Math.max(stage.value, 0);
    const ratio = firstValue > 0 ? value / firstValue : 0;
    return maxShapeWidth * ratio;
  });

  return (
    <figure
      className={clsx("rebar-chart", "rebar-funnel-chart", className)}
      data-rebar-component="funnel-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${svgHeight}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Funnel chart"}
      >
        {stages.map((stage, i) => {
          const color = stage.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length] ?? "var(--rebar-color-primary, #0066cc)";
          const yTop = marginTop + height * i;
          const yBottom = yTop + height;
          const yMid = (yTop + yBottom) / 2 + 4;
          const topW = widths[i] ?? 0;
          const bottomW = widths[i + 1] ?? topW;
          // Each side eases from its own top width to its own bottom width via a cubic bezier
          // (control points at 1/3 and 2/3 down the band, holding each end's tangent flat) rather
          // than a straight diagonal — the whole funnel reads as one continuously-tapering shape
          // instead of stacked, angular trapezoids, since each stage's curve starts flat where the
          // previous one's ended and vice versa.
          const yC1 = yTop + height / 3;
          const yC2 = yTop + (height * 2) / 3;
          const path = [
            `M ${cx - topW / 2} ${yTop}`,
            `L ${cx + topW / 2} ${yTop}`,
            `C ${cx + topW / 2} ${yC1}, ${cx + bottomW / 2} ${yC2}, ${cx + bottomW / 2} ${yBottom}`,
            `L ${cx - bottomW / 2} ${yBottom}`,
            `C ${cx - bottomW / 2} ${yC2}, ${cx - topW / 2} ${yC1}, ${cx - topW / 2} ${yTop}`,
            "Z",
          ].join(" ");
          return (
            <g key={stage.label} data-rebar-part="stage">
              <path d={path} fill={color} />
              <text
                x={marginLeft - 12}
                y={yMid}
                fontSize={12}
                textAnchor="end"
                fill="var(--rebar-color-text-primary, #212121)"
                style={{ fontWeight: 600 }}
              >
                {stage.label}
              </text>
              <text x={width - marginRight + 12} y={yMid} fontSize={12} textAnchor="start" fill="var(--rebar-color-text-secondary, #757575)">
                {valueFormat(stage.value)}
              </text>
            </g>
          );
        })}
        {milestones.map((milestone, i) => {
          if (milestone.afterStageIndex < 0 || milestone.afterStageIndex >= stages.length - 1) return null;
          const y = marginTop + height * (milestone.afterStageIndex + 1);
          return (
            <g key={i} data-rebar-part="milestone">
              <line
                x1={marginLeft}
                y1={y}
                x2={width - marginRight}
                y2={y}
                stroke="var(--rebar-color-warning, #f57c00)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              <text
                x={width - marginRight}
                y={y - 5}
                fontSize={10}
                textAnchor="end"
                fill="var(--rebar-color-warning, #f57c00)"
              >
                {milestone.label}
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
