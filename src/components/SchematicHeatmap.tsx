import { useId, useState } from "react";
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from "react";
import clsx from "clsx";
import {
  backgroundSrc,
  framesOf,
  labelLayout,
  outlinePath,
  defaultColorScale,
  regionBounds,
  shareOf,
  RAMP_STEPS,
} from "./heatmapGeometry";
import type { HeatmapBackground, HeatmapBounds, HeatmapBrush, HeatmapRegion, HeatmapValue } from "./heatmapGeometry";

export interface SchematicHeatmapLabels {
  /** Legend text at the low end of the ramp. Default "0%". */
  low: string;
  /** Legend text at the high end. Default "100%". */
  high: string;
  /** Legend text for the hatched swatch, and the readout for a region with no value. Default "no data". */
  noData: string;
  /** The readout shown when nothing is hovered, focused or selected. */
  hint: string;
}

const DEFAULT_LABELS: SchematicHeatmapLabels = {
  low: "0%",
  high: "100%",
  noData: "no data",
  hint: "Hover or focus a region for its numbers; click to pin it.",
};

export interface SchematicHeatmapProps extends Omit<ComponentPropsWithoutRef<"figure">, "title" | "onSelect"> {
  /** The shapes to draw. Rects are in the same canvas units as `crop`. */
  regions: HeatmapRegion[];
  /** Label rules per `region.kind`: a brush with `showLabel === false` draws no text. Either a list
   * (as stored in a `HeatmapLayout`) or an id -> brush record. Omit to label every region. */
  brushes?: HeatmapBrush[] | Record<string, HeatmapBrush>;
  /** Region id -> value. A `{ done, expected }` pair is shaded by `done / expected`; a bare number
   * is taken as a ready-made 0..1 share. A region with no entry, a non-finite number, or
   * `expected <= 0` is drawn as "no data" (a neutral hatch) — never as 0%. */
  values?: Record<string, HeatmapValue | undefined>;
  /** `[x0, y0, x1, y1]` of the canvas to show. Defaults to the regions' own bounds plus a margin. */
  crop?: HeatmapBounds;
  /** A tracing image behind the regions — drawn only when its `showInPlot` is on. */
  background?: HeatmapBackground;
  /** Controlled selection (`null` = nothing selected). Omit for uncontrolled. */
  selectedId?: string | null;
  /** Uncontrolled initial selection. */
  defaultSelectedId?: string | null;
  /** Called with the region id when a region is pinned, or `null` when it is un-pinned. */
  onSelect?: (id: string | null) => void;
  /** The chart's accessible name — required, because the chart is its own landmark. */
  ariaLabel: string;
  /** Maps a 0..1 share to a CSS colour. Defaults to an 8-step ramp of `--rebar-color-primary`. */
  colorScale?: (share: number) => string;
  /** Overrides the legend/readout wording (localisation, or "complete" instead of "collected"). */
  labels?: Partial<SchematicHeatmapLabels>;
  /** Overrides the readout/tooltip text for a region. `share` is null when there is no data. */
  formatValue?: (info: { region: HeatmapRegion; share: number | null; value: HeatmapValue | undefined }) => string;
  /** Hide the legend + readout strip. */
  hideLegend?: boolean;
  /** Extra content rendered at the end of the legend strip (e.g. a metric switcher). */
  legendExtra?: ReactNode;
}

function defaultFormat(label: string, share: number | null, value: HeatmapValue | undefined, noData: string): string {
  if (share === null) return `${label}: ${noData}`;
  const pct = `${(share * 100).toFixed(1)}%`;
  if (value && typeof value === "object") return `${label}: ${pct} (${value.done.toLocaleString()} / ${value.expected.toLocaleString()})`;
  return `${label}: ${pct}`;
}

/**
 * A schematic drawn to scale — arbitrary rectangle-union regions (a building footprint, a tunnel
 * interval, a floor zone) shaded by how complete each one is, optionally over a tracing image.
 * A different shape from `Heatmap` (a row/col matrix) and `GeoChart` (map projections): regions sit
 * exactly where the source drawing has them, and one region may be several rects drawn as ONE
 * shape with a single outline (see `outlinePath`).
 *
 * Opinion tier: it owns a real interaction state machine — which region is hovered/focused, and
 * which is pinned (controlled via `selectedId`/`onSelect`, or uncontrolled via `defaultSelectedId`)
 * — that changes what the readout and every region's outline show. Regions are keyboard
 * operable (Tab to focus, Enter/Space to pin). Nothing here fetches or knows what the numbers mean:
 * the host supplies `values` keyed by region id.
 */
