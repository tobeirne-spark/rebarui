import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { ChartValueTag, useChartMarkSelection } from "../chartMarkSelection";
import { renderBionicChildren, useAmbientBionic, useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface UMAPPlotPoint {
  x: number;
  y: number;
  /** An optional per-point identifier (a record id, a filename, a chunk index) shown in the
   * hover/selection tag alongside its cluster — omit for a plain, unlabeled point. */
  id?: string;
  /**
   * A short text preview of the underlying content this point represents — the real point of
   * visualizing a vector database's embeddings: not the raw (meaningless-on-their-own) x/y
   * coordinates, but *what content actually lives here*. Shown (truncated) in the hover/selection
   * tag in place of coordinates when supplied. Omit for a plain embedding plot with no per-point
   * content to preview.
   */
  preview?: string;
}

export interface UMAPPlotCluster {
  label: string;
  /** Defaults to the next color in a small built-in palette, cycled by cluster index — supply one
   * explicitly only when a specific color carries real meaning (e.g. matching another chart on
   * the same page, or a fixed color a caller already associates with this cluster elsewhere). */
  color?: string;
  points: UMAPPlotPoint[];
}

export interface UMAPPlotProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  /** Points grouped by cluster/label — the output shape a real UMAP/t-SNE reduction naturally
   * produces (each input sample keeps whatever category it already had, now just embedded into
   * 2D). This component draws the already-reduced 2D points; it does not run UMAP itself. */
  clusters: UMAPPlotCluster[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  height?: number;
  /** Force bionic reading on/off for the title and legend labels, overriding the ambient
   * data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

const DEFAULT_PALETTE = [
  "var(--rebar-color-primary, #0066cc)",
  "var(--rebar-color-success, #2e7d32)",
  "var(--rebar-color-warning, #f57c00)",
  "var(--rebar-color-danger, #d32f2f)",
  "var(--rebar-color-info, #0288d1)",
  "var(--rebar-color-text-secondary, #757575)",
];

const POINT_RADIUS = 3.5;
const PREVIEW_TRUNCATE_LENGTH = 60;

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

/**
 * A 2D embedding scatter plot — the standard way to visualize a UMAP (or t-SNE/PCA) dimensionality
 * reduction. Built with a specific real use case in mind: browsing a vector database's contents —
 * each point is one stored record/chunk, colored by whichever cluster/collection/category it
 * belongs to, with its actual text content (not its raw coordinates) surfaced on hover, since
 * that's what someone inspecting a vector DB actually wants to know about a point. Deliberately
 * distinct from `ScatterChart` (a distribution plot — jittered columns of 1D values per series)
 * and `BubbleChart` (a real measured x/y/size relationship): a UMAP embedding's own x/y values
 * carry **no interpretable unit or meaning** on their own — only relative distance/clustering does
 * — so this omits numeric axis ticks entirely (which would otherwise imply a false precision/scale
 * the values don't have) in favor of plain "UMAP-1"/"UMAP-2" dimension captions, the real
 * convention every UMAP-producing library (umap-learn, scikit-learn) publishes its own example
 * plots with.
 *
 * Reuses the same persistent hover/selection interaction every other chart in this family shares
 * (`useChartMarkSelection`/`ChartValueTag` — see ref/HEURISTICS.md #16): hovering a point shows its
 * cluster, id, and content preview (falling back to raw coordinates when a point has no `preview`
 * — a plain embedding plot with nothing else to show); clicking persists that tag; a dead click on
 * empty plot space clears it.
 */
export function UMAPPlot({
  clusters,
  title,
  ariaLabel,
  height = 360,
  bionic,
  bionicOptions,
  className,
  ...props
}: UMAPPlotProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;
  const { activeKey, isSelected, getMarkProps, backgroundProps } = useChartMarkSelection<string>();

  const width = 700;
  const marginLeft = 40;
  const marginRight = 20;
  const marginTop = 16;
  const marginBottom = 34;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const allPoints = clusters.flatMap((c) => c.points);
  if (allPoints.length === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-umap-plot", className)}
        data-rebar-component="umap-plot"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(height)}
      </figure>
    );
  }

  const xs = allPoints.map((p) => p.x);
  const ys = allPoints.map((p) => p.y);
  const rawXMin = Math.min(...xs);
  const rawXMax = Math.max(...xs);
  const xPad = (rawXMax - rawXMin) * 0.1 || 1;
  const xMin = rawXMin - xPad;
  const xMax = rawXMax + xPad;

  const rawYMin = Math.min(...ys);
  const rawYMax = Math.max(...ys);
  const yPad = (rawYMax - rawYMin) * 0.1 || 1;
  const yMin = rawYMin - yPad;
  const yMax = rawYMax + yPad;

  const xScale = (v: number) => marginLeft + ((v - xMin) / (xMax - xMin)) * plotWidth;
  const yScale = (v: number) => marginTop + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;

  const activeIndices = activeKey ? activeKey.split(":").map(Number) : null;
  const activeClusterIndex = activeIndices ? activeIndices[0] : undefined;
  const activePointIndex = activeIndices ? activeIndices[1] : undefined;
  const activeCluster = activeClusterIndex !== undefined ? clusters[activeClusterIndex] : undefined;
  const activePoint = activeCluster && activePointIndex !== undefined ? activeCluster.points[activePointIndex] : undefined;

  return (
    <figure
      className={clsx("rebar-chart", "rebar-umap-plot", className)}
      data-rebar-component="umap-plot"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "UMAP plot"}
        {...backgroundProps}
      >
        <rect x={0} y={0} width={width} height={height} fill="transparent" data-rebar-part="chart-background" />
        <rect
          x={marginLeft}
          y={marginTop}
          width={plotWidth}
          height={plotHeight}
          fill="none"
          stroke="var(--rebar-color-border, #e0e0e0)"
          strokeWidth={1}
        />
        {/* No numeric tick labels on either axis, deliberately — a UMAP embedding's raw x/y values
            carry no real-world unit or meaningful scale on their own, only relative position does,
            so printing tick numbers would imply a precision that isn't real. */}
        <text
          x={marginLeft + plotWidth / 2}
          y={height - 8}
          fontSize={11}
          textAnchor="middle"
          fill="var(--rebar-color-text-secondary, #757575)"
        >
          UMAP-1
        </text>
        <text
          x={0}
          y={0}
          fontSize={11}
          textAnchor="middle"
          fill="var(--rebar-color-text-secondary, #757575)"
          transform={`translate(12, ${marginTop + plotHeight / 2}) rotate(-90)`}
        >
          UMAP-2
        </text>
        {clusters.map((cluster, ci) => {
          const color = cluster.color ?? DEFAULT_PALETTE[ci % DEFAULT_PALETTE.length];
          return (
            <g key={cluster.label} data-rebar-part="cluster">
              {cluster.points.map((point, pi) => {
                const key = `${ci}:${pi}`;
                const selected = isSelected(key);
                return (
                  <circle
                    key={pi}
                    data-rebar-part="point"
                    cx={xScale(point.x)}
                    cy={yScale(point.y)}
                    r={selected ? POINT_RADIUS + 2 : POINT_RADIUS}
                    fill={color}
                    opacity={selected ? 1 : 0.7}
                    stroke={selected ? "var(--rebar-color-bg-primary, #ffffff)" : undefined}
                    strokeWidth={selected ? 1.5 : undefined}
                    style={{ cursor: "pointer" }}
                    {...getMarkProps(key)}
                  />
                );
              })}
            </g>
          );
        })}
        {activeCluster && activePoint
          ? (() => {
              const lines = [activePoint.id ? `${activeCluster.label} — ${activePoint.id}` : activeCluster.label];
              lines.push(
                activePoint.preview
                  ? truncate(activePoint.preview, PREVIEW_TRUNCATE_LENGTH)
                  : `x: ${activePoint.x.toFixed(2)}  y: ${activePoint.y.toFixed(2)}`,
              );
              return (
                <ChartValueTag
                  x={xScale(activePoint.x)}
                  y={yScale(activePoint.y)}
                  viewBoxWidth={width}
                  viewBoxHeight={height}
                  accentColor={activeCluster.color ?? DEFAULT_PALETTE[(activeClusterIndex as number) % DEFAULT_PALETTE.length]}
                  lines={lines}
                />
              );
            })()
          : null}
      </svg>
      {clusters.length ? (
        <div
          data-rebar-part="legend"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "var(--rebar-space-sm, 8px)",
            marginTop: "var(--rebar-space-xs, 4px)",
          }}
        >
          {clusters.map((cluster, i) => {
            const color = cluster.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
            return (
              <span
                key={cluster.label}
                data-rebar-part="legend-item"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "var(--rebar-font-size-sm, 12px)",
                  color: "var(--rebar-color-text-primary, #212121)",
                }}
              >
                <span
                  aria-hidden="true"
                  data-rebar-part="legend-swatch"
                  style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }}
                />
                {renderBionicChildren(cluster.label, bionicEnabled, bionicOptions)}
              </span>
            );
          })}
        </div>
      ) : null}
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
