import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { ChartValueTag, useChartMarkSelection } from "../chartMarkSelection";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface HeatmapCell {
  row: string;
  col: string;
  value: number;
}

export interface HeatmapProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  /** Sparse - not every row/col pair needs an entry. A pair absent from `data` renders as a
   * distinctly empty/neutral cell rather than being treated as a real value of 0. */
  data: HeatmapCell[];
  /** Explicit row order/set. Inferred from `data` (first-seen order) when omitted. */
  rows?: string[];
  /** Explicit column order/set. Inferred from `data` (first-seen order) when omitted. */
  cols?: string[];
  /** Rendered as a real, visible caption above the chart - see ref/HEURISTICS.md #16: a chart
   * ships with a title, not just an accessible name a sighted reader never sees. Optional only so
   * a chart embedded somewhere its own heading already serves this role doesn't get a duplicate
   * one; supplying it is the default expectation, not an edge case. */
  title?: string;
  /** Falls back to `title` when omitted - the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  /** Side length of one grid cell, in SVG units. */
  cellSize?: number;
  /** Maps a value normalized to 0-1 (relative to the min/max `value` across all of `data`) to a
   * CSS color string. Defaults to a simple light-to-dark blue interpolation. */
  colorScale?: (normalizedValue: number) => string;
  /** Force bionic reading on/off for the title, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

// A simple light-to-dark interpolation on a single base color (an alpha/opacity gradient, not a
// full multi-hue scale) - deliberately plain, matching this project's low-fidelity,
// function-over-form philosophy: a heatmap's job here is showing relative density at a glance, not
// a perceptually-calibrated multi-hue scale. `color-mix` blends the real `--rebar-color-primary`
// token toward transparent, so a consuming app's own theme override still shows through instead of
// a hardcoded hex baked into every cell.
const DEFAULT_COLOR_SCALE = (normalizedValue: number): string => {
  const t = Math.max(0, Math.min(1, normalizedValue));
  const percent = Math.round(8 + t * 92); // 8% (near-white) through 100% (the true max value)
  return "color-mix(in srgb, var(--rebar-color-primary, #0066cc) " + percent + "%, transparent)";
};

// A missing row/col pair is a distinct claim from "value is exactly 0" (no data was ever recorded
// for that combination) - a flat, uncomputed neutral fill keeps that visually distinct from even
// the lowest real value, which still gets *some* of the color scale's tint.
const MISSING_CELL_FILL = "var(--rebar-color-bg-secondary, #f0f0f0)";

function uniqueInOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function cellLookupKey(row: string, col: string): string {
  return row + " " + col;
}

/**
 * A density grid - one cell per row/col combination, shaded by `value` relative to the min/max
 * across all of `data`. `data` is sparse: a row/col pair with no entry renders as a distinctly
 * empty/neutral cell rather than a real value of 0, since those are different claims about the
 * underlying data.
 */
