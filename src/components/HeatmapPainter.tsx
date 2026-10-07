import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { Input } from "./Input";
import {
  BRUSH_SWATCHES,
  HANDLE_CURSOR,
  HANDLE_PX,
  applyCells,
  boxCells,
  brushesOf,
  cellAt,
  cellKey,
  cellsToRects,
  contentBounds,
  dragCamera,
  fitCamera,
  frameAt,
  handlePoints,
  hitHandle,
  lineCells,
  moveBounds,
  outlinePath,
  parseCellKey,
  rectsToCells,
  resizeBounds,
  screenToWorld,
  scrollCamera,
  slugOf,
  snap,
  spanBounds,
  wheelZoomFactor,
  zoomCameraAt,
  backgroundSrc,
} from "./heatmapGeometry";
import type {
  CellKey,
  HeatmapBackground,
  HeatmapBounds,
  HeatmapBrush,
  HeatmapCamera,
  HeatmapFrame,
  HeatmapHandle,
  HeatmapLayout,
  HeatmapRegion,
} from "./heatmapGeometry";

export type HeatmapPainterTool = "paint" | "frame";

/** What `renderCellForm` receives — everything needed to build a custom "name this painted area" form. */
export interface HeatmapPainterCellFormContext {
  /** How many grid cells are currently painted (not yet turned into a region). */
  cellCount: number;
  id: string;
  setId: (id: string) => void;
  label: string;
  setLabel: (label: string) => void;
  brushId: string | null;
  setBrushId: (id: string) => void;
  brushes: HeatmapBrush[];
  /** Whether `id` already names a region (creating will replace its shape). */
  idTaken: boolean;
  /** True while re-painting an existing region via its "edit" button. */
  editing: boolean;
  /** True when there is something to create (cells painted, id and brush chosen). */
  canCreate: boolean;
  /** Turn the painted cells into a region (runs `onCreateRegion` first, if given). */
  create: () => void;
}

export interface HeatmapPainterProps extends Omit<ComponentPropsWithoutRef<"div">, "onChange" | "defaultValue"> {
  /** Controlled layout. Omit for uncontrolled (use `defaultValue`). */
  value?: HeatmapLayout;
  /** Uncontrolled initial layout. Default: an empty layout with 20-unit cells. */
  defaultValue?: HeatmapLayout;
  /** Called with the next whole layout after every edit (paint-to-region, frame drag, brush edit, ...). */
  onChange?: (layout: HeatmapLayout) => void;
  /** Controlled active brush (the one new regions are painted with). Omit for uncontrolled. */
  activeBrushId?: string | null;
  defaultActiveBrushId?: string | null;
  onActiveBrushChange?: (id: string | null) => void;
  /** Height of the whole painter (stage + side panel). A number is px. Default 560. */
  height?: number | string;
  /** Grid sizes offered in the cell-size picker. Default `[10, 20, 50]`. */
  cellSizes?: number[];
  /** Suggested region ids for the default form's id field (rendered as a native `<datalist>`).
   * The host's own register/search UI belongs in `renderCellForm` instead. */
  idSuggestions?: string[];
  /** Replaces the whole "name this painted area" form — typically to offer a host-specific id picker. */
  renderCellForm?: (ctx: HeatmapPainterCellFormContext) => ReactNode;
  /** Called with the region about to be created. Return a (possibly modified) region to use that
   * instead, or `false` to veto. */
  onCreateRegion?: (region: HeatmapRegion) => HeatmapRegion | false | void;
  /** Stores a chosen tracing image and returns where it now lives — the host owns image storage.
   * Without it, the "Upload image" control is not offered (an existing background can still be
   * adjusted). Return `width`/`height` when you know them; otherwise they are read from the file. */
  onUploadBackground?: (file: File) => Promise<{ url: string; width?: number; height?: number; version?: number }>;
  /** Called when the tracing image is removed (so the host can delete the stored file). */
  onRemoveBackground?: () => void | Promise<void>;
  /** Start with this camera instead of fitting the layout's content. */
  defaultCamera?: HeatmapCamera;
  /** Accessible name of the drawing canvas. Default "Heatmap painting canvas". */
  canvasLabel?: string;
}

const EMPTY_LAYOUT: HeatmapLayout = { cellSize: 20, brushes: [], frames: [], regions: [] };
const DEFAULT_CELL_SIZES = [10, 20, 50];
const KEY_PAN_PX = 48;

/** Resolves a CSS custom property to a literal colour — a canvas cannot read `var(--…)` itself. */
function readToken(el: Element | null, name: string, fallback: string): string {
  if (!el || typeof getComputedStyle === "undefined") return fallback;
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

type FrameDrag = { mode: "draw" | "move" | "resize"; handle?: HeatmapHandle; start: [number, number]; orig: HeatmapBounds; id: string | null };
type PaintState = { mode: "paint" | "erase"; marqueeStart: [number, number] | null; marqueeNow: [number, number] | null; last: [number, number] };

const isTyping = (t: EventTarget | null): boolean =>
  t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);

/** Reads an image file's own pixel size; null if it can't be decoded (or takes implausibly long). */
function probeImage(file: File): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return resolve(null);
    const url = URL.createObjectURL(file);
    const probe = new Image();
    const done = (v: { w: number; h: number } | null) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    const timer = setTimeout(() => done(null), 5000);
    probe.onload = () => {
      clearTimeout(timer);
      done({ w: probe.naturalWidth, h: probe.naturalHeight });
    };
    probe.onerror = () => {
      clearTimeout(timer);
      done(null);
    };
    probe.src = url;
  });
}

