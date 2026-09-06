import { useCallback, useId, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, PointerEvent as ReactPointerEvent, ReactNode, WheelEvent as ReactWheelEvent } from "react";
import clsx from "clsx";

export interface NodeLinkGraphNode {
  id: string;
  label: string;
  /** Only meaningful when `layout="manual"` — ignored (recomputed) by `"hierarchical"`/`"circular"`. */
  x?: number;
  /** Only meaningful when `layout="manual"` — ignored (recomputed) by `"hierarchical"`/`"circular"`. */
  y?: number;
  /** Required for `layout="hierarchical"` on every non-root node — the id of this node's parent.
   * Ignored by `"circular"`/`"manual"`. A node with no `parentId` (or one that names a node not
   * present in `nodes`) is treated as a root. */
  parentId?: string;
  color?: string;
}

export interface NodeLinkGraphEdge {
  source: string;
  target: string;
  label?: string;
}

export interface NodeLinkGraphProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  nodes: NodeLinkGraphNode[];
  edges: NodeLinkGraphEdge[];
  /** Which deterministic layout algorithm positions `nodes`. Default `"hierarchical"`. See the
   * component doc comment below for what each mode does and why there's no physics simulation. */
  layout?: "hierarchical" | "circular" | "manual";
  /** Rendered as a real, visible caption above the graph — see ref/HEURISTICS.md #16. */
  title?: string;
  /** Falls back to `title` when omitted — the graph's own accessible name. */
  ariaLabel?: string;
  /** Viewport width in SVG units. Default `480`. */
  width?: number;
  /** Viewport height in SVG units. Default `360`. */
  height?: number;
  /** Fires while dragging a node, only when `layout="manual"` (see doc comment) — the caller's own
   * hook for persisting a drag back into whatever state supplied `nodes[].x`/`y` in the first
   * place. Not fired at all in `"hierarchical"`/`"circular"` layout. */
  onNodePositionChange?: (id: string, x: number, y: number) => void;
  /** Custom node rendering — receives the node (with its computed `x`/`y` filled in) and must
   * return SVG content (it's rendered inside a `<g>` already translated to the node's position, so
   * a custom renderer draws centered on `0,0`). Defaults to a rounded rect + centered label. */
  renderNode?: (node: Required<Pick<NodeLinkGraphNode, "id" | "label" | "x" | "y">> & NodeLinkGraphNode) => ReactNode;
  className?: string;
}

interface PositionedNode extends NodeLinkGraphNode {
  x: number;
  y: number;
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 44;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
// Step applied per +/- button click — a full click is a single deliberate action, so it gets a
// clearly perceptible jump.
const ZOOM_STEP = 0.2;
// Wheel/trackpad zoom is scaled proportionally to `event.deltaY` instead of applying `ZOOM_STEP`
// flat per event (see `handleWheel` below for why: a flat per-event step is the classic "zoom is
// way too sensitive" bug — a trackpad's two-finger scroll fires many small-`deltaY` wheel events
// per second for a single gentle gesture, so a fixed step per event compounds into a huge zoom
// change from what feels like a light touch). `WHEEL_ZOOM_SENSITIVITY` converts a raw `deltaY`
// into a zoom delta; `MAX_WHEEL_ZOOM_DELTA` clamps any single event's contribution so a mouse's
// large discrete per-notch `deltaY` (commonly ~100) can't jump the zoom drastically either.
const WHEEL_ZOOM_SENSITIVITY = 0.0015;
const MAX_WHEEL_ZOOM_DELTA = 0.08;

// Rounded to a fixed precision on purpose: `Math.cos`/`Math.sin` (used by the circular layout
// below) can differ in their last one or two floating-point digits between Node (server render)
// and a browser's own engine build (client hydration) for the exact same input — a real,
// hit-directly React hydration-mismatch warning on the rendered attribute string, first caught in
// this project's `PieChart`/`GaugeChart`/`RadarChart`. Same fix here: round every trig-derived
// coordinate before it reaches a JSX attribute.
function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function layoutHierarchical(nodes: NodeLinkGraphNode[], width: number, height: number): PositionedNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childrenOf = new Map<string, NodeLinkGraphNode[]>();
  const roots: NodeLinkGraphNode[] = [];

