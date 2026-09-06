import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";

export interface FunnelChartStage {
  label: string;
  value: number;
  /** Defaults to the next color in a small built-in palette, cycled by stage index. */
  color?: string;
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
  className,
  ...props
}: FunnelChartProps) {
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
          const path = [
            `M ${cx - topW / 2} ${yTop}`,
            `L ${cx + topW / 2} ${yTop}`,
            `L ${cx + bottomW / 2} ${yBottom}`,
            `L ${cx - bottomW / 2} ${yBottom}`,
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
