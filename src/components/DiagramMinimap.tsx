import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

export interface DiagramMinimapNode {
  id: string;
  x: number;
  y: number;
}

export interface DiagramMinimapViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiagramMinimapProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  /** Already-resolved positions in the full canvas's own coordinate space — this component runs no
   * layout algorithm of its own, it just draws a dot per node, scaled down into a small frame. */
  nodes: DiagramMinimapNode[];
  /** The currently-visible region of the full canvas, in that same coordinate space. Drawn as a
   * highlighted rectangle overlay when supplied; omitted entirely (no overlay at all) otherwise. */
  viewportBounds?: DiagramMinimapViewportBounds;
  /** Thumbnail width in SVG units. Default `120`. */
  width?: number;
  /** Thumbnail height in SVG units. Default `90`. */
  height?: number;
  /** Rendered as a real, visible caption above the thumbnail — see ref/HEURISTICS.md #16. */
  title?: string;
  /** Falls back to `title` when omitted — the thumbnail's own accessible name. */
  ariaLabel?: string;
  className?: string;
}

const DOT_RADIUS = 2.5;

/**
 * A small, static thumbnail overview of a large pannable canvas — a plain dot per already-positioned
 * node, scaled into a small frame, with an optional highlighted rectangle showing the visible
 * viewport region.
 *
 * This is a genuinely standalone component, NOT built on `NodeLinkGraph` (it needs none of that
 * component's pan/zoom/drag interaction logic — it's a static read-only thumbnail). It's *designed*
 * to pair with a `NodeLinkGraph` (or any similar pannable canvas) elsewhere on the page via shared
 * coordinate data — the caller feeds it the same node positions and current viewport rect the real
 * canvas is using — not because it wraps one internally.
 *
 * There's no explicit "full canvas size" prop, since neither this component nor its caller
 * necessarily has one single fixed value (a `NodeLinkGraph` in `"hierarchical"`/`"circular"` layout
 * computes its own node positions from `width`/`height`, but those aren't the full logical extent of
 * the content once panned/zoomed). Instead the coordinate space this component scales from is
 * inferred from the data itself — the bounding box of every node position plus (if supplied) the
 * viewport rect's own corners — the same "fit to content" approach a real minimap/thumbnail control
 * takes. No touch-target concerns here (checklist item 5's touch-optimization gate): this is a
 * static, non-interactive overview with nothing to click, drag, or zoom.
 */
export function DiagramMinimap({
  nodes,
  viewportBounds,
  width = 120,
  height = 90,
  title,
  ariaLabel,
  className,
  ...props
}: DiagramMinimapProps) {
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  if (viewportBounds) {
    xs.push(viewportBounds.x, viewportBounds.x + viewportBounds.width);
    ys.push(viewportBounds.y, viewportBounds.y + viewportBounds.height);
  }

  const minX = xs.length ? Math.min(...xs) : 0;
  const maxX = xs.length ? Math.max(...xs) : width;
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : height;

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scaleX = width / spanX;
  const scaleY = height / spanY;

  const toFrameX = (x: number) => (x - minX) * scaleX;
  const toFrameY = (y: number) => (y - minY) * scaleY;

  return (
    <figure
      className={clsx("rebar-chart", "rebar-diagram-minimap", className)}
      data-rebar-component="diagram-minimap"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Diagram minimap"}
      >
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="var(--rebar-color-bg-secondary, #f0f0f0)"
          stroke="var(--rebar-color-border, #e0e0e0)"
          strokeWidth={1}
          data-rebar-part="frame"
        />
        {viewportBounds ? (
          <rect
            data-rebar-part="viewport"
            x={toFrameX(viewportBounds.x)}
            y={toFrameY(viewportBounds.y)}
            width={viewportBounds.width * scaleX}
            height={viewportBounds.height * scaleY}
            fill="color-mix(in srgb, var(--rebar-color-primary, #0066cc) 15%, transparent)"
            stroke="var(--rebar-color-primary, #0066cc)"
            strokeWidth={1}
          />
        ) : null}
        {nodes.map((node) => (
          <circle
            key={node.id}
            data-rebar-part="node-dot"
            data-node-id={node.id}
            cx={toFrameX(node.x)}
            cy={toFrameY(node.y)}
            r={DOT_RADIUS}
            fill="var(--rebar-color-text-primary, #212121)"
          />
        ))}
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
