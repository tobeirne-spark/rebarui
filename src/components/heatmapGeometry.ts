// Pure geometry shared by `SchematicHeatmap` (the shaded plot) and `HeatmapPainter` (the authoring
// canvas). Nothing in here touches React, the DOM or a canvas — which is exactly why the camera
// math, frame hit-testing, resize math and cell/rect conversion live here rather than inside the
// components: jsdom cannot drive canvas/pointer geometry (see add-constructs.md "jsdom
// limitations"), so this file is where that math is unit-tested.

/** `[x0, y0, x1, y1]` in canvas ("world") units. May be negative — the canvas is unbounded. */
export type HeatmapBounds = [number, number, number, number];

/**
 * A brush: a user-defined category of region within ONE layout ("Building", "Interval", ...).
 * Purely presentational — it decides swatch colour in the painter, whether a region's label is
 * drawn on the plot, and which filter groups a host app might offer. It is not an identity: a
 * region's `id` is what binds it to host data.
 */
export interface HeatmapBrush {
  id: string;
  label: string;
  /** Painter outline/swatch colour — a literal CSS colour (the painter's canvas cannot resolve
   * `var(--…)`). The plot shades by value, not by brush. */
  color: string;
  /** Draw each region's label on the plot. Default true. Turn off for dense brushes. */
  showLabel?: boolean;
  /** Whether a host should show this brush's regions until the viewer toggles it. Default true.
   * Read by `defaultVisibleBrushes`; neither component hides anything by itself. */
  defaultVisible?: boolean;
}

/** One shaded/paintable region: an id plus one or more rectangles, drawn as a single shape. */
export interface HeatmapRegion {
  /** The host-facing key — what `SchematicHeatmap`'s `values` is keyed by. */
  id: string;
  /** The id of the `HeatmapBrush` this region was painted with. */
  kind: string;
  /** The text drawn on the plot and in tooltips. */
  label: string;
  /** `[x0, y0, x1, y1]` in canvas units; one region may be several rectangles. */
  rects: HeatmapBounds[];
  /** Opaque pass-through for hosts that derive a region's number from other regions (e.g. a
   * section summed from its intervals). Neither component interprets it; the painter preserves it
   * (and any other extra field) when a region is re-painted. */
  memberIds?: string[];
}

/** A tracing image behind the painter's grid — an authoring aid, optionally also shown on the plot. */
export interface HeatmapBackground {
  /** Any URL an `<img>` can load (a `blob:` URL is fine for a session-only demo). */
  url: string;
  /** Offset of the image's top-left corner on the canvas, in canvas units. */
  x: number;
  y: number;
  /** 1 = the image's own pixel size. */
  scale: number;
  /** 0..1 — how strongly the image shows through. */
  opacity: number;
  /** Also draw this image behind the regions on the plot. Default off (a tracing aid only). */
  showInPlot?: boolean;
  /** The image's own pixel size, recorded at upload — lets bounds be computed without loading it. */
  width?: number;
  height?: number;
  /** Cache-buster appended as `?v=` (skipped for `blob:`/`data:` URLs). */
  version?: number;
}

/** A named rectangle of the canvas that the plot shows — drawn and adjusted in the painter. */
export interface HeatmapFrame {
  id: string;
  title: string;
  /** `[x0, y0, x1, y1]` in canvas units. */
  crop: HeatmapBounds;
}

/** Everything the painter edits and the plot draws: one self-contained drawing. */
export interface HeatmapLayout {
  /** Painter grid cell size, in canvas units. */
  cellSize: number;
  /** A region whose `kind` isn't listed gets a generated default (see `brushesOf`). */
  brushes: HeatmapBrush[];
  background?: HeatmapBackground;
  frames: HeatmapFrame[];
  regions: HeatmapRegion[];
}

// ---- bounds -----------------------------------------------------------------------------------

function unionOf(rects: HeatmapBounds[]): HeatmapBounds | null {
  if (rects.length === 0) return null;
  return [
    Math.min(...rects.map((r) => r[0])),
    Math.min(...rects.map((r) => r[1])),
    Math.max(...rects.map((r) => r[2])),
    Math.max(...rects.map((r) => r[3])),
  ];
}

