import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";
import { ChartValueTag, useChartMarkSelection } from "../chartMarkSelection";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface PackedBubbleItem {
  label: string;
  value: number;
  /** Defaults to the next color in a small built-in palette, cycled by item index (or, in grouped
   * mode, by the group's own index — every item in a group shares its group's color unless it
   * sets its own explicitly). */
  color?: string;
  /** Clusters this item with every other item sharing the same `group` name — each cluster is
   * packed on its own first, then the clusters themselves are packed together (a real, 2-level
   * hierarchical circle packing), instead of one flat arrangement. */
  group?: string;
}

export interface PackedBubbleChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  items: PackedBubbleItem[];
  /** Forces flat (`false`) or grouped (`true`) packing regardless of whether `items` set `group` —
   * defaults to grouped automatically the moment any item has one, flat otherwise. */
  grouped?: boolean;
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  height?: number;
  valueFormat?: (v: number) => string;
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

interface Circle {
  x: number;
  y: number;
  r: number;
}

// The two candidate points where a circle of radius `r` sits externally tangent to both `a` and
// `b` — found by intersecting two circles of radius (a.r+r) and (b.r+r) centered on a and b. The
// standard circle-circle intersection formula; returns no candidates when no such tangent point
// exists (the two "inflated" circles don't intersect at all).
function tangentCandidates(a: Circle, b: Circle, r: number): { x: number; y: number }[] {
  const ra = a.r + r;
  const rb = b.r + r;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d === 0 || d > ra + rb || d < Math.abs(ra - rb)) return [];
  const along = (ra * ra - rb * rb + d * d) / (2 * d);
  const h2 = ra * ra - along * along;
  if (h2 < 0) return [];
  const h = Math.sqrt(h2);
  const mx = a.x + (along * dx) / d;
  const my = a.y + (along * dy) / d;
  return [
    { x: mx + (h * dy) / d, y: my - (h * dx) / d },
    { x: mx - (h * dy) / d, y: my + (h * dx) / d },
  ];
}

function overlaps(placed: Circle[], candidate: Circle): boolean {
  return placed.some((p) => {
    const dx = p.x - candidate.x;
    const dy = p.y - candidate.y;
    return Math.sqrt(dx * dx + dy * dy) < p.r + candidate.r - 1e-6;
  });
}

/**
 * A real, non-overlapping circle-packing layout — largest first, each subsequent circle placed at
 * whichever valid tangent-to-two-already-placed-circles position keeps the whole arrangement
 * tightest around the origin (falling back to a tangent-to-one-circle position at a search angle
 * if no valid pair-tangent point exists, which only matters for the first couple of circles). Not
 * the optimal front-chain algorithm real packing libraries use — a real, always-correct (no
 * overlaps) result, matching this project's low-fidelity philosophy: correct geometry over the
 * tightest theoretically possible one.
 */
function packCircles<T extends { r: number }>(input: T[]): (T & Circle)[] {
  if (input.length === 0) return [];
  const sorted = [...input].sort((a, b) => b.r - a.r);
  const placed: (T & Circle)[] = [{ ...sorted[0]!, x: 0, y: 0 }];
  if (sorted.length === 1) return placed;

  placed.push({ ...sorted[1]!, x: placed[0]!.r + sorted[1]!.r, y: 0 });

  for (let i = 2; i < sorted.length; i++) {
    const item = sorted[i]!;
    let best: { x: number; y: number; dist: number } | null = null;
    for (let a = 0; a < placed.length; a++) {
      for (let b = a + 1; b < placed.length; b++) {
        for (const candidate of tangentCandidates(placed[a]!, placed[b]!, item.r)) {
          const circle = { ...candidate, r: item.r };
          if (overlaps(placed, circle)) continue;
          const dist = Math.sqrt(candidate.x * candidate.x + candidate.y * candidate.y) + item.r;
          if (!best || dist < best.dist) best = { ...candidate, dist };
        }
      }
    }
    if (!best) {
      for (const p of placed) {
        for (let deg = 0; deg < 360; deg += 10) {
          const angle = (deg * Math.PI) / 180;
          const cand = { x: p.x + (p.r + item.r) * Math.cos(angle), y: p.y + (p.r + item.r) * Math.sin(angle) };
          if (overlaps(placed, { ...cand, r: item.r })) continue;
          const dist = Math.sqrt(cand.x * cand.x + cand.y * cand.y) + item.r;
          if (!best || dist < best.dist) best = { ...cand, dist };
        }
      }
    }
    placed.push({ ...item, x: best?.x ?? 0, y: best?.y ?? 0 });
  }
  return placed;
}

function boundingCircle(circles: Circle[]): Circle {
  const cx = circles.reduce((sum, c) => sum + c.x, 0) / circles.length;
  const cy = circles.reduce((sum, c) => sum + c.y, 0) / circles.length;
  const r = Math.max(...circles.map((c) => Math.hypot(c.x - cx, c.y - cy) + c.r));
  return { x: cx, y: cy, r };
}