  for (const node of nodes) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) {
      const list = childrenOf.get(parent.id) ?? [];
      list.push(node);
      childrenOf.set(parent.id, list);
    } else {
      roots.push(node);
    }
  }

  // Assign each node a depth (0 = root) via BFS from every root. A node whose declared parentId
  // isn't actually present in `nodes` was already folded into `roots` above, so every node gets a
  // depth exactly once — no infinite loop even on a malformed/cyclic parentId chain, since a node
  // is only ever visited from its one real parent's children list.
  const depthOf = new Map<string, number>();
  const order: NodeLinkGraphNode[] = [];
  let frontier = roots.map((n) => ({ node: n, depth: 0 }));
  while (frontier.length > 0) {
    const next: { node: NodeLinkGraphNode; depth: number }[] = [];
    for (const { node, depth } of frontier) {
      if (depthOf.has(node.id)) continue;
      depthOf.set(node.id, depth);
      order.push(node);
      for (const child of childrenOf.get(node.id) ?? []) {
        next.push({ node: child, depth: depth + 1 });
      }
    }
    frontier = next;
  }
  // Any node unreachable from a root (shouldn't happen given the fallback above, but keep this
  // honest for a malformed input) still gets placed, at depth 0.
  for (const node of nodes) {
    if (!depthOf.has(node.id)) {
      depthOf.set(node.id, 0);
      order.push(node);
    }
  }

  const levels = new Map<number, NodeLinkGraphNode[]>();
  for (const node of order) {
    const depth = depthOf.get(node.id) ?? 0;
    const list = levels.get(depth) ?? [];
    list.push(node);
    levels.set(depth, list);
  }

  const maxDepth = Math.max(0, ...Array.from(levels.keys()));
  const levelGap = maxDepth > 0 ? (height - NODE_HEIGHT) / maxDepth : 0;

  const positioned: PositionedNode[] = [];
  for (const [depth, levelNodes] of levels) {
    const count = levelNodes.length;
    const gap = width / (count + 1);
    levelNodes.forEach((node, i) => {
      positioned.push({
        ...node,
        x: gap * (i + 1),
        y: NODE_HEIGHT / 2 + levelGap * depth,
      });
    });
  }
  return positioned;
}

function layoutCircular(nodes: NodeLinkGraphNode[], width: number, height: number): PositionedNode[] {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.max(0, Math.min(width, height) / 2 - Math.max(NODE_WIDTH, NODE_HEIGHT) / 2);
  const count = nodes.length || 1;
  return nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return {
      ...node,
      x: round(cx + r * Math.cos(angle)),
      y: round(cy + r * Math.sin(angle)),
    };
  });
}

function layoutManual(nodes: NodeLinkGraphNode[], width: number, height: number): PositionedNode[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
  let gridIndex = 0;
  return nodes.map((node) => {
    if (typeof node.x === "number" && typeof node.y === "number") {
      return { ...node, x: node.x, y: node.y };
    }
    // Missing position: fall back to a simple grid slot so it never ends up invisibly stacked at
    // (0,0) on top of every other node missing a position.
    const col = gridIndex % cols;
    const row = Math.floor(gridIndex / cols);
    gridIndex += 1;
    const gapX = width / (cols + 1);
    const gapY = Math.max(NODE_HEIGHT * 1.5, height / (Math.ceil(nodes.length / cols) + 1));
    return { ...node, x: gapX * (col + 1), y: NODE_HEIGHT / 2 + gapY * row };
  });
}