/** The box around the painted regions (null when nothing is painted). */
export function regionBounds(layout: Pick<HeatmapLayout, "regions">): HeatmapBounds | null {
  return unionOf(layout.regions.flatMap((r) => r.rects));
}

/** The box around EVERYTHING — regions, frames and the tracing image (when its size is known). The
 * canvas is unbounded, so this is what "fit to content" frames. */
export function contentBounds(layout: Pick<HeatmapLayout, "regions" | "frames" | "background">): HeatmapBounds | null {
  const parts: HeatmapBounds[] = [...layout.regions.flatMap((r) => r.rects), ...layout.frames.map((f) => f.crop)];
  const bg = layout.background;
  if (bg?.width && bg.height) parts.push([bg.x, bg.y, bg.x + bg.width * bg.scale, bg.y + bg.height * bg.scale]);
  return unionOf(parts);
}

/** The frames a plot offers: the layout's own when it has any, otherwise one "Whole drawing" fitted
 * to its painted regions with a small margin. */
export function framesOf(layout: Pick<HeatmapLayout, "regions" | "frames" | "cellSize">): HeatmapFrame[] {
  if (layout.frames.length > 0) return layout.frames;
  const box = regionBounds(layout) ?? [0, 0, 1000, 700];
  const pad = Math.max(layout.cellSize, 20);
  return [{ id: "all", title: "Whole drawing", crop: [box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad] }];
}

const FALLBACK_COLORS = ["#1677ff", "#cf1322", "#389e0d", "#722ed1", "#d48806", "#08979c", "#c41d7f"];

/** Every brush a layout's regions use: its declared ones, plus a generated default for any region
 * kind nobody declared (hand-edited data, an older file), so nothing is ever unrenderable. */
export function brushesOf(layout: Pick<HeatmapLayout, "brushes" | "regions">): HeatmapBrush[] {
  const brushes = [...layout.brushes];
  const known = new Set(brushes.map((b) => b.id));
  for (const r of layout.regions) {
    if (known.has(r.kind)) continue;
    known.add(r.kind);
    brushes.push({ id: r.kind, label: r.kind, color: FALLBACK_COLORS[brushes.length % FALLBACK_COLORS.length]! });
  }
  return brushes;
}

/** The swatch colours the painter hands out to new brushes, in order. */
export const BRUSH_SWATCHES = FALLBACK_COLORS;

/** Does any rect of `region` overlap the frame's crop? */
export function regionInCrop(region: HeatmapRegion, crop: HeatmapBounds): boolean {
  const [x0, y0, x1, y1] = crop;
  return region.rects.some(([rx0, ry0, rx1, ry1]) => rx1 > x0 && rx0 < x1 && ry1 > y0 && ry0 < y1);
}

/** The brushes worth offering as filters for a frame: only those with at least one region in it. */
export function brushesInFrame(layout: Pick<HeatmapLayout, "brushes" | "regions">, frame: HeatmapFrame): HeatmapBrush[] {
  const present = new Set(layout.regions.filter((r) => regionInCrop(r, frame.crop)).map((r) => r.kind));
  return brushesOf(layout).filter((b) => present.has(b.id));
}

/** The brushes shown until a viewer toggles them. */
export function defaultVisibleBrushes(layout: Pick<HeatmapLayout, "brushes" | "regions">): Set<string> {
  return new Set(brushesOf(layout).filter((b) => b.defaultVisible !== false).map((b) => b.id));
}

/** The regions inside the frame's crop whose brush is currently visible. */
export function regionsInFrame(
  layout: Pick<HeatmapLayout, "regions">,
  frame: HeatmapFrame,
  visible: ReadonlySet<string>,
): HeatmapRegion[] {
  return layout.regions.filter((r) => visible.has(r.kind) && regionInCrop(r, frame.crop));
}

/** `url`, with the cache-busting `?v=` appended when there's a `version` (not for blob:/data: URLs). */
export function backgroundSrc(bg: Pick<HeatmapBackground, "url" | "version">): string {
  if (bg.version === undefined || /^(blob|data):/i.test(bg.url)) return bg.url;
  return `${bg.url}${bg.url.includes("?") ? "&" : "?"}v=${bg.version}`;
}

