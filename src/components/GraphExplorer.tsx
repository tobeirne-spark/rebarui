import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from "d3-force";
import type { Simulation, SimulationLinkDatum, SimulationNodeDatum } from "d3-force";
import { renderChartEmptyState } from "../chartEmptyState";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";
import { CloseIcon, LockIcon, SearchIcon, UnlockIcon } from "./icons";

export interface GraphExplorerNode {
  id: string;
  label: string;
  /** Groups nodes for the color legend — a "Person"/"Location"/"Vehicle"-style type label, not a
   * free-form tag. */
  category: string;
  /** Overrides the auto-assigned category color for this one node. */
  color?: string;
}

export interface GraphExplorerEdge {
  source: string;
  target: string;
  label?: string;
}

export interface GraphExplorerAction {
  label: string;
  icon?: ReactNode;
  onClick: (node: GraphExplorerNode) => void;
}

export interface GraphExplorerProps extends Omit<ComponentPropsWithoutRef<"figure">, "title" | "onClick"> {
  nodes: GraphExplorerNode[];
  edges: GraphExplorerEdge[];
  /** Rendered as a real, visible caption above the graph — see ref/HEURISTICS.md #16. */
  title?: string;
  /** Falls back to `title` when omitted — the canvas's own accessible name. */
  ariaLabel?: string;
  width?: number;
  height?: number;
  /** A real category legend (color swatch + live "visible / total" count), click to toggle a
   * whole category's visibility. Default `true`. */
  legend?: boolean;
  /** A real search box over node labels, with a clickable match list (also the fully keyboard-
   * operable way to select a node — see the component doc comment on why raw canvas clicks are
   * mouse/touch-primary). Default `true`. */
  searchable?: boolean;
  /** Adds a built-in Pin/Unpin action (freezes/releases a node's physics position) to the radial
   * menu shown on selecting a node. Default `true`. */
  pinnable?: boolean;
  /** Extra actions in the radial menu shown when a node is selected — omitted entirely (beyond
   * `pinnable`'s own action, if on) unless passed, same "caller owns the real operation"
   * convention `FileManager`'s `actions` prop already follows. Domain-specific actions (e.g.
   * "expand neighbors," which needs the caller's own data-loading logic) belong here rather than
   * being invented by this component. */
  nodeActions?: (node: GraphExplorerNode) => GraphExplorerAction[];
  /** Fires whenever a node is selected (canvas click, or a search-result pick). */
  onNodeClick?: (node: GraphExplorerNode) => void;
  /** d3-force `forceManyBody` strength — more negative spreads nodes further apart. Default `-30`. */
  chargeStrength?: number;
  /** d3-force `forceLink` distance — the resting length of an edge. Default `50`. */
  linkDistance?: number;
  className?: string;
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

interface SimNode extends GraphExplorerNode, SimulationNodeDatum {
  pinned?: boolean;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  label?: string;
}

const DEFAULT_PALETTE = [
  "var(--rebar-color-primary, #0066cc)",
  "var(--rebar-color-success, #2e7d32)",
  "var(--rebar-color-warning, #f57c00)",
  "var(--rebar-color-danger, #d32f2f)",
  "var(--rebar-color-text-secondary, #757575)",
  "var(--rebar-color-info, #0288d1)",
];

const NODE_RADIUS = 6;
const SELECTED_RING_WIDTH = 2;
const HIT_RADIUS_PX = 10;
// A fingertip's real contact area is much larger than a mouse pointer's single pixel — a hit
// radius tuned for mouse precision means a touch tap on a small node frequently misses it
// entirely. Roughly matches a real fingertip's contact radius rather than the node's own drawn
// size.
const TOUCH_HIT_RADIUS_PX = 22;
const LABEL_ZOOM_THRESHOLD = 1.5;
const RADIAL_MENU_RADIUS = 56;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
const WHEEL_ZOOM_SENSITIVITY = 0.001;
const MAX_WHEEL_ZOOM_DELTA = 0.1;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Canvas's `fillStyle`/`strokeStyle`/`font` setters don't resolve CSS custom properties the way a
// real DOM element's cascade does (there's no cascade to resolve against for a bare string) — so
// this component's `var(--rebar-color-primary, #0066cc)`-style color values (the same convention
// every other themeable component here uses) have to be resolved to a concrete value by reading
// the real computed style off a live DOM element first. Re-resolved on every draw rather than
// cached once, so a theme toggle (which swaps `--rebar-*` values on an ancestor) is picked up on
// the very next tick/interaction without this component needing its own theme-change listener.
function resolveColor(el: Element, expr: string): string {
  const match = /^var\((--[\w-]+)(?:\s*,\s*(.+))?\)$/.exec(expr.trim());
  if (!match) return expr;
  const [, varName, fallback] = match;
  const value = getComputedStyle(el).getPropertyValue(varName!).trim();
  return value || (fallback ?? "#000000").trim();
}

function hitTest(nodes: SimNode[], worldX: number, worldY: number, radius: number): SimNode | null {
  let closest: SimNode | null = null;
  let closestDistSq = radius * radius;
  for (const n of nodes) {
    const dx = (n.x ?? 0) - worldX;
    const dy = (n.y ?? 0) - worldY;
    const distSq = dx * dx + dy * dy;
    if (distSq <= closestDistSq) {
      closest = n;
      closestDistSq = distSq;
    }
  }
  return closest;
}

function toPlainNode(n: SimNode): GraphExplorerNode {
  return { id: n.id, label: n.label, category: n.category, color: n.color };
}

/**
 * A force-directed network graph for hundreds to low-thousands of nodes — the Neo4j Bloom /
 * crime-network-analysis look (small circular nodes clustered by connectivity, a live category
 * legend, search-to-select, a radial action menu on a selected node) `NodeLinkGraph` deliberately
 * doesn't attempt (that component stays SVG + a handful of deterministic layouts, sized for a
 * few dozen nodes at most — see its own doc comment). This one renders to a `<canvas>` instead of
 * SVG (thousands of DOM nodes for thousands of graph nodes isn't viable) and uses a real physics
 * simulation (`d3-force`) instead of a deterministic layout, since "cluster by connectivity" is
 * exactly what a force simulation is for and there's no fixed algorithm that reproduces it.
 *
 * **A real, deliberate accessibility gap, stated rather than glossed over**: the canvas itself is
 * a single opaque `role="img"` region — there's no way to Tab through individual nodes one at a
 * time the way a real DOM-per-node structure would allow, and building that for a
 * thousands-of-nodes graph would defeat the entire reason this isn't SVG. The `searchable` search
 * box (a real `<input>` plus a real, clickable match list) is the fully keyboard-operable path to
 * select any specific node by name; the legend's category toggles and the radial action menu that
 * appears on selection are also real, focusable HTML, not canvas-drawn. Only "click an arbitrary
 * node directly on the canvas without knowing its name first" is mouse/touch-only.
 */
export function GraphExplorer({
  nodes,
  edges,
  title,
  ariaLabel,
  width = 640,
  height = 480,
  legend = true,
  searchable = true,
  pinnable = true,
  nodeActions,
  onNodeClick,
  chargeStrength = -30,
  linkDistance = 50,
  className,
  bionic,
  bionicOptions,
  ...props
}: GraphExplorerProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  // The `<canvas>` itself doesn't render at all while `nodes` is empty (the shared empty state
  // renders instead — see the JSX below), so the two effects below that attach native listeners
  // directly to it can't just run once on mount: if `nodes` starts empty and gets populated later,
  // the canvas element is created for the first time well after this component's initial mount.
  // Depending on this (rather than an empty dep array) makes both effects re-attach exactly when
  // the canvas element actually appears/disappears.
  const hasCanvas = nodes.length > 0;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);
  const searchInputId = useId();

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [, bumpTick] = useState(0);

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const n of nodes) if (!seen.includes(n.category)) seen.push(n.category);
    return seen;
  }, [nodes]);

  const categoryColor = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat, i) => map.set(cat, DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]!));
    return map;
  }, [categories]);

  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // Mirrors of state that the native pointer-event listeners below (attached once on mount, so
  // their closures can't see later renders' `pan`/`zoom`/`hiddenCategories`) read instead of the
  // React state directly — kept in sync via these tiny effects rather than re-attaching the
  // listeners on every pan/zoom change (which would also mean re-registering mid-gesture).
  const panRef = useRef(pan);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  const hiddenCategoriesRef = useRef(hiddenCategories);
  useEffect(() => {
    hiddenCategoriesRef.current = hiddenCategories;
  }, [hiddenCategories]);

  const updateMenuPos = useCallback((id: string) => {
    const node = simNodesRef.current.find((n) => n.id === id);
    if (!node) {
      setMenuPos(null);
      return;
    }
    setMenuPos({ x: panRef.current.x + (node.x ?? 0) * zoomRef.current, y: panRef.current.y + (node.y ?? 0) * zoomRef.current });
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // no canvas support (e.g. jsdom in tests) — skip gracefully, nothing crashes

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const backingWidth = Math.round(width * dpr);
    const backingHeight = Math.round(height * dpr);
    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const resolvedCategoryColor = new Map<string, string>();
    for (const [cat, expr] of categoryColor) resolvedCategoryColor.set(cat, resolveColor(container, expr));
    const borderColor = resolveColor(container, "var(--rebar-color-border, #e0e0e0)");
    const selectedColor = resolveColor(container, "var(--rebar-color-primary, #0066cc)");
    const textColor = resolveColor(container, "var(--rebar-color-text-primary, #212121)");
    const fontFamily = getComputedStyle(container).fontFamily || "sans-serif";

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const searchTerm = search.trim().toLowerCase();
    const visibleNodes = simNodesRef.current.filter((n) => !hiddenCategories.has(n.category));
    const visibleIds = new Set(visibleNodes.map((n) => n.id));

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1 / zoom;
    for (const link of simLinksRef.current) {
      const s = link.source as SimNode;
      const t = link.target as SimNode;
      if (typeof s !== "object" || typeof t !== "object") continue;
      if (!visibleIds.has(s.id) || !visibleIds.has(t.id)) continue;
      ctx.beginPath();
      ctx.moveTo(s.x ?? 0, s.y ?? 0);
      ctx.lineTo(t.x ?? 0, t.y ?? 0);
      ctx.stroke();
    }

    const showAllLabels = zoom >= LABEL_ZOOM_THRESHOLD;
    ctx.font = `${12 / zoom}px ${fontFamily}`;
    ctx.textBaseline = "middle";
    for (const n of visibleNodes) {
      const isMatch = !searchTerm || n.label.toLowerCase().includes(searchTerm);
      const isSelected = n.id === selectedId;
      const colorExpr = n.color ?? resolvedCategoryColor.get(n.category) ?? textColor;
      const resolved = n.color ? resolveColor(container, colorExpr) : colorExpr;

      ctx.globalAlpha = isMatch ? 1 : 0.25;
      ctx.beginPath();
      ctx.arc(n.x ?? 0, n.y ?? 0, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = resolved;
      ctx.fill();
      if (isSelected) {
        ctx.lineWidth = SELECTED_RING_WIDTH / zoom;
        ctx.strokeStyle = selectedColor;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (isSelected || (showAllLabels && isMatch)) {
        ctx.fillStyle = textColor;
        ctx.fillText(n.label, (n.x ?? 0) + NODE_RADIUS + 4 / zoom, n.y ?? 0);
      }
    }
    ctx.restore();
  }, [pan, zoom, hiddenCategories, search, selectedId, categoryColor, width, height]);

  // A ref mirror of `draw`, read instead of closing over `draw` directly wherever a *long-lived*
  // callback (the simulation's own `.on("tick", ...)` below, and the native pointer listeners
  // further down) needs to call it — both are set up once and kept alive across many renders, so a
  // direct closure over `draw` would freeze whatever `pan`/`zoom`/etc. were current at setup time
  // forever. Confirmed this was a real, live bug, not just a theoretical one: the simulation's own
  // tick handler kept re-drawing with the *original* mount-time pan/zoom on every physics tick,
  // silently overwriting a fresh pinch-to-zoom or pan a moment after it rendered correctly.
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  // Rebuild (or incrementally update) the simulation whenever the caller passes a new `nodes`/
  // `edges` array — e.g. an "expand neighbors" node action appending freshly-loaded nodes. Existing
  // nodes keep their current x/y/vx/vy/fx/fy/pinned state (matched by id) rather than the whole
  // layout resetting, so expanding a graph makes new nodes fly in from their neighbors instead of
  // every node jumping to a new position.
  useEffect(() => {
    const existingById = new Map(simNodesRef.current.map((n) => [n.id, n]));
    const newSimNodes: SimNode[] = nodes.map((n) => {
      const prev = existingById.get(n.id);
      return prev ? { ...prev, ...n } : { ...n };
    });
    const newSimLinks: SimLink[] = edges.map((e) => ({ ...e }));

    simNodesRef.current = newSimNodes;
    simLinksRef.current = newSimLinks;

    let sim = simRef.current;
    if (!sim) {
      sim = forceSimulation<SimNode>();
      simRef.current = sim;
    }
    sim.nodes(newSimNodes);
    sim
      .force("link", forceLink<SimNode, SimLink>(newSimLinks).id((d) => d.id).distance(linkDistance))
      .force("charge", forceManyBody<SimNode>().strength(chargeStrength))
      .force("center", forceCenter<SimNode>(width / 2, height / 2))
      .force("collide", forceCollide<SimNode>(NODE_RADIUS + 3))
      .alpha(0.6)
      .alphaTarget(0)
      .on("tick", () => {
        drawRef.current();
        if (selectedIdRef.current) updateMenuPos(selectedIdRef.current);
      })
      .restart();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, width, height, chargeStrength, linkDistance]);

  useEffect(() => {
    return () => {
      simRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  // A plain JSX `onWheel` handler can't call `preventDefault()` here — React (like the browser
  // itself for scrollable-feeling elements) attaches wheel listeners as passive by default, so
  // `preventDefault()` inside one is silently ignored with a console warning, not just a style
  // nit: without it, a wheel-zoom gesture also scrolls the surrounding page. Attaching the
  // listener natively with `{ passive: false }` is the standard fix.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const listener = (e: WheelEvent) => {
      e.preventDefault();
      const rawDelta = -e.deltaY * WHEEL_ZOOM_SENSITIVITY;
      const delta = clamp(rawDelta, -MAX_WHEEL_ZOOM_DELTA, MAX_WHEEL_ZOOM_DELTA);
      setZoom((z) => clamp(z + delta, MIN_ZOOM, MAX_ZOOM));
    };
    canvas.addEventListener("wheel", listener, { passive: false });
    return () => canvas.removeEventListener("wheel", listener);
  }, [hasCanvas]);

  const zoomIn = useCallback(() => setZoom((z) => clamp(z + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)), []);
  const zoomOut = useCallback(() => setZoom((z) => clamp(z - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)), []);
  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const selectNode = useCallback(
    (node: SimNode) => {
      setSelectedId(node.id);
      setMenuPos({ x: panRef.current.x + (node.x ?? 0) * zoomRef.current, y: panRef.current.y + (node.y ?? 0) * zoomRef.current });
      setStatusMessage(`Selected: ${node.label} (${node.category})`);
      onNodeClick?.(toPlainNode(node));
    },
    [onNodeClick],
  );

  const centerOn = useCallback(
    (node: SimNode) => {
      setPan({ x: width / 2 - (node.x ?? 0) * zoomRef.current, y: height / 2 - (node.y ?? 0) * zoomRef.current });
    },
    [width, height],
  );

  // `selectNode` is excluded from the pointer-effect's own dependency array below (mirrored
  // through a ref instead, same reasoning as `drawRef` above) since depending on it directly would
  // tear down and re-attach the native listeners (and reset the gesture-tracking closure state
  // below) on every pan/zoom change produced by this very effect's own pinch/drag handling.
  const selectNodeRef = useRef(selectNode);
  useEffect(() => {
    selectNodeRef.current = selectNode;
  }, [selectNode]);

  // A single, native (not JSX-prop) pointer-event pipeline handling three interactions: single-
  // pointer background pan, single-pointer node drag, and — when a second pointer joins mid-
  // gesture (touch only; mouse/pen never produce a second simultaneous pointer) — real two-finger
  // pinch-to-zoom, anchored on the pinch's own midpoint so the point under your fingers stays
  // under your fingers as you zoom, same as every native touch UI. Attached once on mount (not
  // re-created per pan/zoom-state render) via `canvas.setPointerCapture`, which keeps delivering
  // move/up events for a pointer even if it leaves the canvas's bounds — reading current
  // pan/zoom/hiddenCategories through the ref mirrors above rather than a closure, since this
  // effect's own closures are otherwise frozen at mount time.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pointers = new Map<number, { x: number; y: number }>();
    type Gesture =
      | { mode: "pan"; startX: number; startY: number; originX: number; originY: number; moved: boolean }
      | { mode: "node"; nodeId: string; startX: number; startY: number; originX: number; originY: number; moved: boolean }
      | { mode: "pinch"; startDistance: number; startZoom: number; worldX: number; worldY: number };
    let gesture: Gesture | null = null;

    const midpoint = () => {
      const pts = Array.from(pointers.values());
      return { x: (pts[0]!.x + pts[1]!.x) / 2, y: (pts[0]!.y + pts[1]!.y) / 2 };
    };
    const distance = () => {
      const pts = Array.from(pointers.values());
      return Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
    };
    const toLocal = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const releaseGestureNode = () => {
      if (gesture?.mode !== "node") return;
      simRef.current?.alphaTarget(0);
      const nodeId = gesture.nodeId;
      const node = simNodesRef.current.find((n) => n.id === nodeId);
      if (node && !node.pinned) {
        node.fx = null;
        node.fy = null;
      }
    };

    const startPinch = () => {
      releaseGestureNode();
      const mid = midpoint();
      const local = toLocal(mid.x, mid.y);
      gesture = {
        mode: "pinch",
        startDistance: distance(),
        startZoom: zoomRef.current,
        worldX: (local.x - panRef.current.x) / zoomRef.current,
        worldY: (local.y - panRef.current.y) / zoomRef.current,
      };
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      // Guarded rather than called unconditionally: not every environment implements it (jsdom,
      // used by this component's own test suite, doesn't), and — confirmed directly, not assumed
      // — a real browser can still throw ("No active pointer with the given id is found") for a
      // pointer it doesn't consider part of a genuinely active input session. Either way, the
      // gesture tracking below degrades gracefully without capture (a pointer that leaves the
      // canvas mid-drag just stops delivering move events, the same behavior a plain JSX prop
      // handler already had) — so a failure here should never abort the rest of this handler.
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // Ignored — see above.
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size >= 2) {
        startPinch();
        return;
      }

      const local = toLocal(e.clientX, e.clientY);
      const worldX = (local.x - panRef.current.x) / zoomRef.current;
      const worldY = (local.y - panRef.current.y) / zoomRef.current;
      const hitRadiusPx = e.pointerType === "touch" ? TOUCH_HIT_RADIUS_PX : HIT_RADIUS_PX;
      const visible = simNodesRef.current.filter((n) => !hiddenCategoriesRef.current.has(n.category));
      const hit = hitTest(visible, worldX, worldY, hitRadiusPx / zoomRef.current);

      if (hit) {
        gesture = {
          mode: "node",
          nodeId: hit.id,
          startX: e.clientX,
          startY: e.clientY,
          originX: hit.x ?? 0,
          originY: hit.y ?? 0,
          moved: false,
        };
        simRef.current?.alphaTarget(0.3).restart();
      } else {
        gesture = {
          mode: "pan",
          startX: e.clientX,
          startY: e.clientY,
          originX: panRef.current.x,
          originY: panRef.current.y,
          moved: false,
        };
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!gesture) return;

      if (gesture.mode === "pinch") {
        if (pointers.size < 2) return;
        const newZoom = clamp((gesture.startZoom * distance()) / gesture.startDistance, MIN_ZOOM, MAX_ZOOM);
        const mid = midpoint();
        const local = toLocal(mid.x, mid.y);
        setZoom(newZoom);
        setPan({ x: local.x - gesture.worldX * newZoom, y: local.y - gesture.worldY * newZoom });
        return;
      }

      const dx = e.clientX - gesture.startX;
      const dy = e.clientY - gesture.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) gesture.moved = true;

      if (gesture.mode === "pan") {
        setPan({ x: gesture.originX + dx, y: gesture.originY + dy });
      } else if (gesture.mode === "node") {
        const nodeId = gesture.nodeId;
        const originX = gesture.originX;
        const originY = gesture.originY;
        const node = simNodesRef.current.find((n) => n.id === nodeId);
        if (node) {
          node.fx = originX + dx / zoomRef.current;
          node.fy = originY + dy / zoomRef.current;
          drawRef.current();
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);

      if (gesture?.mode === "pinch") {
        if (pointers.size < 2) gesture = null;
        return;
      }
      if (gesture?.mode === "node") {
        const nodeId = gesture.nodeId;
        const moved = gesture.moved;
        releaseGestureNode();
        const node = simNodesRef.current.find((n) => n.id === nodeId);
        if (node && !moved) selectNodeRef.current(node);
      }
      gesture = null;
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [hasCanvas]);

  const togglePin = useCallback((node: SimNode) => {
    if (node.pinned) {
      node.pinned = false;
      node.fx = null;
      node.fy = null;
      simRef.current?.alpha(0.3).restart();
    } else {
      node.pinned = true;
      node.fx = node.x;
      node.fy = node.y;
    }
    bumpTick((t) => t + 1);
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const legendCounts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories.map((category) => {
      const catNodes = nodes.filter((n) => n.category === category);
      const total = catNodes.length;
      const hidden = hiddenCategories.has(category);
      const visible = hidden ? 0 : catNodes.filter((n) => !term || n.label.toLowerCase().includes(term)).length;
      return { category, total, visible, hidden };
    });
  }, [nodes, categories, hiddenCategories, search]);

  const searchMatches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return nodes.filter((n) => !hiddenCategories.has(n.category) && n.label.toLowerCase().includes(term)).slice(0, 8);
  }, [nodes, search, hiddenCategories]);

  const handleSelectSearchMatch = useCallback(
    (match: GraphExplorerNode) => {
      const node = simNodesRef.current.find((n) => n.id === match.id);
      if (!node) return;
      centerOn(node);
      selectNode(node);
      setSearchOpen(false);
    },
    [centerOn, selectNode],
  );

  const selectedNode = selectedId ? simNodesRef.current.find((n) => n.id === selectedId) ?? null : null;

  const radialActions = useMemo(() => {
    if (!selectedNode) return [];
    const actions: GraphExplorerAction[] = [];
    if (pinnable) {
      actions.push({
        label: selectedNode.pinned ? "Unpin" : "Pin",
        icon: selectedNode.pinned ? <UnlockIcon /> : <LockIcon />,
        onClick: (n) => {
          const node = simNodesRef.current.find((sn) => sn.id === n.id);
          if (node) togglePin(node);
        },
      });
    }
    actions.push(...(nodeActions?.(toPlainNode(selectedNode)) ?? []));
    actions.push({ label: "Close", icon: <CloseIcon />, onClick: () => setSelectedId(null) });
    return actions;
  }, [selectedNode, pinnable, nodeActions, togglePin]);

  const totalVisible = nodes.filter((n) => !hiddenCategories.has(n.category)).length;
  const canvasAriaLabel = `${ariaLabel ?? title ?? "Network graph"}: ${totalVisible} of ${nodes.length} nodes shown across ${categories.length} categories`;

  return (
    <figure
      className={clsx("rebar-chart", "rebar-graph-explorer", className)}
      data-rebar-component="graph-explorer"
      style={{ margin: 0 }}
      {...props}
    >
      {title ? <figcaption>{titleContent}</figcaption> : null}

      <div className="rebar-graph-explorer-toolbar" data-rebar-part="toolbar">
        {searchable ? (
          <div className="rebar-graph-explorer-search" data-rebar-part="search">
            <SearchIcon className="rebar-graph-explorer-search-icon" aria-hidden="true" />
            <input
              id={searchInputId}
              type="text"
              className="rebar-graph-explorer-search-input"
              placeholder="Search nodes…"
              aria-label="Search nodes"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
            />
            {searchOpen && searchMatches.length > 0 ? (
              <ul className="rebar-graph-explorer-search-results" data-rebar-part="search-results">
                {searchMatches.map((match) => (
                  <li key={match.id}>
                    <button type="button" onClick={() => handleSelectSearchMatch(match)}>
                      {match.label}
                      <span className="rebar-graph-explorer-search-result-category">{match.category}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="rebar-graph-explorer-zoom" data-rebar-part="zoom-controls">
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
          <button
            type="button"
            className="rebar-node-link-graph-zoom-button"
            data-rebar-part="reset-view-button"
            aria-label="Reset view"
            onClick={resetView}
          >
            ⤢
          </button>
        </div>
      </div>

      {legend ? (
        <div className="rebar-graph-explorer-legend" data-rebar-part="legend">
          {legendCounts.map(({ category, total, visible, hidden }) => (
            <button
              key={category}
              type="button"
              className="rebar-graph-explorer-legend-chip"
              data-rebar-part="legend-chip"
              aria-pressed={!hidden}
              onClick={() => toggleCategory(category)}
            >
              <span
                className="rebar-graph-explorer-legend-swatch"
                style={{ background: categoryColor.get(category) }}
                aria-hidden="true"
              />
              {visible} / {total} {category}
            </button>
          ))}
        </div>
      ) : null}

      <div
        ref={containerRef}
        className="rebar-graph-explorer-canvas-wrap"
        data-rebar-part="canvas-wrap"
        style={{ width, height, position: "relative" }}
      >
        {nodes.length === 0 ? (
          renderChartEmptyState(height)
        ) : (
          <canvas
            ref={canvasRef}
            className="rebar-graph-explorer-canvas"
            data-rebar-part="canvas"
            style={{ width, height, display: "block", touchAction: "none" }}
            role="img"
            aria-label={canvasAriaLabel}
          />
        )}

        {selectedNode && menuPos && radialActions.length > 0 ? (
          <div
            className="rebar-graph-explorer-radial-menu"
            data-rebar-part="radial-menu"
            style={{ left: menuPos.x, top: menuPos.y }}
          >
            {radialActions.map((action, i) => {
              const angle = (i / radialActions.length) * Math.PI * 2 - Math.PI / 2;
              const x = Math.cos(angle) * RADIAL_MENU_RADIUS;
              const y = Math.sin(angle) * RADIAL_MENU_RADIUS;
              return (
                <button
                  key={action.label}
                  type="button"
                  className="rebar-graph-explorer-radial-menu-button"
                  data-rebar-part="radial-menu-button"
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                  aria-label={action.label}
                  onClick={() => action.onClick(toPlainNode(selectedNode))}
                >
                  {action.icon ?? action.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div aria-live="polite" className="rebar-visually-hidden" data-rebar-part="status">
        {statusMessage}
      </div>
    </figure>
  );
}