/**
 * A pan/zoom canvas of nodes and edges — the shared base primitive `OrgChart`, `MindMap`,
 * `Flowchart`, and `DiagramMinimap` all build on.
 *
 * **Scope decision**: this does NOT implement real force-directed graph physics — that's a
 * genuinely hard, iterative algorithm (repeated simulation steps, convergence tuning) that's out
 * of scope for this project's low-fidelity, deterministic-by-default philosophy. Instead it
 * supports three deterministic layouts, computed once per render from the input data:
 * - `"hierarchical"` (default): a simple layered top-down tree. Builds parent→children from each
 *   node's `parentId`, assigns a depth to every node via BFS from the roots (any node without a
 *   `parentId`, or whose `parentId` doesn't match another node's `id`, is a root), then spaces each
 *   depth level's nodes evenly across the width and each level evenly down the height. Not a real
 *   graph-layout library — no edge-crossing minimization, no subtree-width balancing.
 * - `"circular"`: nodes evenly spaced around a circle by array index (not by any graph structure).
 * - `"manual"`: uses each node's own `x`/`y` directly; a node missing either falls back to a
 *   simple grid position so it's never invisibly stacked at `(0,0)` on top of another node.
 *
 * Node-drag repositioning is wired up ONLY when `layout === "manual"`. In `"hierarchical"`/
 * `"circular"` layout, positions are recomputed from the input data on every render — dragging a
 * node would appear to move it, then snap back (or fight the next render), which is worse than not
 * offering the drag at all. So dragging is simply disabled outside `"manual"`; the honest fix for
 * "I want to rearrange a hierarchical/circular graph" is switching that graph to `"manual"` layout
 * (seeding `x`/`y` from the computed layout once, e.g. via this same component's own output) and
 * handling `onNodePositionChange` from there on. This has no accessibility gap to fill: it's a
 * supplementary manual-repositioning affordance available in one specific mode, not the primary way
 * to use the component (see the touch-optimization gate, checklist item 5c) — the graph stays fully
 * viewable and navigable via pan (drag the background) and zoom (wheel, or the two +/- buttons)
 * without ever touching a node.
 *
 * Pan is a plain `transform: translate(...)` on the whole content `<g>`, tracked in local state via
 * `pointerdown`/`pointermove`/`pointerup` on the SVG background — the same hand-rolled
 * pointer-event dragging pattern `ResizablePanels` uses for its divider, not a new dependency. Zoom
 * has two independent triggers: `onWheel` (mouse/trackpad) and two visible, real ≥44×44px +/-
 * buttons — the buttons are the required non-gesture fallback per ref/HEURISTICS.md #38/#48;
 * wheel-only zoom would be inaccessible to anyone without a wheel/trackpad gesture.
 *
 * Edges render as simple straight lines between node centers (not an elbow/orthogonal router —
 * picked for simplicity, matching this project's low-fidelity philosophy; an elbow router is a
 * reasonable follow-up if a specific derived component needs it) with a shared, single SVG
 * `<marker>` arrowhead definition (referenced via `marker-end`) to show direction.
 */
