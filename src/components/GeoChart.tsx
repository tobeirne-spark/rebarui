import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

export interface GeoChartRegion {
  id: string;
  label: string;
  value: number;
}

export interface GeoChartLayoutEntry {
  id: string;
  row: number;
  col: number;
}

export interface GeoChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  regions: GeoChartRegion[];
  /** Explicit grid position per region. A region whose `id` isn't present here falls back to the
   * same auto-layout used when this prop is omitted entirely, slotted in after every explicitly
   * placed region — so a caller can pin a few regions and let the rest fall into place. */
  layout?: GeoChartLayoutEntry[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16: a chart
   * ships with a title, not just an accessible name a sighted reader never sees. Optional only so
   * a chart embedded somewhere its own heading already serves this role doesn't get a duplicate
   * one; supplying it is the default expectation, not an edge case. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  /** Side length of one grid cell, in SVG units. */
  cellSize?: number;
  /** Maps a value normalized to 0-1 (relative to the min/max `value` across all of `regions`) to a
   * CSS color string. Defaults to the exact same light-to-dark `color-mix` opacity gradient
   * `Heatmap` uses, for visual consistency between the two density-by-color chart types. */
  colorScale?: (normalizedValue: number) => string;
}

// Identical to `Heatmap`'s own default — see that file's comment for why: a plain opacity gradient
// on the real `--rebar-color-primary` token, not a hardcoded multi-hue scale, matching this
// project's low-fidelity, function-over-form philosophy. Duplicated rather than imported since each
// chart component in this package is a standalone file with no cross-component dependency.
const DEFAULT_COLOR_SCALE = (normalizedValue: number): string => {
  const t = Math.max(0, Math.min(1, normalizedValue));
  const percent = Math.round(8 + t * 92); // 8% (near-white) through 100% (the true max value)
  return `color-mix(in srgb, var(--rebar-color-primary, #0066cc) ${percent}%, transparent)`;
};

interface ResolvedPosition {
  id: string;
  row: number;
  col: number;
}

// Auto-layout: a roughly square grid, filled in the order `regions` was given (row-major). Used
// wholesale when `layout` is omitted, and as the fallback for any region `layout` doesn't mention.
function autoLayout(ids: string[]): ResolvedPosition[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(ids.length)));
  return ids.map((id, i) => ({ id, row: Math.floor(i / cols), col: i % cols }));
}

function resolveLayout(regions: GeoChartRegion[], layout: GeoChartLayoutEntry[] | undefined): ResolvedPosition[] {
  if (!layout || layout.length === 0) {
    return autoLayout(regions.map((r) => r.id));
  }
  const explicit = new Map(layout.map((entry) => [entry.id, entry]));
  const unplacedIds = regions.filter((r) => !explicit.has(r.id)).map((r) => r.id);
  const fallback = new Map(autoLayout(unplacedIds).map((p) => [p.id, p]));
  return regions.map((r) => {
    const pos = explicit.get(r.id) ?? fallback.get(r.id);
    // `pos` is always defined: every id is either in `explicit` or in `unplacedIds` (and thus in
    // `fallback`) — this `?? { row: 0, col: 0 }` only satisfies the type checker.
    return { id: r.id, row: pos?.row ?? 0, col: pos?.col ?? 0 };
  });
}

/**
 * A data-shaded map chart — **an abstract regional grid choropleth, not real cartography.**
 *
 * SCOPE DECISION: this component deliberately does NOT attempt real geographic border/projection
 * rendering. Doing that properly requires either a mapping dependency carrying real GeoJSON/
 * TopoJSON path data, or an enormous hand-authored path dataset per region set (countries, states,
 * postcodes, ...) — both are out of scope for this project's low-fidelity, no-heavy-dependency
 * philosophy (see `ref/ARCHITECTURE.md`). Instead, each region renders as a plain rounded `<rect>`
 * positioned on an abstract grid (explicit via `layout`, or auto-arranged into a roughly square
 * grid in the order `regions` was given) and shaded by `value` — exactly `Heatmap`'s own density
 * grid, with each cell's grid position standing in for a rough geographic position instead of a
 * row/col pair. Think of it as "a heatmap whose cells you position like a map," never as a
 * plausible substitute for a real geographic renderer — nobody should mistake this component's
 * rectangles for actual regional borders.
 */
export function GeoChart({
  regions,
  layout,
  title,
  ariaLabel,
  cellSize = 48,
  colorScale = DEFAULT_COLOR_SCALE,
  className,
  ...props
}: GeoChartProps) {
  const positions = resolveLayout(regions, layout);
  const positionById = new Map(positions.map((p) => [p.id, p]));

  const values = regions.map((r) => r.value);
  const valueMin = values.length ? Math.min(...values) : 0;
  const valueMax = values.length ? Math.max(...values) : 1;
  const valueRange = valueMax - valueMin;

  const maxRow = positions.length ? Math.max(...positions.map((p) => p.row)) : 0;
  const maxCol = positions.length ? Math.max(...positions.map((p) => p.col)) : 0;

  const padding = 8;
  const gap = 3;
  const width = padding * 2 + (maxCol + 1) * cellSize;
  const height = padding * 2 + (maxRow + 1) * cellSize;

  return (
    <figure
      className={clsx("rebar-chart", "rebar-geo-chart", className)}
      data-rebar-component="geo-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Geo chart"}
      >
        {regions.map((region) => {
          const pos = positionById.get(region.id);
          const row = pos?.row ?? 0;
          const col = pos?.col ?? 0;
          const normalized = valueRange !== 0 ? (region.value - valueMin) / valueRange : 1;
          const fill = colorScale(normalized);
          const x = padding + col * cellSize + gap;
          const y = padding + row * cellSize + gap;
          const side = cellSize - gap * 2;
          return (
            <g key={region.id}>
              <rect
                data-rebar-part="region"
                data-region-id={region.id}
                x={x}
                y={y}
                width={side}
                height={side}
                rx={6}
                fill={fill}
                stroke="var(--rebar-color-border, #e0e0e0)"
                strokeWidth={1}
              >
                <title>{`${region.label}: ${region.value}`}</title>
              </rect>
              <text
                x={x + side / 2}
                y={y + side / 2 + 4}
                fontSize={Math.min(11, side / 5)}
                textAnchor="middle"
                fill="var(--rebar-color-text-primary, #212121)"
              >
                {region.label}
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