export function SchematicHeatmap({
  regions,
  brushes,
  values = {},
  crop,
  background,
  selectedId,
  defaultSelectedId = null,
  onSelect,
  ariaLabel,
  colorScale = defaultColorScale,
  labels,
  formatValue,
  hideLegend = false,
  legendExtra,
  className,
  ...props
}: SchematicHeatmapProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const [internalSelected, setInternalSelected] = useState<string | null>(defaultSelectedId);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const patternId = `rebar-schematic-hatch-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const controlled = selectedId !== undefined;
  const currentSelected = controlled ? selectedId : internalSelected;

  const brushMap: Record<string, HeatmapBrush> = Array.isArray(brushes)
    ? Object.fromEntries(brushes.map((b) => [b.id, b]))
    : (brushes ?? {});

  const view: HeatmapBounds =
    crop ??
    framesOf({ regions, frames: [], cellSize: 20 })[0]!.crop;
  const [x0, y0, x1, y1] = view;
  const w = x1 - x0;
  const h = y1 - y0;
  // Font sizes are in canvas units, so they scale with the crop: a wide view has tiny labels, a
  // single row reads at a normal size.
  const fontSize = Math.max(9, Math.round(w / 150));

  const select = (id: string | null) => {
    if (!controlled) setInternalSelected(id);
    onSelect?.(id);
  };
  const toggle = (id: string) => select(currentSelected === id ? null : id);

  const describe = (region: HeatmapRegion): string => {
    const value = values[region.id];
    const share = shareOf(value);
    return formatValue ? formatValue({ region, share, value }) : defaultFormat(region.label, share, value, text.noData);
  };

  const readoutRegion = regions.find((r) => r.id === (hoverId ?? currentSelected)) ?? null;
  const rootState = hoverId ? "hovering" : currentSelected ? "selected" : "idle";

  const onRegionKeyDown = (e: KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(id);
    } else if (e.key === "Escape" && currentSelected) {
      select(null);
    }
  };

  const legendSteps = Array.from({ length: RAMP_STEPS }, (_, i) => colorScale((i + 0.5) / RAMP_STEPS));

  return (
    <figure
      className={clsx("rebar-chart", "rebar-schematic-heatmap", className)}
      data-rebar-component="schematic-heatmap"
      data-rebar-state={rootState}
      {...props}
    >
      <svg
        data-rebar-part="canvas"
        viewBox={`${x0} ${y0} ${w} ${h}`}
        role="group"
        aria-label={ariaLabel}
        className="rebar-schematic-heatmap-canvas"
        onPointerLeave={() => setHoverId(null)}
      >
        <defs>
          <pattern id={patternId} width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={12} height={12} fill="var(--rebar-color-bg-primary, #ffffff)" />
            <line x1={0} y1={0} x2={0} y2={12} stroke="var(--rebar-color-bg-tertiary, #e0e0e0)" strokeWidth={4} />
          </pattern>
        </defs>
        {background?.showInPlot ? (
          <image
            data-rebar-part="background"
            href={backgroundSrc(background)}
            transform={`translate(${background.x} ${background.y}) scale(${background.scale})`}
            opacity={background.opacity}
          />
        ) : null}
        {regions.map((region) => {
          const value = values[region.id];
          const share = shareOf(value);
          const fill = share === null ? `url(#${patternId})` : colorScale(share);
          const isSelected = currentSelected === region.id;
          const isHovered = hoverId === region.id;
          const bounds = regionBounds({ regions: [region] });
          const outline = outlinePath(region.rects);
          const showLabel = brushMap[region.kind]?.showLabel !== false && region.rects.length > 0;
          const stroke =
            isSelected || isHovered
              ? "var(--rebar-color-text-primary, #212121)"
              : share === null
                ? "var(--rebar-color-border, #c9c9c9)"
                : "var(--rebar-color-bg-primary, #ffffff)";
          const label = labelLayout(region.rects[0] ?? [0, 0, 0, 0], region.label, fontSize);
          return (
            <g
              key={region.id}
              data-rebar-part="region"
              data-region={region.id}
              data-rebar-state={isSelected ? "selected" : share === null ? "no-data" : "value"}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={describe(region)}
              onPointerEnter={() => setHoverId(region.id)}
              onFocus={() => setHoverId(region.id)}
              onBlur={() => setHoverId((cur) => (cur === region.id ? null : cur))}
              onClick={() => toggle(region.id)}
              onKeyDown={(e) => onRegionKeyDown(e, region.id)}
            >
              <title>{describe(region)}</title>
              {/* One filled shape per rect + one closed outline round the whole union, so a region
                  painted as several stacked rects reads as a single block (no seam lines). */}
              {region.rects.map(([rx0, ry0, rx1, ry1], i) => (
                <rect key={i} x={rx0 - 0.25} y={ry0 - 0.25} width={rx1 - rx0 + 0.5} height={ry1 - ry0 + 0.5} fill={fill} />
              ))}
              {bounds ? (
                <path
                  data-rebar-part="region-outline"
                  d={outline}
                  fill="none"
                  strokeLinejoin="round"
                  stroke={stroke}
                  strokeWidth={isSelected ? 3 : share === null ? 1 : 2}
                />
              ) : null}
              {showLabel ? (
                <text
                  data-rebar-part="region-label"
                  transform={label.rotate ? `translate(${label.cx} ${label.cy}) rotate(-90)` : undefined}
                  x={label.rotate ? undefined : label.cx}
                  y={label.rotate ? undefined : label.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={label.size}
                  fill="var(--rebar-color-text-primary, #212121)"
                  stroke="var(--rebar-color-bg-primary, #ffffff)"
                  strokeWidth={label.size * 0.22}
                  paintOrder="stroke"
                  pointerEvents="none"
                >
                  {region.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {hideLegend ? null : (
        <div data-rebar-part="legend-row" className="rebar-schematic-heatmap-legend-row">
          <span data-rebar-part="readout" className="rebar-schematic-heatmap-readout">
            {readoutRegion ? <strong>{describe(readoutRegion)}</strong> : <span className="rebar-schematic-heatmap-hint">{text.hint}</span>}
          </span>
          <span data-rebar-part="legend" className="rebar-schematic-heatmap-legend" aria-hidden="true">
            <span className="rebar-schematic-heatmap-legend-text">{text.low}</span>
            <span className="rebar-schematic-heatmap-ramp">
              {legendSteps.map((color, i) => (
                <span key={i} style={{ background: color }} />
              ))}
            </span>
            <span className="rebar-schematic-heatmap-legend-text">{text.high}</span>
            <span className="rebar-schematic-heatmap-nodata-swatch" />
            <span className="rebar-schematic-heatmap-legend-text">{text.noData}</span>
          </span>
          {legendExtra}
        </div>
      )}
    </figure>
  );
}