export function Heatmap({
  data,
  rows,
  cols,
  title,
  ariaLabel,
  cellSize = 32,
  colorScale = DEFAULT_COLOR_SCALE,
  bionic,
  bionicOptions,
  className,
  ...props
}: HeatmapProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const { activeKey, isSelected, getMarkProps, backgroundProps } = useChartMarkSelection<string>();
  const resolvedRows = rows ?? uniqueInOrder(data.map((d) => d.row));
  const resolvedCols = cols ?? uniqueInOrder(data.map((d) => d.col));

  // A plain space join keeps this simple for the ordinary case (short row/col labels); a caller
  // whose labels themselves contain spaces in an ambiguous combination is a narrow edge case this
  // doesn't attempt to guard against with key-escaping.
  const lookup = new Map<string, number>();
  for (const cell of data) {
    lookup.set(cellLookupKey(cell.row, cell.col), cell.value);
  }

  const values = data.map((d) => d.value);
  const valueMin = values.length ? Math.min(...values) : 0;
  const valueMax = values.length ? Math.max(...values) : 1;
  const valueRange = valueMax - valueMin;

  const rowLabelWidth = 96;
  const colLabelHeight = 28;
  const width = rowLabelWidth + resolvedCols.length * cellSize;
  const height = colLabelHeight + resolvedRows.length * cellSize;

  // Keyed by grid indices ("rowIndex:colIndex"), not by row/col name text - a numeric-index key
  // has no ambiguity to guard against (unlike joining two arbitrary caller-supplied label strings
  // together), and resolving the active mark back to its row/col/value below is then a plain array
  // lookup rather than a string-parsing step.
  const activeIndices = activeKey ? activeKey.split(":").map(Number) : null;
  const activeRowIndex = activeIndices ? activeIndices[0] : undefined;
  const activeColIndex = activeIndices ? activeIndices[1] : undefined;
  const activeRow = activeRowIndex !== undefined ? resolvedRows[activeRowIndex] : undefined;
  const activeCol = activeColIndex !== undefined ? resolvedCols[activeColIndex] : undefined;
  const activeValue = activeRow !== undefined && activeCol !== undefined ? lookup.get(cellLookupKey(activeRow, activeCol)) : undefined;

  return (
    <figure
      className={clsx("rebar-chart", "rebar-heatmap", className)}
      data-rebar-component="heatmap"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={"0 0 " + width + " " + height}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Heatmap"}
        {...backgroundProps}
      >
        <rect x={0} y={0} width={width} height={height} fill="transparent" data-rebar-part="chart-background" />
        {resolvedCols.map((col, i) => (
          <text
            key={col}
            x={rowLabelWidth + i * cellSize + cellSize / 2}
            y={colLabelHeight - 10}
            fontSize={11}
            textAnchor="middle"
            fill="var(--rebar-color-text-secondary, #757575)"
          >
            {col}
          </text>
        ))}
        {resolvedRows.map((row, j) => (
          <text
            key={row}
            x={rowLabelWidth - 8}
            y={colLabelHeight + j * cellSize + cellSize / 2 + 4}
            fontSize={11}
            textAnchor="end"
            fill="var(--rebar-color-text-secondary, #757575)"
          >
            {row}
          </text>
        ))}
        {resolvedRows.map((row, j) =>
          resolvedCols.map((col, i) => {
            const lookupKey = cellLookupKey(row, col);
            const hasValue = lookup.has(lookupKey);
            const value = lookup.get(lookupKey);
            const normalized = hasValue && valueRange !== 0 ? ((value as number) - valueMin) / valueRange : hasValue ? 1 : 0;
            const fill = hasValue ? colorScale(normalized) : MISSING_CELL_FILL;
            const x = rowLabelWidth + i * cellSize;
            const y = colLabelHeight + j * cellSize;
            const markKey = j + ":" + i;
            const selected = hasValue && isSelected(markKey);
            return (
              <rect
                key={lookupKey}
                data-rebar-part={hasValue ? "cell" : "cell-missing"}
                data-row={row}
                data-col={col}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                fill={fill}
                stroke={selected ? "var(--rebar-color-border-strong, #333333)" : "var(--rebar-color-border, #e0e0e0)"}
                strokeWidth={selected ? 2 : 1}
                style={hasValue ? { cursor: "pointer" } : undefined}
                {...(hasValue ? getMarkProps(markKey) : {})}
              >
                <title>{row + " x " + col + ": " + (hasValue ? value : "no data")}</title>
              </rect>
            );
          }),
        )}
        {activeRow !== undefined && activeCol !== undefined && activeValue !== undefined ? (
          <ChartValueTag
            x={rowLabelWidth + (activeColIndex as number) * cellSize + cellSize / 2}
            y={colLabelHeight + (activeRowIndex as number) * cellSize + cellSize / 2}
            viewBoxWidth={width}
            viewBoxHeight={height}
            lines={[activeRow + " x " + activeCol, String(activeValue)]}
          />
        ) : null}
      </svg>
      {title ? (
        <figcaption
          data-rebar-part="title"
          style={{
            textAlign: "center",
            // Centering plainly across the figure's own full width would center the caption over
            // the *whole* SVG box, including the row-label gutter on the left — but the actual
            // cell grid only occupies the region after that gutter, so the two visibly don't line
            // up (a real, hit-directly offset, not a cosmetic nitpick). Padding the caption's own
            // centering region by the same proportion the grid is shifted (as a %, so it tracks
            // the SVG's own responsive `width: 100%` scaling exactly) re-centers it over the grid
            // itself instead of the whole figure.
            paddingLeft: `${(rowLabelWidth / width) * 100}%`,
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