/** A destructive button that needs a second press to act — and disarms itself on blur. */
function ConfirmButton({
  label,
  confirmLabel = "Confirm",
  subject,
  onConfirm,
  disabled,
}: {
  label: string;
  confirmLabel?: string;
  subject: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  return (
    <Button
      size="sm"
      variant={armed ? "destructive" : "secondary"}
      disabled={disabled}
      aria-label={armed ? `${confirmLabel} ${label.toLowerCase()} ${subject}` : `${label} ${subject}`}
      data-rebar-part="confirm-button"
      onBlur={() => setArmed(false)}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : label}
    </Button>
  );
}

/**
 * An infinite-canvas authoring tool for the layouts `SchematicHeatmap` draws: paint grid cells over
 * an optional tracing image, turn painted areas into named regions, and drag out the frames (named
 * crops) the plot will show. Extracting geometry automatically from a drawing proved hit-and-miss,
 * so the layout is PAINTED by a person instead — this is that tool, minus any knowledge of where
 * the region ids or the image come from (the host supplies those via `renderCellForm`/
 * `idSuggestions` and `onUploadBackground`).
 *
 * Interaction: scroll pans; Ctrl/Cmd+scroll (or pinch) zooms at the cursor; hold Space (or use the
 * middle button) and drag to grab the canvas. PAINT tool: drag paints cells, Shift-drag paints a
 * box, starting on a painted cell erases. FRAME tool: drag on empty canvas to draw a frame, drag a
 * frame to move it, drag one of its 8 handles to resize, Delete removes it. The focused canvas also
 * takes arrow keys (pan), +/- (zoom) and 0 (fit).
 *
 * Opinion tier: real internal state machines — tool, camera, in-flight drag, painted-cell draft,
 * selected frame, space-to-pan — that branch the component into different modes. The layout itself
 * is controlled (`value`/`onChange`) or uncontrolled (`defaultValue`); the painted-but-uncreated
 * cells are deliberately transient UI state and never leave the component.
 *
 * Pointer painting is not keyboard operable (there is no keyboard cell cursor); every other control
 * in the side panel is.
 */