/**
 * A packed-bubble chart — each item is a circle sized by `value` (never by a linear scale, since
 * area, not radius, is what a reader perceptually compares), packed tightly with no overlaps.
 * `grouped` mode packs same-`group` items into their own cluster first, then packs the clusters
 * together — a real two-level hierarchical packing, not just a flat arrangement with a color per
 * group. Distinct from `BubbleChart` (a real x/y scatter plot with size as a third encoded
 * dimension on real axes): this has no axes at all — position only expresses "fits densely here,"
 * never a measured x/y value.
 */
export function PackedBubbleChart({
  items,
  grouped,
  title,
  ariaLabel,
  height = 400,
  valueFormat = (v: number) => Math.round(v).toLocaleString(),
  bionic,
  bionicOptions,
  className,
  ...props
}: PackedBubbleChartProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const { activeKey, isSelected, getMarkProps, backgroundProps } = useChartMarkSelection<string>();
  const width = 700;
  const marginTop = 16;
  const marginBottom = 16;
  const plotHeight = height - marginTop - marginBottom;
  const plotWidth = width;

  if (items.length === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-packed-bubble-chart", className)}
        data-rebar-component="packed-bubble-chart"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(height)}
      </figure>
    );
  }

  const isGrouped = grouped ?? items.some((it) => it.group !== undefined);
  const groupOrder = isGrouped ? [...new Set(items.map((it) => it.group ?? "Other"))] : [];

  const rFor = (value: number) => Math.sqrt(Math.max(value, 0));

  type LeafCircle = Circle & { label: string; value: number; color: string; groupIndex: number };
  let leaves: LeafCircle[];
  let groupCircles: (Circle & { label: string })[] = [];

  if (isGrouped) {
    const groups = groupOrder.map((groupName, groupIndex) => {
      const groupItems = items.filter((it) => (it.group ?? "Other") === groupName);
      const localLeaves = packCircles(groupItems.map((it) => ({ ...it, r: rFor(it.value) })));
      const local = boundingCircle(localLeaves);
      return { groupName, groupIndex, localLeaves, local };
    });
    const packedGroups = packCircles(groups.map((g) => ({ ...g, r: g.local.r })));
    leaves = packedGroups.flatMap((g) =>
      g.localLeaves.map((leaf) => ({
        ...leaf,
        x: g.x + (leaf.x - g.local.x),
        y: g.y + (leaf.y - g.local.y),
        color: leaf.color ?? DEFAULT_PALETTE[g.groupIndex % DEFAULT_PALETTE.length]!,
        groupIndex: g.groupIndex,
      })),
    );
    groupCircles = packedGroups.map((g) => ({ x: g.x, y: g.y, r: g.local.r, label: g.groupName }));
  } else {
    leaves = packCircles(items.map((it, i) => ({ ...it, r: rFor(it.value), groupIndex: i }))).map((leaf, i) => ({
      ...leaf,
      color: leaf.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]!,
    }));
  }

  const bounds = boundingCircle(isGrouped ? groupCircles : leaves);
  const scale = (Math.min(plotWidth, plotHeight) / 2 / bounds.r) * 0.94;
  const centerX = width / 2;
  const centerY = marginTop + plotHeight / 2;
  const project = (c: Circle) => ({
    x: centerX + (c.x - bounds.x) * scale,
    y: centerY + (c.y - bounds.y) * scale,
    r: c.r * scale,
  });

  return (
    <figure
      className={clsx("rebar-chart", "rebar-packed-bubble-chart", className)}
      data-rebar-component="packed-bubble-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Packed bubble chart"}
        {...backgroundProps}
      >
        <rect x={0} y={0} width={width} height={height} fill="transparent" data-rebar-part="chart-background" />
        {isGrouped
          ? groupCircles.map((g) => {
              const p = project(g);
              return (
                <circle
                  key={g.label}
                  data-rebar-part="group"
                  cx={p.x}
                  cy={p.y}
                  r={p.r}
                  fill="none"
                  stroke="var(--rebar-color-border, #e0e0e0)"
                  strokeDasharray="3 3"
                />
              );
            })
          : null}
        {leaves.map((leaf) => {
          const p = project(leaf);
          const selected = isSelected(leaf.label);
          const showLabel = p.r >= 22;
          return (
            <g key={leaf.label}>
              <circle
                data-rebar-part="mark"
                cx={p.x}
                cy={p.y}
                r={p.r}
                fill={leaf.color}
                fillOpacity={0.85}
                stroke={selected ? "var(--rebar-color-text-primary, #212121)" : "var(--rebar-color-bg-primary, #ffffff)"}
                strokeWidth={selected ? 2 : 1}
                style={{ cursor: "pointer" }}
                {...getMarkProps(leaf.label)}
              />
              {showLabel ? (
                <text x={p.x} y={p.y + 4} fontSize={11} textAnchor="middle" fill="var(--rebar-color-bg-primary, #ffffff)" style={{ pointerEvents: "none" }}>
                  {leaf.label}
                </text>
              ) : null}
            </g>
          );
        })}
        {activeKey
          ? (() => {
              const active = leaves.find((l) => l.label === activeKey);
              if (!active) return null;
              const p = project(active);
              return (
                <ChartValueTag
                  x={p.x}
                  y={p.y - p.r}
                  viewBoxWidth={width}
                  viewBoxHeight={height}
                  accentColor={active.color}
                  lines={[active.label, valueFormat(active.value)]}
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