/** A unique, URL-safe id derived from a label ("Frame 2" -> "frame-2", "frame-2-2" if taken). */
export function slugOf(label: string, taken: ReadonlySet<string>, fallback: string): string {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || fallback;
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

// ---- cells <-> rects ----------------------------------------------------------------------------

/** `"cx,cy"` in grid units at a given cell size (may be negative). */
export type CellKey = string;

export const cellKey = (cx: number, cy: number): CellKey => `${cx},${cy}`;
export const parseCellKey = (key: CellKey): [number, number] => {
  const [cx, cy] = key.split(",").map(Number);
  return [cx!, cy!];
};

/**
 * Greedy run-merge: maximal horizontal runs per row, then vertically merge runs that share the
 * exact same x-extent. A painted blob becomes a handful of rects instead of one per cell.
 * Output is ordered by row, then column, and is canonical for a given cell set.
 */
export function cellsToRects(cells: ReadonlySet<CellKey>, cellSize: number): HeatmapBounds[] {
  const byRow = new Map<number, number[]>();
  for (const key of cells) {
    const [cx, cy] = parseCellKey(key);
    const row = byRow.get(cy);
    if (row) row.push(cx);
    else byRow.set(cy, [cx]);
  }
  const runs: { x0: number; x1: number; y0: number; y1: number }[] = [];
  // Runs whose bottom edge is at `y1`, keyed by their exact x-extent — the only ones a new run on
  // the next row can extend.
  let open = new Map<string, { x0: number; x1: number; y0: number; y1: number }>();
  let openRow = Number.NaN;
  for (const [cy, xs] of [...byRow.entries()].sort((a, b) => a[0] - b[0])) {
    xs.sort((a, b) => a - b);
    if (cy !== openRow + 1) open = new Map();
    const next = new Map<string, { x0: number; x1: number; y0: number; y1: number }>();
    let start = xs[0]!;
    let prev = xs[0]!;
    for (const x of [...xs.slice(1), Number.NaN]) {
      if (x !== prev + 1) {
        const k = `${start},${prev + 1}`;
        const above = open.get(k);
        if (above) {
          above.y1 = cy + 1;
          next.set(k, above);
        } else {
          const run = { x0: start, x1: prev + 1, y0: cy, y1: cy + 1 };
          runs.push(run);
          next.set(k, run);
        }
        start = x;
      }
      prev = x;
    }
    open = next;
    openRow = cy;
  }
  return runs.map((r) => [r.x0 * cellSize, r.y0 * cellSize, r.x1 * cellSize, r.y1 * cellSize]);
}

/** Every grid cell touched by the rects (partial overlap counts — it rounds outward). */
export function rectsToCells(rects: readonly HeatmapBounds[], cellSize: number): Set<CellKey> {
  const cells = new Set<CellKey>();
  for (const [x0, y0, x1, y1] of rects) {
    for (let cy = Math.floor(y0 / cellSize); cy < Math.ceil(y1 / cellSize); cy++) {
      for (let cx = Math.floor(x0 / cellSize); cx < Math.ceil(x1 / cellSize); cx++) cells.add(cellKey(cx, cy));
    }
  }
  return cells;
}

/** The grid cell containing a world point. */
export const cellAt = (wx: number, wy: number, cellSize: number): [number, number] => [
  Math.floor(wx / cellSize),
  Math.floor(wy / cellSize),
];

/** Every cell on the straight line from `from` to `to`, inclusive — so a fast drag leaves a
 * continuous stroke rather than dots. */
export function lineCells(from: readonly [number, number], to: readonly [number, number]): [number, number][] {
  const [fx, fy] = from;
  const [cx, cy] = to;
  const steps = Math.max(Math.abs(cx - fx), Math.abs(cy - fy), 1);
  const out: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    out.push([Math.round(fx + ((cx - fx) * i) / steps), Math.round(fy + ((cy - fy) * i) / steps)]);
  }
  return out;
}