export function NodeLinkGraph({
  nodes,
  edges,
  layout = "hierarchical",
  title,
  ariaLabel,
  width = 480,
  height = 360,
  onNodePositionChange,
  renderNode,
  className,
  ...props
}: NodeLinkGraphProps) {
  const markerId = useId();
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const positioned = useMemo<PositionedNode[]>(() => {
    if (layout === "circular") return layoutCircular(nodes, width, height);
    if (layout === "manual") return layoutManual(nodes, width, height);
    return layoutHierarchical(nodes, width, height);
  }, [nodes, layout, width, height]);

  const positionedById = useMemo(() => new Map(positioned.map((n) => [n.id, n])), [positioned]);

  const panRef = useRef<{ dragging: boolean; startX: number; startY: number; originX: number; originY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const handleBackgroundPointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      // Ignore drags that started on a node — those are handled by the node's own pointer handler
      // (drag-to-reposition in manual layout) rather than panning the whole canvas.
      if ((e.target as Element).closest('[data-rebar-part="node"]')) return;
      panRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, originX: pan.x, originY: pan.y };

      const handleMove = (moveEvent: PointerEvent) => {
        if (!panRef.current.dragging) return;
        setPan({
          x: panRef.current.originX + (moveEvent.clientX - panRef.current.startX),
          y: panRef.current.originY + (moveEvent.clientY - panRef.current.startY),
        });
      };
      const handleUp = () => {
        panRef.current.dragging = false;
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
      };
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [pan.x, pan.y],
  );

  const handleWheel = useCallback((e: ReactWheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    // Proportional to this event's own `deltaY` (negative deltaY = scroll/pinch "up" = zoom in),
    // clamped per event — NOT a flat `ZOOM_STEP` every time. See `MAX_WHEEL_ZOOM_DELTA` above.
    const rawDelta = -e.deltaY * WHEEL_ZOOM_SENSITIVITY;
    const delta = clamp(rawDelta, -MAX_WHEEL_ZOOM_DELTA, MAX_WHEEL_ZOOM_DELTA);
    setZoom((z) => clamp(round(z + delta), MIN_ZOOM, MAX_ZOOM));
  }, []);

  const zoomIn = useCallback(() => setZoom((z) => clamp(round(z + ZOOM_STEP), MIN_ZOOM, MAX_ZOOM)), []);
  const zoomOut = useCallback(() => setZoom((z) => clamp(round(z - ZOOM_STEP), MIN_ZOOM, MAX_ZOOM)), []);

  const nodeDragRef = useRef<{ id: string; startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );

  const handleNodePointerDown = useCallback(
    (node: PositionedNode) => (e: ReactPointerEvent<SVGGElement>) => {
      if (layout !== "manual") return;
      if (e.button !== 0 && e.pointerType === "mouse") return;
      e.stopPropagation();
      nodeDragRef.current = { id: node.id, startX: e.clientX, startY: e.clientY, originX: node.x, originY: node.y };

      const handleMove = (moveEvent: PointerEvent) => {
        const drag = nodeDragRef.current;
        if (!drag) return;
        const nextX = drag.originX + (moveEvent.clientX - drag.startX) / zoom;
        const nextY = drag.originY + (moveEvent.clientY - drag.startY) / zoom;
        onNodePositionChange?.(drag.id, round(nextX), round(nextY));
      };
      const handleUp = () => {
        nodeDragRef.current = null;
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
      };
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [layout, zoom, onNodePositionChange],
  );

  return (
    <figure
      className={clsx("rebar-chart", "rebar-node-link-graph", className)}
      data-rebar-component="node-link-graph"
      style={{ margin: 0 }}
      {...props}
    >
      <div className="rebar-node-link-graph-toolbar" data-rebar-part="toolbar">
        <button
          type="button"
          className="rebar-node-link-graph-zoom-button"
          data-rebar-part="zoom-out-button"
          aria-label="Zoom out"
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
        >
          −
        </button>
        <span className="rebar-node-link-graph-zoom-label" data-rebar-part="zoom-label">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          className="rebar-node-link-graph-zoom-button"
          data-rebar-part="zoom-in-button"
          aria-label="Zoom in"
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
        >
          +
        </button>
      </div>
      <svg
        className="rebar-node-link-graph-canvas"
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Node-link graph"}
        onPointerDown={handleBackgroundPointerDown}
        onWheel={handleWheel}
      >
        <defs>
          <marker
            id={`${markerId}-arrow`}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--rebar-color-text-secondary, #757575)" />
          </marker>
        </defs>
        <g
          data-rebar-part="pan-zoom-container"
          transform={`translate(${round(pan.x)}, ${round(pan.y)}) scale(${round(zoom)})`}
        >
          {edges.map((edge, i) => {
            const source = positionedById.get(edge.source);
            const target = positionedById.get(edge.target);
            if (!source || !target) return null;
            return (
              <g key={`${edge.source}-${edge.target}-${i}`} data-rebar-part="edge">
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="var(--rebar-color-text-secondary, #757575)"
                  strokeWidth={1.5}
                  markerEnd={`url(#${markerId}-arrow)`}
                />
                {edge.label ? (
                  <text
                    x={(source.x + target.x) / 2}
                    y={(source.y + target.y) / 2}
                    textAnchor="middle"
                    fontSize="var(--rebar-font-size-xs, 10px)"
                    fill="var(--rebar-color-text-secondary, #757575)"
                  >
                    {edge.label}
                  </text>
                ) : null}
              </g>
            );
          })}
          {positioned.map((node) => (
            <g
              key={node.id}
              data-rebar-part="node"
              data-node-id={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onPointerDown={handleNodePointerDown(node)}
              style={{ cursor: layout === "manual" ? "grab" : "default" }}
            >
              {renderNode ? (
                renderNode(node)
              ) : (
                <>
                  <rect
                    x={-NODE_WIDTH / 2}
                    y={-NODE_HEIGHT / 2}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={6}
                    fill={node.color ?? "var(--rebar-color-bg-primary, #ffffff)"}
                    stroke="var(--rebar-color-border-strong, #333333)"
                    strokeWidth={1.5}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="var(--rebar-font-size-sm, 12px)"
                    fill="var(--rebar-color-text-primary, #212121)"
                  >
                    {node.label}
                  </text>
                </>
              )}
            </g>
          ))}
        </g>
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