export function HeatmapPainter({
  value,
  defaultValue,
  onChange,
  activeBrushId,
  defaultActiveBrushId = null,
  onActiveBrushChange,
  height = 560,
  cellSizes = DEFAULT_CELL_SIZES,
  idSuggestions,
  renderCellForm,
  onCreateRegion,
  onUploadBackground,
  onRemoveBackground,
  defaultCamera,
  canvasLabel = "Heatmap painting canvas",
  className,
  style,
  ...props
}: HeatmapPainterProps) {
  // ---- layout (controlled / uncontrolled) -----------------------------------------------------------
  const layoutControlled = value !== undefined;
  const [internalLayout, setInternalLayout] = useState<HeatmapLayout>(defaultValue ?? EMPTY_LAYOUT);
  const layout = layoutControlled ? value : internalLayout;
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Applies `fn` to the LATEST layout (not a render-time snapshot), so a burst of edits inside one
  // gesture (a frame drag emits many) never clobbers itself even when the host is slow to echo.
  const update = useCallback(
    (fn: (l: HeatmapLayout) => HeatmapLayout) => {
      const next = fn(layoutRef.current);
      layoutRef.current = next;
      if (!layoutControlled) setInternalLayout(next);
      onChangeRef.current?.(next);
    },
    [layoutControlled],
  );

  const { cellSize, regions, frames } = layout;
  const brushes = useMemo(() => brushesOf(layout), [layout]);
  const brushMap = useMemo(() => Object.fromEntries(brushes.map((b) => [b.id, b])), [brushes]);

  // ---- active brush ---------------------------------------------------------------------------------
  const brushControlled = activeBrushId !== undefined;
  const [internalBrush, setInternalBrush] = useState<string | null>(defaultActiveBrushId);
  const requestedBrush = brushControlled ? activeBrushId : internalBrush;
  const brushId = (requestedBrush && brushMap[requestedBrush] ? requestedBrush : brushes[0]?.id) ?? null;
  const setBrushId = (id: string | null) => {
    if (!brushControlled) setInternalBrush(id);
    onActiveBrushChange?.(id);
  };

  // ---- transient UI state ---------------------------------------------------------------------------
  const [cells, setCells] = useState<Set<CellKey>>(new Set());
  const [regionId, setRegionId] = useState("");
  const [label, setLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [tool, setTool] = useState<HeatmapPainterTool>("paint");
  const [selFrame, setSelFrame] = useState<string | null>(null);
  const [draftFrame, setDraftFrame] = useState<HeatmapBounds | null>(null);
  const [hoverCursor, setHoverCursor] = useState("crosshair");
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "warn" } | null>(null);
  const [newBrushLabel, setNewBrushLabel] = useState("");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [panning, setPanning] = useState(false);

  // ---- camera ---------------------------------------------------------------------------------------
  const [cam, setCam] = useState<HeatmapCamera>(defaultCamera ?? { x: -50, y: -50, zoom: 0.5 });
  const camRef = useRef(cam);
  const setCamera = useCallback((next: HeatmapCamera) => {
    camRef.current = next;
    setCam(next);
  }, []);
  const [size, setSize] = useState({ w: 800, h: typeof height === "number" ? height : 560 });
  const sizeRef = useRef(size);
  const pendingFit = useRef(!defaultCamera);

  const hoveringRef = useRef(false);
  const panRef = useRef<{ x: number; y: number; origin: HeatmapCamera } | null>(null);
  const frameDrag = useRef<FrameDrag | null>(null);
  const paintState = useRef<PaintState | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fitTo = useCallback(
    (b: HeatmapBounds, pad = 48) => setCamera(fitCamera(b, sizeRef.current, pad)),
    [setCamera],
  );
  const zoomAt = useCallback(
    (factor: number, sx: number, sy: number) => setCamera(zoomCameraAt(camRef.current, factor, sx, sy)),
    [setCamera],
  );
  const fitContent = useCallback(() => fitTo(contentBounds(layoutRef.current) ?? [0, 0, 1200, 800]), [fitTo]);

  const say = (text: string, tone: "ok" | "warn" = "ok") => setNotice({ text, tone });

  // Measure the canvas viewport; the first real measurement also performs the initial fit.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const w = Math.round(wrap.clientWidth);
      const h = Math.round(wrap.clientHeight);
      if (w <= 0 || h <= 0) return; // not laid out (hidden, or no layout engine)
      const next = { w, h };
      sizeRef.current = next;
      setSize(next);
      if (pendingFit.current && w > 50 && h > 50) {
        pendingFit.current = false;
        fitContent();
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [fitContent]);

  // Tracing image.
  const bg = layout.background;
  const bgSrc = bg ? backgroundSrc(bg) : null;
  useEffect(() => {
    if (!bgSrc) {
      setImage(null);
      return;
    }
    let live = true;
    const img = new Image();
    img.onload = () => live && setImage(img);
    img.src = bgSrc;
    return () => {
      live = false;
    };
  }, [bgSrc]);

  const regionPaths = useMemo(() => {
    const map = new Map<string, Path2D>();
    if (typeof Path2D === "undefined") return map;
    for (const r of regions) map.set(r.id, new Path2D(outlinePath(r.rects)));
    return map;
  }, [regions]);

  // ---- drawing --------------------------------------------------------------------------------------
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
    const pw = Math.round(size.w * dpr);
    const ph = Math.round(size.h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // jsdom: no canvas — interaction state is tracked independently of painting
    const surface = readToken(canvas, "--rebar-color-bg-primary", "#ffffff");
    const gridColor = readToken(canvas, "--rebar-color-border", "#c9c9c9");
    const axisColor = readToken(canvas, "--rebar-color-border-strong", "#333333");
    const frameColor = readToken(canvas, "--rebar-color-warning", "#fa541c");
    const frameText = readToken(canvas, "--rebar-color-primary-text", "#ffffff");
    const fontFamily = readToken(canvas, "--rebar-font-family-sans", "system-ui, sans-serif");

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = surface;
    ctx.fillRect(0, 0, pw, ph);

    const z = cam.zoom;
    const px = 1 / z; // one screen pixel, in world units — line widths are specified in screen px
    ctx.setTransform(dpr * z, 0, 0, dpr * z, -cam.x * z * dpr, -cam.y * z * dpr);
    const vx0 = cam.x;
    const vy0 = cam.y;
    const vx1 = cam.x + size.w / z;
    const vy1 = cam.y + size.h / z;

    if (image && bg) {
      ctx.globalAlpha = bg.opacity;
      ctx.drawImage(image, bg.x, bg.y, image.naturalWidth * bg.scale, image.naturalHeight * bg.scale);
      ctx.globalAlpha = 1;
    }

    // Grid (skipped when cells would be too small on screen to be useful), plus the world axes.
    if (cellSize * z >= 6) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = px;
      ctx.beginPath();
      for (let x = Math.floor(vx0 / cellSize) * cellSize; x <= vx1; x += cellSize) {
        ctx.moveTo(x, vy0);
        ctx.lineTo(x, vy1);
      }
      for (let y = Math.floor(vy0 / cellSize) * cellSize; y <= vy1; y += cellSize) {
        ctx.moveTo(vx0, y);
        ctx.lineTo(vx1, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = px;
    ctx.beginPath();
    ctx.moveTo(0, vy0);
    ctx.lineTo(0, vy1);
    ctx.moveTo(vx0, 0);
    ctx.lineTo(vx1, 0);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // One outline round each region's whole union (not one box per stored rect), so a region painted
    // as several stacked rows reads as a single shape. A region being re-painted is drawn as the draft cells instead.
    for (const region of regions) {
      if (region.id === editingId) continue;
      const color = brushMap[region.kind]?.color ?? "#555555";
      const path = regionPaths.get(region.id);
      const lit = region.id === highlightId;
      ctx.globalAlpha = lit ? 0.33 : 0.13;
      ctx.fillStyle = color;
      for (const [x0, y0, x1, y1] of region.rects) ctx.fillRect(x0 - 0.25, y0 - 0.25, x1 - x0 + 0.5, y1 - y0 + 0.5);
      ctx.globalAlpha = 1;
      if (path) {
        ctx.strokeStyle = color;
        ctx.lineWidth = (lit ? 4 : 1.5) * px;
        ctx.lineJoin = "round";
        ctx.stroke(path);
      }
    }

    ctx.globalAlpha = 0.45;
    ctx.fillStyle = (brushId && brushMap[brushId]?.color) || frameColor;
    for (const key of cells) {
      const [cx, cy] = parseCellKey(key);
      ctx.fillRect(cx * cellSize, cy * cellSize, cellSize, cellSize);
    }
    ctx.globalAlpha = 1;

    const ps = paintState.current;
    if (ps?.marqueeStart && ps.marqueeNow) {
      const [ax, ay] = ps.marqueeStart;
      const [bx, by] = ps.marqueeNow;
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 2 * px;
      ctx.setLineDash([6 * px, 4 * px]);
      ctx.strokeRect(Math.min(ax, bx) * cellSize, Math.min(ay, by) * cellSize, (Math.abs(bx - ax) + 1) * cellSize, (Math.abs(by - ay) + 1) * cellSize);
      ctx.setLineDash([]);
    }

    // Frames: dashed rectangles with their names; the selected one shows resize handles.
    const drawFrame = (b: HeatmapBounds, name: string | null, selected: boolean) => {
      const [x0, y0, x1, y1] = b;
      if (selected) {
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = frameColor;
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = (selected ? 3 : 2) * px;
      ctx.setLineDash([9 * px, 5 * px]);
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      ctx.setLineDash([]);
      if (name) {
        ctx.font = `600 ${13 * px}px ${fontFamily}`;
        const textW = ctx.measureText(name).width;
        ctx.fillStyle = frameColor;
        ctx.fillRect(x0, y0 - 20 * px, textW + 12 * px, 20 * px);
        ctx.fillStyle = frameText;
        ctx.textBaseline = "middle";
        ctx.fillText(name, x0 + 6 * px, y0 - 10 * px);
      }
      if (selected) {
        const s = HANDLE_PX * px;
        for (const [hx, hy] of Object.values(handlePoints(b))) {
          ctx.fillStyle = surface;
          ctx.fillRect(hx - s / 2, hy - s / 2, s, s);
          ctx.strokeStyle = frameColor;
          ctx.lineWidth = 1.5 * px;
          ctx.strokeRect(hx - s / 2, hy - s / 2, s, s);
        }
      }
    };
    for (const f of frames) drawFrame(f.crop, f.title, f.id === selFrame);
    if (draftFrame) drawFrame(draftFrame, null, false);
  }, [size, cam, image, bg, cellSize, regions, editingId, brushMap, regionPaths, highlightId, brushId, cells, frames, selFrame, draftFrame]);

  useEffect(() => void draw(), [draw]);

  // ---- wheel: scroll pans, Ctrl/Cmd+scroll (or pinch) zooms at the cursor -------------------------------
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        zoomAt(wheelZoomFactor(e.deltaY), e.clientX - rect.left, e.clientY - rect.top);
      } else {
        setCamera(scrollCamera(camRef.current, e.shiftKey ? e.deltaY : e.deltaX, e.shiftKey ? 0 : e.deltaY));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt, setCamera]);

  // ---- space to pan ----------------------------------------------------------------------------------
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || isTyping(e.target)) return;
      if (hoveringRef.current) {
        // Over the canvas: stop the page scrolling, and drop focus from any button so the key
        // doesn't also "click" it on release.
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
      setSpaceDown(true);
    };
    const release = () => {
      setSpaceDown(false);
      panRef.current = null;
      setPanning(false);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") release();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", release);
    };
  }, []);

  // ---- frames ----------------------------------------------------------------------------------------
  const setFrameCrop = useCallback(
    (id: string, crop: HeatmapBounds) => update((l) => ({ ...l, frames: l.frames.map((f) => (f.id === id ? { ...f, crop } : f)) })),
    [update],
  );

  const addFrame = useCallback(
    (crop: HeatmapBounds) => {
      const current = layoutRef.current.frames;
      const n = current.length + 1;
      const id = slugOf(`frame-${n}`, new Set(current.map((f) => f.id)), "frame");
      update((l) => ({ ...l, frames: [...l.frames, { id, title: `Frame ${n}`, crop }] }));
      setSelFrame(id);
      setTool("frame");
    },
    [update],
  );

  // A frame around what's currently on screen (a sensible starting point to then adjust).
  const addFrameInView = () => {
    const c = camRef.current;
    const { w, h } = sizeRef.current;
    const step = layoutRef.current.cellSize;
    addFrame([
      snap(c.x + (w / c.zoom) * 0.1, step),
      snap(c.y + (h / c.zoom) * 0.1, step),
      snap(c.x + (w / c.zoom) * 0.9, step),
      snap(c.y + (h / c.zoom) * 0.9, step),
    ]);
  };

  const deleteFrame = useCallback(
    (id: string) => {
      update((l) => ({ ...l, frames: l.frames.filter((f) => f.id !== id) }));
      setSelFrame((cur) => (cur === id ? null : cur));
    },
    [update],
  );

  // ---- pointer input ---------------------------------------------------------------------------------
  const worldAt = (e: ReactPointerEvent): [number, number] => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const sx = Number.isFinite(e.clientX) ? e.clientX - rect.left : 0;
    const sy = Number.isFinite(e.clientY) ? e.clientY - rect.top : 0;
    return screenToWorld(camRef.current, sx, sy);
  };

  const strokeTo = (cx: number, cy: number, mode: "paint" | "erase", from?: [number, number]) => {
    const targets = lineCells(from ?? [cx, cy], [cx, cy]);
    setCells((prev) => applyCells(prev, targets, mode));
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button === 2) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (spaceDown || e.button === 1) {
      e.preventDefault();
      panRef.current = { x: e.clientX, y: e.clientY, origin: camRef.current };
      setPanning(true);
      return;
    }
    const [wx, wy] = worldAt(e);

    if (tool === "frame") {
      const selected = frames.find((f) => f.id === selFrame);
      const handle = selected ? hitHandle(selected.crop, wx, wy, camRef.current.zoom) : null;
      if (selected && handle) {
        frameDrag.current = { mode: "resize", handle, start: [wx, wy], orig: selected.crop, id: selected.id };
        return;
      }
      const inside = frameAt(frames, wx, wy);
      if (inside) {
        setSelFrame(inside.id);
        frameDrag.current = { mode: "move", start: [wx, wy], orig: inside.crop, id: inside.id };
        return;
      }
      setSelFrame(null);
      const start: [number, number] = [snap(wx, cellSize), snap(wy, cellSize)];
      frameDrag.current = { mode: "draw", start, orig: [start[0], start[1], start[0], start[1]], id: null };
      setDraftFrame([start[0], start[1], start[0], start[1]]);
      return;
    }

    const cell = cellAt(wx, wy, cellSize);
    const mode: "paint" | "erase" = cells.has(cellKey(cell[0], cell[1])) ? "erase" : "paint";
    if (e.shiftKey) {
      paintState.current = { mode, marqueeStart: cell, marqueeNow: cell, last: cell };
    } else {
      paintState.current = { mode, marqueeStart: null, marqueeNow: null, last: cell };
      strokeTo(cell[0], cell[1], mode);
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const pan = panRef.current;
    if (pan) {
      setCamera(dragCamera(pan.origin, e.clientX - pan.x, e.clientY - pan.y));
      return;
    }
    const [wx, wy] = worldAt(e);

    const drag = frameDrag.current;
    if (drag) {
      if (drag.mode === "draw") {
        setDraftFrame(spanBounds(drag.start, [snap(wx, cellSize), snap(wy, cellSize)]));
      } else if (drag.mode === "move" && drag.id) {
        setFrameCrop(drag.id, moveBounds(drag.orig, snap(wx - drag.start[0], cellSize), snap(wy - drag.start[1], cellSize)));
      } else if (drag.mode === "resize" && drag.id && drag.handle) {
        setFrameCrop(drag.id, resizeBounds(drag.orig, drag.handle, snap(wx, cellSize), snap(wy, cellSize), cellSize));
      }
      return;
    }

    if (tool === "frame") {
      // Hover feedback: resize cursors over the selected frame's handles, a move cursor inside any frame.
      const selected = frames.find((f) => f.id === selFrame);
      const handle = selected ? hitHandle(selected.crop, wx, wy, camRef.current.zoom) : null;
      const next = handle ? HANDLE_CURSOR[handle] : frameAt(frames, wx, wy) ? "move" : "crosshair";
      if (next !== hoverCursor) setHoverCursor(next);
      return;
    }

    const ps = paintState.current;
    if (!ps) return;
    const cell = cellAt(wx, wy, cellSize);
    if (ps.marqueeStart) {
      ps.marqueeNow = cell;
      draw();
    } else {
      strokeTo(cell[0], cell[1], ps.mode, ps.last);
      ps.last = cell;
    }
  };

  const onPointerUp = () => {
    if (panRef.current) {
      panRef.current = null;
      setPanning(false);
      return;
    }
    const drag = frameDrag.current;
    if (drag) {
      frameDrag.current = null;
      if (drag.mode === "draw" && draftFrame) {
        if (draftFrame[2] - draftFrame[0] >= cellSize * 2 && draftFrame[3] - draftFrame[1] >= cellSize * 2) addFrame(draftFrame);
        setDraftFrame(null);
      }
      return;
    }
    const ps = paintState.current;
    if (ps?.marqueeStart && ps.marqueeNow) {
      const targets = boxCells(ps.marqueeStart, ps.marqueeNow);
      setCells((prev) => applyCells(prev, targets, ps.mode));
    }
    paintState.current = null;
  };

  const onCanvasKeyDown = (e: ReactKeyboardEvent) => {
    const c = camRef.current;
    switch (e.key) {
      case "ArrowLeft":
        setCamera(scrollCamera(c, -KEY_PAN_PX, 0));
        break;
      case "ArrowRight":
        setCamera(scrollCamera(c, KEY_PAN_PX, 0));
        break;
      case "ArrowUp":
        setCamera(scrollCamera(c, 0, -KEY_PAN_PX));
        break;
      case "ArrowDown":
        setCamera(scrollCamera(c, 0, KEY_PAN_PX));
        break;
      case "+":
      case "=":
        zoomAt(1.4, sizeRef.current.w / 2, sizeRef.current.h / 2);
        break;
      case "-":
        zoomAt(1 / 1.4, sizeRef.current.w / 2, sizeRef.current.h / 2);
        break;
      case "0":
        fitContent();
        break;
      case "Delete":
      case "Backspace":
        if (tool === "frame" && selFrame) deleteFrame(selFrame);
        else return;
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  // ---- regions ---------------------------------------------------------------------------------------
  const idTaken = regions.some((r) => r.id === regionId.trim() && r.id !== editingId);
  const trimmedId = regionId.trim();
  const canCreate = cells.size > 0 && trimmedId.length > 0 && brushId !== null;

  const resetDraft = () => {
    setCells(new Set());
    setRegionId("");
    setLabel("");
    setEditingId(null);
  };

  const createRegion = () => {
    if (cells.size === 0) return say("Paint at least one cell first.", "warn");
    if (!trimmedId) return say("Give the region an id.", "warn");
    if (!brushId) return say("Pick or create a brush first.", "warn");
    const rects = cellsToRects(cells, cellSize);
    const current = layoutRef.current.regions;
    // Painted geometry replaces any previous shape for this id; other fields (memberIds, ...) survive.
    const base = current.find((r) => r.id === trimmedId) ?? current.find((r) => r.id === editingId);
    let region: HeatmapRegion = { ...base, id: trimmedId, kind: brushId, label: label.trim() || trimmedId, rects };
    const result = onCreateRegion?.(region);
    if (result === false) return say(`${trimmedId} was not created.`, "warn");
    if (result) region = result;
    update((l) => ({ ...l, regions: [...l.regions.filter((r) => r.id !== region.id && r.id !== editingId), region] }));
    resetDraft();
    say(`${region.id}: ${rects.length} rect${rects.length === 1 ? "" : "s"}.`);
  };

  const editRegion = (region: HeatmapRegion) => {
    setCells(rectsToCells(region.rects, cellSize));
    setRegionId(region.id);
    setLabel(region.label);
    setBrushId(region.kind);
    setEditingId(region.id);
    setTool("paint");
  };

  const deleteRegion = (id: string) => {
    update((l) => ({ ...l, regions: l.regions.filter((r) => r.id !== id) }));
    if (editingId === id) resetDraft();
  };

  const clearAllRegions = () => {
    update((l) => ({ ...l, regions: [] }));
    resetDraft();
    setHighlightId(null);
    say("All regions cleared.");
  };

  const changeCellSize = (next: number) => {
    // Painted-but-uncreated cells are in grid units, so convert through canvas units.
    setCells((prev) => rectsToCells(cellsToRects(prev, cellSize), next));
    update((l) => ({ ...l, cellSize: next }));
  };

  // ---- brushes ---------------------------------------------------------------------------------------
  const addBrush = () => {
    const name = newBrushLabel.trim();
    if (!name) return;
    const id = slugOf(name, new Set(brushes.map((b) => b.id)), "brush");
    const brush: HeatmapBrush = { id, label: name, color: BRUSH_SWATCHES[brushes.length % BRUSH_SWATCHES.length]! };
    update((l) => ({ ...l, brushes: [...brushesOf(l), brush] }));
    setBrushId(id);
    setNewBrushLabel("");
  };
  const patchBrush = (id: string, patch: Partial<HeatmapBrush>) =>
    update((l) => ({ ...l, brushes: brushesOf(l).map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
  const deleteBrush = (id: string) => {
    if (regions.some((r) => r.kind === id)) return say("Regions still use that brush — delete or re-brush them first.", "warn");
    update((l) => ({ ...l, brushes: brushesOf(l).filter((b) => b.id !== id) }));
    if (brushId === id) setBrushId(brushes.find((b) => b.id !== id)?.id ?? null);
  };

  // ---- tracing image ---------------------------------------------------------------------------------
  const patchBackground = (patch: Partial<HeatmapBackground>) =>
    update((l) => ({ ...l, background: l.background && { ...l.background, ...patch } }));

  const uploadBackground = async (file: File) => {
    if (!onUploadBackground) return;
    try {
      const res = await onUploadBackground(file);
      const dims = res.width && res.height ? { w: res.width, h: res.height } : await probeImage(file);
      const prev = layoutRef.current.background;
      const next: HeatmapBackground = {
        x: prev?.x ?? 0,
        y: prev?.y ?? 0,
        scale: prev?.scale ?? 1,
        opacity: prev?.opacity ?? 0.6,
        showInPlot: prev?.showInPlot,
        url: res.url,
        version: res.version,
        width: dims?.w,
        height: dims?.h,
      };
      update((l) => ({ ...l, background: next }));
      if (dims) fitTo([next.x, next.y, next.x + dims.w * next.scale, next.y + dims.h * next.scale]);
      say("Image placed — tune its position, scale and opacity.");
    } catch (err) {
      say(err instanceof Error ? err.message : "Upload failed.", "warn");
    }
  };

  const removeBackground = async () => {
    try {
      await onRemoveBackground?.();
    } catch (err) {
      return say(err instanceof Error ? err.message : "Could not remove the image.", "warn");
    }
    update((l) => ({ ...l, background: undefined }));
  };

  // ---- render ----------------------------------------------------------------------------------------
  const sortedRegions = useMemo(() => [...regions].sort((a, b) => a.id.localeCompare(b.id)), [regions]);
  const canvasCursor = spaceDown && hovering ? (panning ? "grabbing" : "grab") : tool === "frame" ? hoverCursor : "crosshair";
  const listId = `${useIdSafe()}-ids`;

  const formContext: HeatmapPainterCellFormContext = {
    cellCount: cells.size,
    id: regionId,
    setId: setRegionId,
    label,
    setLabel,
    brushId,
    setBrushId,
    brushes,
    idTaken,
    editing: editingId !== null,
    canCreate,
    create: createRegion,
  };

  return (
    <div
      ref={rootRef}
      className={clsx("rebar-heatmap-painter", className)}
      data-rebar-component="heatmap-painter"
      data-rebar-state={tool}
      style={{ height: typeof height === "number" ? `${height}px` : height, ...style }}
      {...props}
    >
      <div data-rebar-part="stage" ref={wrapRef} className="rebar-heatmap-painter-stage">
        <canvas
          ref={canvasRef}
          data-rebar-part="canvas"
          className="rebar-heatmap-painter-canvas"
          role="application"
          aria-label={canvasLabel}
          tabIndex={0}
          style={{ width: size.w, height: size.h, cursor: canvasCursor }}
          onPointerEnter={() => {
            hoveringRef.current = true;
            setHovering(true);
          }}
          onPointerLeave={() => {
            hoveringRef.current = false;
            setHovering(false);
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={onCanvasKeyDown}
        />
        <div data-rebar-part="tools" role="group" aria-label="Tool" className="rebar-heatmap-painter-float rebar-heatmap-painter-tools">
          {(["paint", "frame"] as const).map((t) => (
            <Button key={t} size="sm" variant={tool === t ? "primary" : "secondary"} aria-pressed={tool === t} data-rebar-part={`tool-${t}`} onClick={() => setTool(t)}>
              {t === "paint" ? "Paint" : "Frame"}
            </Button>
          ))}
        </div>
        <div data-rebar-part="zoom" role="group" aria-label="Zoom" className="rebar-heatmap-painter-float rebar-heatmap-painter-zoom">
          <Button size="sm" variant="secondary" aria-label="Zoom out" onClick={() => zoomAt(1 / 1.4, size.w / 2, size.h / 2)}>
            −
          </Button>
          <span data-rebar-part="zoom-readout" className="rebar-heatmap-painter-zoom-readout">
            {Math.round(cam.zoom * 100)}%
          </span>
          <Button size="sm" variant="secondary" aria-label="Zoom in" onClick={() => zoomAt(1.4, size.w / 2, size.h / 2)}>
            +
          </Button>
          <Button size="sm" variant="secondary" onClick={fitContent}>
            Fit
          </Button>
        </div>
      </div>

      <div data-rebar-part="panel" className="rebar-heatmap-painter-panel">
        <div data-rebar-part="toolbar" className="rebar-heatmap-painter-row">
          <label className="rebar-heatmap-painter-field">
            <span>Grid</span>
            <select data-rebar-part="cell-size" value={cellSize} onChange={(e) => changeCellSize(Number(e.target.value))}>
              {(cellSizes.includes(cellSize) ? cellSizes : [...cellSizes, cellSize].sort((a, b) => a - b)).map((s) => (
                <option key={s} value={s}>
                  {s}-unit cells
                </option>
              ))}
            </select>
          </label>
          <Button size="sm" variant="secondary" disabled={cells.size === 0} onClick={resetDraft}>
            Clear painted ({cells.size})
          </Button>
          <ConfirmButton label="Clear all" confirmLabel="Confirm" subject={`regions (${regions.length})`} disabled={regions.length === 0} onConfirm={clearAllRegions} />
        </div>

        <p data-rebar-part="notice" role="status" className="rebar-heatmap-painter-notice" data-rebar-state={notice?.tone ?? "none"}>
          {notice?.text ?? ""}
        </p>

        <section data-rebar-part="cell-form" className="rebar-heatmap-painter-section" aria-label="Name the painted area">
          <strong>{editingId ? `Re-painting ${editingId}` : "New region from painted area"}</strong>
          {renderCellForm ? (
            renderCellForm(formContext)
          ) : (
            <>
              <Input
                size="sm"
                aria-label="Region id"
                placeholder="Region id"
                value={regionId}
                list={idSuggestions && idSuggestions.length > 0 ? listId : undefined}
                onChange={(e) => setRegionId(e.target.value)}
              />
              {idSuggestions && idSuggestions.length > 0 ? (
                <datalist id={listId}>
                  {idSuggestions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              ) : null}
              {idTaken ? <small data-rebar-part="id-taken">An existing region has this id — creating replaces its shape.</small> : null}
              <Input size="sm" aria-label="Region label" placeholder="Label (defaults to the id)" value={label} onChange={(e) => setLabel(e.target.value)} />
              <select aria-label="Brush" data-rebar-part="brush-select" value={brushId ?? ""} onChange={(e) => setBrushId(e.target.value || null)}>
                {brushes.length === 0 ? <option value="">Add a brush first</option> : null}
                {brushes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
              <Button size="sm" disabled={!canCreate} onClick={createRegion}>
                {editingId ? "Update region" : "Create region"}
              </Button>
            </>
          )}
        </section>

        <details open data-rebar-part="frames-section" className="rebar-heatmap-painter-section">
          <summary>Frames ({frames.length})</summary>
          <small>A frame is the rectangle of the canvas the plot shows. Use the Frame tool to drag one out; move it by its body, resize it by its handles, Delete removes it.</small>
          {frames.map((f: HeatmapFrame) => (
            <div key={f.id} data-rebar-part="frame-row" data-rebar-state={f.id === selFrame ? "selected" : "idle"} className="rebar-heatmap-painter-row">
              <Input
                size="sm"
                aria-label={`Frame title ${f.title}`}
                value={f.title}
                onFocus={() => {
                  setSelFrame(f.id);
                  setTool("frame");
                }}
                onChange={(e) => update((l) => ({ ...l, frames: l.frames.map((x) => (x.id === f.id ? { ...x, title: e.target.value } : x)) }))}
              />
              <Button size="sm" variant="secondary" aria-label={`Go to ${f.title}`} onClick={() => fitTo(f.crop)}>
                Go
              </Button>
              <ConfirmButton label="Delete" subject={`frame ${f.title}`} onConfirm={() => deleteFrame(f.id)} />
            </div>
          ))}
          <Button size="sm" variant="secondary" onClick={addFrameInView}>
            Add a frame around what&apos;s on screen
          </Button>
        </details>

        <details open data-rebar-part="brushes-section" className="rebar-heatmap-painter-section">
          <summary>Brushes ({brushes.length})</summary>
          <small>Your own categories for this layout. Pick the active brush for new regions.</small>
          {brushes.map((b) => (
            <div key={b.id} data-rebar-part="brush-row" data-rebar-state={b.id === brushId ? "active" : "idle"} className="rebar-heatmap-painter-brush">
              <div className="rebar-heatmap-painter-row">
                <input type="radio" name="rebar-heatmap-painter-brush" aria-label={`Paint with ${b.label}`} checked={b.id === brushId} onChange={() => setBrushId(b.id)} />
                <input type="color" aria-label={`${b.label} colour`} value={/^#[0-9a-f]{6}$/i.test(b.color) ? b.color : "#555555"} onChange={(e) => patchBrush(b.id, { color: e.target.value })} />
                <Input size="sm" aria-label={`Brush name ${b.label}`} value={b.label} onChange={(e) => patchBrush(b.id, { label: e.target.value })} />
                <ConfirmButton label="Delete" subject={`brush ${b.label}`} onConfirm={() => deleteBrush(b.id)} />
              </div>
              <div className="rebar-heatmap-painter-row">
                <label className="rebar-heatmap-painter-check">
                  <input type="checkbox" checked={b.showLabel !== false} onChange={(e) => patchBrush(b.id, { showLabel: e.target.checked })} />
                  labels
                </label>
                <label className="rebar-heatmap-painter-check">
                  <input type="checkbox" checked={b.defaultVisible !== false} onChange={(e) => patchBrush(b.id, { defaultVisible: e.target.checked })} />
                  shown by default
                </label>
                <small>{regions.filter((r) => r.kind === b.id).length} regions</small>
              </div>
            </div>
          ))}
          <div className="rebar-heatmap-painter-row">
            <Input
              size="sm"
              aria-label="New brush name"
              placeholder="New brush name"
              value={newBrushLabel}
              onChange={(e) => setNewBrushLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addBrush();
              }}
            />
            <Button size="sm" variant="secondary" disabled={!newBrushLabel.trim()} onClick={addBrush}>
              Add brush
            </Button>
          </div>
        </details>

        <details data-rebar-part="image-section" className="rebar-heatmap-painter-section">
          <summary>Tracing image</summary>
          {onUploadBackground ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/*"
                hidden
                data-rebar-part="image-input"
                aria-label="Tracing image file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadBackground(file);
                  e.target.value = "";
                }}
              />
              <div className="rebar-heatmap-painter-row">
                <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  {bg ? "Replace image" : "Upload image"}
                </Button>
                {bg ? (
                  <Button size="sm" variant="secondary" onClick={() => void removeBackground()}>
                    Remove image
                  </Button>
                ) : null}
              </div>
            </>
          ) : bg ? (
            <Button size="sm" variant="secondary" onClick={() => void removeBackground()}>
              Remove image
            </Button>
          ) : (
            <small>No image storage is configured for this painter.</small>
          )}
          {bg ? (
            <>
              <label className="rebar-heatmap-painter-field">
                <span>Opacity</span>
                <input type="range" min={0} max={1} step={0.05} value={bg.opacity} onChange={(e) => patchBackground({ opacity: Number(e.target.value) })} />
              </label>
              <label className="rebar-heatmap-painter-field">
                <span>Scale</span>
                <input type="range" min={0.05} max={3} step={0.01} value={bg.scale} onChange={(e) => patchBackground({ scale: Number(e.target.value) })} />
              </label>
              <div className="rebar-heatmap-painter-row">
                <label className="rebar-heatmap-painter-field">
                  <span>X</span>
                  <input type="number" value={bg.x} onChange={(e) => patchBackground({ x: Number(e.target.value) || 0 })} />
                </label>
                <label className="rebar-heatmap-painter-field">
                  <span>Y</span>
                  <input type="number" value={bg.y} onChange={(e) => patchBackground({ y: Number(e.target.value) || 0 })} />
                </label>
              </div>
              <label className="rebar-heatmap-painter-check">
                <input type="checkbox" checked={bg.showInPlot === true} onChange={(e) => patchBackground({ showInPlot: e.target.checked })} />
                Include this image in the final plot
              </label>
              <small>Off: a tracing aid only. On: the plot draws it behind the shaded regions at the same position, scale and opacity.</small>
            </>
          ) : null}
        </details>

        <details open data-rebar-part="regions-section" className="rebar-heatmap-painter-section">
          <summary>Regions ({sortedRegions.length})</summary>
          {sortedRegions.map((region) => (
            <div
              key={region.id}
              data-rebar-part="region-row"
              data-region={region.id}
              className="rebar-heatmap-painter-row"
              onPointerEnter={() => setHighlightId(region.id)}
              onPointerLeave={() => setHighlightId(null)}
            >
              <span className="rebar-heatmap-painter-swatch" style={{ background: brushMap[region.kind]?.color }} aria-hidden="true" />
              <span className="rebar-heatmap-painter-region-id" title={region.id}>
                {region.id}
              </span>
              <small>{brushMap[region.kind]?.label ?? region.kind}</small>
              <Button size="sm" variant="secondary" aria-label={`Edit ${region.id}`} onClick={() => editRegion(region)}>
                Edit
              </Button>
              <ConfirmButton label="Delete" subject={region.id} onConfirm={() => deleteRegion(region.id)} />
            </div>
          ))}
        </details>
      </div>
    </div>
  );
}

function useIdSafe(): string {
  return `rebar-heatmap-painter-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