/** Every cell in the inclusive box between two corner cells. */
export function boxCells(a: readonly [number, number], b: readonly [number, number]): [number, number][] {
  const out: [number, number][] = [];
  for (let cy = Math.min(a[1], b[1]); cy <= Math.max(a[1], b[1]); cy++) {
    for (let cx = Math.min(a[0], b[0]); cx <= Math.max(a[0], b[0]); cx++) out.push([cx, cy]);
  }
  return out;
}

/** A new cell set with `targets` added (`paint`) or removed (`erase`). */
export function applyCells(
  cells: ReadonlySet<CellKey>,
  targets: readonly (readonly [number, number])[],
  mode: "paint" | "erase",
): Set<CellKey> {
  const next = new Set(cells);
  for (const [cx, cy] of targets) {
    if (mode === "paint") next.add(cellKey(cx, cy));
    else next.delete(cellKey(cx, cy));
  }
  return next;
}

// ---- outline ------------------------------------------------------------------------------------

/**
 * The outer boundary (and any holes) of a union of rects, as closed SVG sub-paths: split the plane
 * on every rect edge, keep only the edges between a covered and an uncovered elementary cell, then
 * chain those edges into loops and drop collinear vertices. Drawing it as ONE shape (rather than a
 * stroke per rect) is what makes a region painted as several stacked rects read as a single block
 * with no seam lines — and, being closed, `stroke-linejoin` actually applies at its corners.
 * Returns "" for no (or zero-area) rects.
 */
export function outlinePath(rects: readonly HeatmapBounds[]): string {
  const solid = rects.filter((r) => r[2] > r[0] && r[3] > r[1]);
  if (solid.length === 0) return "";
  const xs = [...new Set(solid.flatMap((r) => [r[0], r[2]]))].sort((a, b) => a - b);
  const ys = [...new Set(solid.flatMap((r) => [r[1], r[3]]))].sort((a, b) => a - b);
  const xi = new Map(xs.map((x, i) => [x, i]));
  const yi = new Map(ys.map((y, i) => [y, i]));
  const covered = new Set<string>();
  for (const [x0, y0, x1, y1] of solid) {
    for (let i = xi.get(x0)!; i < xi.get(x1)!; i++) for (let j = yi.get(y0)!; j < yi.get(y1)!; j++) covered.add(`${i},${j}`);
  }
  const has = (i: number, j: number) => covered.has(`${i},${j}`);

  // Directed boundary edges, clockwise around covered cells (screen coordinates, y down), so an
  // outer boundary runs clockwise and a hole runs counter-clockwise. Vertices are [i, j] grid indices.
  const out = new Map<string, [number, number][]>();
  const addEdge = (a: [number, number], b: [number, number]) => {
    const k = `${a[0]},${a[1]}`;
    const list = out.get(k);
    if (list) list.push(b);
    else out.set(k, [b]);
  };
  for (const key of covered) {
    const [i, j] = key.split(",").map(Number) as [number, number];
    if (!has(i, j - 1)) addEdge([i, j], [i + 1, j]);
    if (!has(i + 1, j)) addEdge([i + 1, j], [i + 1, j + 1]);
    if (!has(i, j + 1)) addEdge([i + 1, j + 1], [i, j + 1]);
    if (!has(i - 1, j)) addEdge([i, j + 1], [i, j]);
  }

  // Deterministic order: start loops from the top-most, then left-most unused vertex.
  const starts = [...out.keys()].map((k) => k.split(",").map(Number) as [number, number]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const loops: [number, number][][] = [];
  for (const start of starts) {
    while ((out.get(`${start[0]},${start[1]}`)?.length ?? 0) > 0) {
      const loop: [number, number][] = [start];
      let cur = start;
      for (;;) {
        const nexts = out.get(`${cur[0]},${cur[1]}`)!;
        const next = nexts.shift()!;
        if (next[0] === start[0] && next[1] === start[1]) break;
        loop.push(next);
        cur = next;
      }
      loops.push(loop);
    }
  }

  let d = "";
  for (const loop of loops) {
    // Drop vertices that sit on a straight run, then rotate so the loop starts at a real corner.
    const n = loop.length;
    const corners = loop.filter((p, idx) => {
      const a = loop[(idx + n - 1) % n]!;
      const b = loop[(idx + 1) % n]!;
      return !((a[0] === p[0] && p[0] === b[0]) || (a[1] === p[1] && p[1] === b[1]));
    });
    const first = corners.reduce((best, p, idx) => (p[1] < corners[best]![1] || (p[1] === corners[best]![1] && p[0] < corners[best]![0]) ? idx : best), 0);
    const ordered = [...corners.slice(first), ...corners.slice(0, first)];
    const pts = ordered.map(([i, j]) => [xs[i]!, ys[j]!] as const);
    d += `M${pts[0]![0]} ${pts[0]![1]}`;
    for (let k = 1; k < pts.length; k++) {
      d += pts[k]![1] === pts[k - 1]![1] ? `H${pts[k]![0]}` : `V${pts[k]![1]}`;
    }
    d += "Z";
  }
  return d;
}

// ---- plot labels / shading ---------------------------------------------------------------------

/** A region's label, fitted to its own first rect: horizontal when the shape is wide, rotated when
 * it's a tall narrow strip, sized so it never spills past the shape. */
export function labelLayout(
  rect: HeatmapBounds,
  text: string,
  maxFontSize: number,
): { cx: number; cy: number; size: number; rotate: boolean } {
  const [rx0, ry0, rx1, ry1] = rect;
  const w = rx1 - rx0;
  const h = ry1 - ry0;
  const rotate = h > w * 1.6;
  const along = rotate ? h : w;
  const across = rotate ? w : h;
  const size = Math.max(4, Math.min(maxFontSize, (along / Math.max(text.length, 1)) * 1.7, across * 0.8));
  return { cx: (rx0 + rx1) / 2, cy: (ry0 + ry1) / 2, size, rotate };
}

/** A value the plot can shade: a done/expected pair, or a ready-made 0..1 share. */
export type HeatmapValue = { done: number; expected: number } | number;

/** The 0..1 share a value represents — null ("no data") for undefined, NaN, or expected <= 0. */
export function shareOf(value: HeatmapValue | undefined | null): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null;
  if (!(value.expected > 0) || !Number.isFinite(value.done)) return null;
  return Math.min(1, Math.max(0, value.done / value.expected));
}

