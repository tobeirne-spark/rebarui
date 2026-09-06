import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

export interface TreemapLeaf {
  label: string;
  value: number;
  /** Defaults to the next color in a small built-in palette, cycled by index among top-level
   * siblings — supply one explicitly only when a specific color carries real meaning. */
  color?: string;
}

/**
 * One level of nesting is enough for this component's use case — a top-level group can hold
 * `children`, but a child is a plain leaf with no `children` of its own, so the type itself rules
 * out unbounded recursive depth rather than relying on runtime code to ignore deeper nesting.
 */
export interface TreemapNode extends TreemapLeaf {
  children?: TreemapLeaf[];
}

export interface TreemapProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  data: TreemapNode[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  width?: number;
  height?: number;
}

const DEFAULT_PALETTE = [
  "var(--rebar-color-primary, #0066cc)",
  "var(--rebar-color-success, #2e7d32)",
  "var(--rebar-color-warning, #f57c00)",
  "var(--rebar-color-danger, #d32f2f)",
  "var(--rebar-color-text-secondary, #757575)",
];

const MIN_LABEL_WIDTH = 40;
const MIN_LABEL_HEIGHT = 20;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Cell extends Rect {
  label: string;
  color: string;
  opacity: number;
}

// Slice-and-dice tiling: split a rectangle into strips proportional to each node's share of its
// siblings' total value, alternating the split axis between the top level (horizontal) and its
// children (vertical). This is deliberately simpler than a true "squarified" treemap (which repacks
// rows to keep every cell's aspect ratio near 1:1) — slice-and-dice can produce thin slivers when
// values are very uneven, but it's a fraction of the code, and this project's low-fidelity
// philosophy doesn't need the more visually-optimal algorithm.
function sliceAndDice(nodes: TreemapLeaf[], rect: Rect, horizontal: boolean): Rect[] {
  const total = nodes.reduce((sum, n) => sum + Math.max(n.value, 0), 0);
  let offset = 0;
  return nodes.map((n) => {
    // Guard divide-by-zero: when every sibling's value is 0 (or negative), split the space evenly
    // instead of collapsing every cell to zero size / producing NaN.
    const fraction = total > 0 ? Math.max(n.value, 0) / total : 1 / nodes.length;
    const slice: Rect = horizontal
      ? { x: rect.x + offset * rect.w, y: rect.y, w: fraction * rect.w, h: rect.h }
      : { x: rect.x, y: rect.y + offset * rect.h, w: rect.w, h: fraction * rect.h };
    offset += fraction;
    return slice;
  });
}

/**
 * A nested-proportion hierarchical chart — each rectangle's area proportional to its `value`
 * relative to its siblings'. Covers the "sunburst" use case too (part-of-a-whole hierarchy shown
 * at a glance), just laid out as rectangles rather than a radial ring, which tiles far more simply
 * and reads just as clearly for a small number of groups/children. One level of nesting: top-level
 * groups, each optionally split into children (see `TreemapNode`).
 */
export function Treemap({
  data,
  title,
  ariaLabel,
  width = 480,
  height = 320,
  className,
  ...props
}: TreemapProps) {
  const topRects = sliceAndDice(data, { x: 0, y: 0, w: width, h: height }, true);

  const cells: Cell[] = [];
  data.forEach((node, i) => {
    const color = node.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length] ?? "var(--rebar-color-primary, #0066cc)";
    const rect = topRects[i];
    if (!rect) return;
    if (node.children && node.children.length > 0) {
      const childRects = sliceAndDice(node.children, rect, false);
      node.children.forEach((child, j) => {
        const childRect = childRects[j];
        if (!childRect) return;
        cells.push({
          label: child.label,
          color: child.color ?? color,
          // A child without its own color reads as a shade of its parent's, not an unrelated
          // palette entry — ramped down by index and clamped so a group with many children stays
          // legible rather than fading to nothing.
          opacity: child.color ? 1 : Math.max(1 - j * 0.15, 0.4),
          ...childRect,
        });
      });
    } else {
      cells.push({ label: node.label, color, opacity: 1, ...rect });
    }
  });

  return (
    <figure
      className={clsx("rebar-chart", "rebar-treemap", className)}
      data-rebar-component="treemap"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Treemap"}
      >
        {cells.map((cell, i) => {
          const showLabel = cell.w >= MIN_LABEL_WIDTH && cell.h >= MIN_LABEL_HEIGHT;
          return (
            <g key={`${cell.label}-${i}`} data-rebar-part="cell">
              <rect
                x={cell.x}
                y={cell.y}
                width={cell.w}
                height={cell.h}
                fill={cell.color}
                fillOpacity={cell.opacity}
                stroke="var(--rebar-color-bg-primary, #ffffff)"
                strokeWidth={2}
              />
              {showLabel ? (
                // White text is legible against every entry in DEFAULT_PALETTE and against a
                // caller-supplied color that's expected to be a solid, reasonably saturated fill —
                // matching the "chart colors are deliberate, not decorative" convention the rest of
                // this project's charts follow, without needing a per-cell contrast computation.
                <text x={cell.x + 6} y={cell.y + 16} fontSize={11} fill="#ffffff" style={{ pointerEvents: "none" }}>
                  {cell.label}
                </text>
              ) : null}
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