export const RAMP_STEPS = 8;

/** The default 8-step sequential ramp: `--rebar-color-primary` blended into the page background,
 * light to dark. Opaque on purpose — a region is several overlapping rects, and a translucent fill
 * would show darker seams where they overlap. */
export function defaultColorScale(share: number): string {
  const step = share >= 1 ? RAMP_STEPS - 1 : Math.min(RAMP_STEPS - 1, Math.max(0, Math.floor(share * RAMP_STEPS)));
  const percent = Math.round(14 + (step / (RAMP_STEPS - 1)) * 86);
  return `color-mix(in srgb, var(--rebar-color-primary, #0066cc) ${percent}%, var(--rebar-color-bg-primary, #ffffff))`;
}

// ---- camera (the painter's pan/zoom over the infinite canvas) --------------------------------------

/** World coordinates of the viewport's top-left corner, plus screen px per world unit. */
export interface HeatmapCamera {
  x: number;
  y: number;
  zoom: number;
}

export const MIN_ZOOM = 0.02;
export const MAX_ZOOM = 8;

export const clampZoom = (z: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

/** The camera that centres `bounds` in a `viewport` (CSS px) with `pad` px of margin. */
export function fitCamera(bounds: HeatmapBounds, viewport: { w: number; h: number }, pad = 48): HeatmapCamera {
  const bw = Math.max(bounds[2] - bounds[0], 1);
  const bh = Math.max(bounds[3] - bounds[1], 1);
  const zoom = clampZoom(Math.min((viewport.w - pad * 2) / bw, (viewport.h - pad * 2) / bh));
  return { zoom, x: bounds[0] - (viewport.w / zoom - bw) / 2, y: bounds[1] - (viewport.h / zoom - bh) / 2 };
}

/** Zoom by `factor` keeping the world point under screen position (sx, sy) fixed. */
export function zoomCameraAt(cam: HeatmapCamera, factor: number, sx: number, sy: number): HeatmapCamera {
  const zoom = clampZoom(cam.zoom * factor);
  const wx = cam.x + sx / cam.zoom;
  const wy = cam.y + sy / cam.zoom;
  return { zoom, x: wx - sx / zoom, y: wy - sy / zoom };
}

/** Scroll the view by a screen-pixel delta (content moves the opposite way, as with a scroll wheel). */
export function scrollCamera(cam: HeatmapCamera, dxPx: number, dyPx: number): HeatmapCamera {
  return { ...cam, x: cam.x + dxPx / cam.zoom, y: cam.y + dyPx / cam.zoom };
}

/** Grab-and-drag: where the camera ends up when the pointer moved (dxPx, dyPx) from `origin`. */
export function dragCamera(origin: HeatmapCamera, dxPx: number, dyPx: number): HeatmapCamera {
  return { ...origin, x: origin.x - dxPx / origin.zoom, y: origin.y - dyPx / origin.zoom };
}

/** The zoom factor for a Ctrl/Cmd+wheel (or pinch) `deltaY`. */
export const wheelZoomFactor = (deltaY: number): number => Math.exp(-deltaY * 0.003);

export const screenToWorld = (cam: HeatmapCamera, sx: number, sy: number): [number, number] => [
  cam.x + sx / cam.zoom,
  cam.y + sy / cam.zoom,
];

export const worldToScreen = (cam: HeatmapCamera, wx: number, wy: number): [number, number] => [
  (wx - cam.x) * cam.zoom,
  (wy - cam.y) * cam.zoom,
];

// ---- frames: hit-testing, move, resize ------------------------------------------------------------

export type HeatmapHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

/** Screen-pixel size of a resize handle. */
export const HANDLE_PX = 9;

export const snap = (v: number, step: number): number => Math.round(v / step) * step;

export function handlePoints([x0, y0, x1, y1]: HeatmapBounds): Record<HeatmapHandle, [number, number]> {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  return { nw: [x0, y0], n: [mx, y0], ne: [x1, y0], e: [x1, my], se: [x1, y1], s: [mx, y1], sw: [x0, y1], w: [x0, my] };
}

/** Which of the 8 handles (if any) a world point is on, at the current zoom. */
export function hitHandle(b: HeatmapBounds, wx: number, wy: number, zoom: number): HeatmapHandle | null {
  const reach = (HANDLE_PX * 0.9) / zoom;
  for (const [handle, [hx, hy]] of Object.entries(handlePoints(b)) as [HeatmapHandle, [number, number]][]) {
    if (Math.abs(wx - hx) <= reach && Math.abs(wy - hy) <= reach) return handle;
  }
  return null;
}

export const HANDLE_CURSOR: Record<HeatmapHandle, string> = {
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
};

/** `orig` with the edge(s) named by `handle` dragged to (px, py), never shrinking below `min`. */
export function resizeBounds(orig: HeatmapBounds, handle: HeatmapHandle, px: number, py: number, min: number): HeatmapBounds {
  let [x0, y0, x1, y1] = orig;
  if (handle.includes("w")) x0 = Math.min(px, x1 - min);
  if (handle.includes("e")) x1 = Math.max(px, x0 + min);
  if (handle.includes("n")) y0 = Math.min(py, y1 - min);
  if (handle.includes("s")) y1 = Math.max(py, y0 + min);
  return [x0, y0, x1, y1];
}

export const moveBounds = ([x0, y0, x1, y1]: HeatmapBounds, dx: number, dy: number): HeatmapBounds => [x0 + dx, y0 + dy, x1 + dx, y1 + dy];

/** The bounds spanned by two corner points, in either order. */
export const spanBounds = (a: readonly [number, number], b: readonly [number, number]): HeatmapBounds => [
  Math.min(a[0], b[0]),
  Math.min(a[1], b[1]),
  Math.max(a[0], b[0]),
  Math.max(a[1], b[1]),
];

export const pointInBounds = (b: HeatmapBounds, wx: number, wy: number): boolean => wx >= b[0] && wx <= b[2] && wy >= b[1] && wy <= b[3];

/** The top-most (last-listed) frame containing a world point. */
export function frameAt(frames: readonly HeatmapFrame[], wx: number, wy: number): HeatmapFrame | undefined {
  return [...frames].reverse().find((f) => pointInBounds(f.crop, wx, wy));
}
