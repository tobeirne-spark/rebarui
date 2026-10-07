import { describe, expect, it } from "vitest";
import {
  applyCells,
  backgroundSrc,
  boxCells,
  brushesInFrame,
  brushesOf,
  cellAt,
  cellKey,
  cellsToRects,
  clampZoom,
  contentBounds,
  defaultVisibleBrushes,
  dragCamera,
  fitCamera,
  frameAt,
  framesOf,
  handlePoints,
  hitHandle,
  labelLayout,
  lineCells,
  MAX_ZOOM,
  MIN_ZOOM,
  moveBounds,
  outlinePath,
  parseCellKey,
  rectsToCells,
  regionBounds,
  regionsInFrame,
  resizeBounds,
  screenToWorld,
  scrollCamera,
  shareOf,
  slugOf,
  snap,
  spanBounds,
  worldToScreen,
  zoomCameraAt,
} from "../components/heatmapGeometry";
import type { HeatmapBounds, HeatmapLayout } from "../components/heatmapGeometry";

const cellsOf = (...pairs: [number, number][]) => new Set(pairs.map(([x, y]) => cellKey(x, y)));
const area = (rects: HeatmapBounds[]) => rects.reduce((sum, [x0, y0, x1, y1]) => sum + (x1 - x0) * (y1 - y0), 0);

describe("cellsToRects / rectsToCells", () => {
  it("returns nothing for no cells", () => {
    expect(cellsToRects(new Set(), 10)).toEqual([]);
  });

  it("merges a horizontal run into one rect, scaled by the cell size", () => {
    expect(cellsToRects(cellsOf([0, 0], [1, 0], [2, 0]), 10)).toEqual([[0, 0, 30, 10]]);
  });

  it("merges rows with identical x-extent vertically", () => {
    expect(cellsToRects(cellsOf([0, 0], [1, 0], [0, 1], [1, 1]), 20)).toEqual([[0, 0, 40, 40]]);
  });

  it("keeps an L-shape as two rects (a run plus a differently-sized run)", () => {
    expect(cellsToRects(cellsOf([0, 0], [1, 0], [0, 1]), 10)).toEqual([
      [0, 0, 20, 10],
      [0, 10, 10, 20],
    ]);
  });

  it("splits a row with a gap into separate runs", () => {
    expect(cellsToRects(cellsOf([0, 0], [2, 0]), 10)).toEqual([
      [0, 0, 10, 10],
      [20, 0, 30, 10],
    ]);
  });

  it("does not merge across an empty row", () => {
    expect(cellsToRects(cellsOf([0, 0], [0, 2]), 10)).toEqual([
      [0, 0, 10, 10],
      [0, 20, 10, 30],
    ]);
  });

  it("handles negative coordinates", () => {
    expect(cellsToRects(cellsOf([-2, -1], [-1, -1]), 10)).toEqual([[-20, -10, 0, 0]]);
  });

  it("round-trips: rectsToCells(cellsToRects(c)) === c, for a blob with holes and a detached island", () => {
    const cells = new Set<string>();
    for (let y = -3; y < 4; y++) for (let x = -2; x < 5; x++) cells.add(cellKey(x, y));
    cells.delete(cellKey(0, 0)); // a hole
    cells.delete(cellKey(3, 1));
    cells.add(cellKey(9, 9)); // a detached island
    for (const size of [10, 20, 50]) {
      const rects = cellsToRects(cells, size);
      expect(rectsToCells(rects, size)).toEqual(cells);
      expect(area(rects)).toBe(cells.size * size * size); // no overlap, no loss
    }
  });

  it("rectsToCells rounds partially-covered cells outward", () => {
    expect(rectsToCells([[5, 5, 15, 15]], 10)).toEqual(cellsOf([0, 0], [1, 0], [0, 1], [1, 1]));
  });

  it("cellKey/parseCellKey round-trip", () => {
    expect(parseCellKey(cellKey(-4, 7))).toEqual([-4, 7]);
  });
});

describe("painting helpers", () => {
  it("cellAt floors world coordinates, including negatives", () => {
    expect(cellAt(0, 0, 10)).toEqual([0, 0]);
    expect(cellAt(9.99, 10, 10)).toEqual([0, 1]);
    expect(cellAt(-0.1, -10.1, 10)).toEqual([-1, -2]);
  });

  it("lineCells interpolates so a fast drag leaves no gaps", () => {
    expect(lineCells([0, 0], [4, 0])).toEqual([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]);
    expect(lineCells([0, 0], [3, 3])).toEqual([[0, 0], [1, 1], [2, 2], [3, 3]]);
  });

  it("boxCells covers the inclusive box in either corner order", () => {
    expect(boxCells([1, 1], [0, 0])).toHaveLength(4);
    expect(boxCells([0, 0], [2, 1])).toHaveLength(6);
  });

  it("applyCells paints and erases without mutating the input", () => {
    const base = cellsOf([0, 0]);
    const painted = applyCells(base, [[1, 0], [2, 0]], "paint");
    expect(painted).toEqual(cellsOf([0, 0], [1, 0], [2, 0]));
    expect(base.size).toBe(1);
    expect(applyCells(painted, [[1, 0]], "erase")).toEqual(cellsOf([0, 0], [2, 0]));
  });
});

describe("outlinePath", () => {
  it("is empty for no rects and for zero-area rects", () => {
    expect(outlinePath([])).toBe("");
    expect(outlinePath([[0, 0, 0, 10]])).toBe("");
  });

  it("draws one rect as a single closed rectangle", () => {
    expect(outlinePath([[0, 0, 10, 20]])).toBe("M0 0H10V20H0Z");
  });

  it("draws two stacked rects of equal width as ONE rectangle with no seam", () => {
    expect(outlinePath([[0, 0, 10, 10], [0, 10, 10, 20]])).toBe("M0 0H10V20H0Z");
  });

  it("draws an L-shape as one six-corner loop", () => {
    expect(outlinePath([[0, 0, 20, 10], [0, 10, 10, 20]])).toBe("M0 0H20V10H10V20H0Z");
  });

  it("draws a ring as an outer loop plus a hole loop (two sub-paths)", () => {
    const ring: HeatmapBounds[] = [
      [0, 0, 30, 10],
      [0, 20, 30, 30],
      [0, 10, 10, 20],
      [20, 10, 30, 20],
    ];
    const d = outlinePath(ring);
    expect(d.match(/M/g)).toHaveLength(2);
    expect(d.match(/Z/g)).toHaveLength(2);
    expect(d).toBe("M0 0H30V30H0ZM10 10V20H20V10Z");
  });

  it("draws two detached rects as two sub-paths", () => {
    expect(outlinePath([[0, 0, 10, 10], [20, 0, 30, 10]])).toBe("M0 0H10V10H0ZM20 0H30V10H20Z");
  });

  it("does not depend on the order or overlap of the input rects", () => {
    const a = outlinePath([[0, 0, 20, 10], [0, 10, 10, 20]]);
    expect(outlinePath([[0, 10, 10, 20], [0, 0, 20, 10]])).toBe(a);
    expect(outlinePath([[0, 0, 20, 10], [0, 0, 10, 20], [0, 10, 10, 20]])).toBe(a);
  });

  it("handles a plus shape (four reflex corners)", () => {
    const d = outlinePath([[10, 0, 20, 30], [0, 10, 30, 20]]);
    expect(d.match(/M/g)).toHaveLength(1);
    expect(d).toBe("M10 0H20V10H30V20H20V30H10V20H0V10H10Z");
  });

  it("closes diagonal-touching rects into well-formed loops (every sub-path closed)", () => {
    const d = outlinePath([[0, 0, 10, 10], [10, 10, 20, 20]]);
    expect(d.match(/M/g)?.length).toBe(d.match(/Z/g)?.length);
  });
});

describe("layout helpers", () => {
  const layout: HeatmapLayout = {
    cellSize: 10,
    brushes: [{ id: "a", label: "A", color: "#111111", defaultVisible: false }],
    frames: [],
    regions: [
      { id: "r1", kind: "a", label: "R1", rects: [[0, 0, 10, 10]] },
      { id: "r2", kind: "undeclared", label: "R2", rects: [[100, 100, 120, 120]] },
    ],
  };

  it("regionBounds is the union of every rect, or null", () => {
    expect(regionBounds(layout)).toEqual([0, 0, 120, 120]);
    expect(regionBounds({ regions: [] })).toBeNull();
  });

  it("contentBounds includes frames and the tracing image when its size is known", () => {
    const withExtras: HeatmapLayout = {
      ...layout,
      frames: [{ id: "f", title: "F", crop: [-50, -50, 5, 5] }],
      background: { url: "x.png", x: 200, y: 0, scale: 0.5, opacity: 1, width: 100, height: 40 },
    };
    expect(contentBounds(withExtras)).toEqual([-50, -50, 250, 120]);
    expect(contentBounds({ regions: [], frames: [], background: { url: "x", x: 0, y: 0, scale: 1, opacity: 1 } })).toBeNull();
  });

  it("framesOf returns real frames, else one 'Whole drawing' fitted with a margin", () => {
    expect(framesOf(layout)).toEqual([{ id: "all", title: "Whole drawing", crop: [-20, -20, 140, 140] }]);
    const frames = [{ id: "f", title: "F", crop: [0, 0, 1, 1] as HeatmapBounds }];
    expect(framesOf({ ...layout, frames })).toBe(frames);
    expect(framesOf({ regions: [], frames: [], cellSize: 10 })[0]!.crop).toEqual([-20, -20, 1020, 720]);
  });

  it("brushesOf adds a generated default for an undeclared kind", () => {
    const brushes = brushesOf(layout);
    expect(brushes.map((b) => b.id)).toEqual(["a", "undeclared"]);
    expect(brushes[1]!.label).toBe("undeclared");
  });

  it("brushesInFrame only offers brushes with a region inside the crop", () => {
    expect(brushesInFrame(layout, { id: "f", title: "F", crop: [0, 0, 50, 50] }).map((b) => b.id)).toEqual(["a"]);
  });

  it("defaultVisibleBrushes honours defaultVisible === false", () => {
    expect([...defaultVisibleBrushes(layout)]).toEqual(["undeclared"]);
  });

  it("regionsInFrame filters by crop overlap and brush visibility", () => {
    const frame = { id: "f", title: "F", crop: [0, 0, 500, 500] as HeatmapBounds };
    expect(regionsInFrame(layout, frame, new Set(["a", "undeclared"])).map((r) => r.id)).toEqual(["r1", "r2"]);
    expect(regionsInFrame(layout, frame, new Set(["a"])).map((r) => r.id)).toEqual(["r1"]);
    // Touching an edge is not overlap.
    expect(regionsInFrame(layout, { ...frame, crop: [10, 0, 50, 50] }, new Set(["a"]))).toEqual([]);
  });

  it("backgroundSrc adds ?v= only for a versioned, non-blob URL", () => {
    expect(backgroundSrc({ url: "/a.png" })).toBe("/a.png");
    expect(backgroundSrc({ url: "/a.png", version: 3 })).toBe("/a.png?v=3");
    expect(backgroundSrc({ url: "/a.png?x=1", version: 3 })).toBe("/a.png?x=1&v=3");
    expect(backgroundSrc({ url: "blob:abc", version: 3 })).toBe("blob:abc");
  });

  it("slugOf kebab-cases and de-duplicates", () => {
    expect(slugOf("Frame 2!", new Set(), "x")).toBe("frame-2");
    expect(slugOf("Frame 2", new Set(["frame-2", "frame-2-2"]), "x")).toBe("frame-2-3");
    expect(slugOf("!!!", new Set(), "brush")).toBe("brush");
  });
});

describe("shareOf", () => {
  it("is null for missing or non-positive-expected data (never 0%)", () => {
    expect(shareOf(undefined)).toBeNull();
    expect(shareOf({ done: 0, expected: 0 })).toBeNull();
    expect(shareOf({ done: 5, expected: -1 })).toBeNull();
    expect(shareOf(Number.NaN)).toBeNull();
  });

  it("computes and clamps to 0..1", () => {
    expect(shareOf({ done: 1, expected: 4 })).toBe(0.25);
    expect(shareOf({ done: 9, expected: 4 })).toBe(1);
    expect(shareOf(0)).toBe(0);
    expect(shareOf(0.4)).toBe(0.4);
    expect(shareOf(7)).toBe(1);
  });
});

describe("labelLayout", () => {
  it("keeps a wide shape's label horizontal and centred", () => {
    const l = labelLayout([0, 0, 100, 20], "Zone", 12);
    expect(l).toMatchObject({ cx: 50, cy: 10, rotate: false });
    expect(l.size).toBeLessThanOrEqual(12);
  });

  it("rotates a tall narrow strip", () => {
    expect(labelLayout([0, 0, 10, 100], "XP-1", 12).rotate).toBe(true);
  });

  it("shrinks to fit but never below 4", () => {
    expect(labelLayout([0, 0, 10, 10], "a very long label indeed", 20).size).toBe(4);
    expect(labelLayout([0, 0, 1000, 1000], "x", 20).size).toBe(20);
  });
});

describe("camera math", () => {
  it("clampZoom pins to the min/max", () => {
    expect(clampZoom(0.0001)).toBe(MIN_ZOOM);
    expect(clampZoom(100)).toBe(MAX_ZOOM);
    expect(clampZoom(1)).toBe(1);
  });

  it("screenToWorld and worldToScreen are inverses", () => {
    const cam = { x: -30, y: 12, zoom: 2.5 };
    const [wx, wy] = screenToWorld(cam, 100, 40);
    expect([wx, wy]).toEqual([10, 28]);
    expect(worldToScreen(cam, wx, wy)).toEqual([100, 40]);
  });

  it("zoomCameraAt keeps the world point under the cursor fixed", () => {
    const cam = { x: 10, y: 20, zoom: 1 };
    const next = zoomCameraAt(cam, 2, 200, 100);
    expect(next.zoom).toBe(2);
    expect(screenToWorld(next, 200, 100)).toEqual(screenToWorld(cam, 200, 100));
  });

  it("zoomCameraAt clamps at the zoom limit without drifting", () => {
    const next = zoomCameraAt({ x: 0, y: 0, zoom: MAX_ZOOM }, 4, 50, 50);
    expect(next.zoom).toBe(MAX_ZOOM);
    expect(next.x).toBeCloseTo(0);
  });

  it("scrollCamera moves by screen px divided by zoom", () => {
    expect(scrollCamera({ x: 0, y: 0, zoom: 2 }, 100, -40)).toEqual({ x: 50, y: -20, zoom: 2 });
  });

  it("dragCamera is a grab: the content follows the pointer", () => {
    const origin = { x: 100, y: 100, zoom: 2 };
    const next = dragCamera(origin, 20, -10);
    expect(next).toEqual({ x: 90, y: 105, zoom: 2 });
    // The world point that was under the pointer's start is now under the moved pointer.
    expect(worldToScreen(next, ...screenToWorld(origin, 0, 0))).toEqual([20, -10]);
  });

  it("fitCamera centres the bounds with padding", () => {
    const cam = fitCamera([0, 0, 100, 100], { w: 300, h: 200 }, 50);
    expect(cam.zoom).toBe(1); // limited by height: (200 - 100) / 100
    const [sx0, sy0] = worldToScreen(cam, 0, 0);
    const [sx1, sy1] = worldToScreen(cam, 100, 100);
    expect(sx0 + sx1).toBeCloseTo(300);
    expect(sy0 + sy1).toBeCloseTo(200);
  });

  it("fitCamera survives degenerate (zero-size) bounds", () => {
    const cam = fitCamera([5, 5, 5, 5], { w: 400, h: 300 });
    expect(Number.isFinite(cam.x)).toBe(true);
    expect(cam.zoom).toBeLessThanOrEqual(MAX_ZOOM);
  });
});

describe("frame hit-testing and resize math", () => {
  const frame: HeatmapBounds = [0, 0, 100, 60];

  it("handlePoints gives the 8 corner/edge midpoints", () => {
    const p = handlePoints(frame);
    expect(p.nw).toEqual([0, 0]);
    expect(p.n).toEqual([50, 0]);
    expect(p.se).toEqual([100, 60]);
    expect(p.w).toEqual([0, 30]);
  });

  it("hitHandle detects a handle within a screen-pixel reach that scales with zoom", () => {
    expect(hitHandle(frame, 100, 60, 1)).toBe("se");
    expect(hitHandle(frame, 104, 60, 1)).toBe("se"); // within ~8.1 world units at zoom 1
    expect(hitHandle(frame, 104, 60, 4)).toBeNull(); // only ~2 units of reach at zoom 4
    expect(hitHandle(frame, 50, 30, 1)).toBeNull();
    expect(hitHandle(frame, 50, 2, 1)).toBe("n");
  });

  it("resizeBounds moves only the named edges", () => {
    expect(resizeBounds(frame, "e", 150, 999, 10)).toEqual([0, 0, 150, 60]);
    expect(resizeBounds(frame, "nw", -20, -10, 10)).toEqual([-20, -10, 100, 60]);
    expect(resizeBounds(frame, "s", 999, 90, 10)).toEqual([0, 0, 100, 90]);
  });

  it("resizeBounds never shrinks below the minimum, and never inverts", () => {
    expect(resizeBounds(frame, "e", -500, 0, 10)).toEqual([0, 0, 10, 60]);
    expect(resizeBounds(frame, "w", 500, 0, 10)).toEqual([90, 0, 100, 60]);
    expect(resizeBounds(frame, "n", 0, 500, 10)).toEqual([0, 50, 100, 60]);
    expect(resizeBounds(frame, "se", -500, -500, 10)).toEqual([0, 0, 10, 10]);
  });

  it("moveBounds translates, spanBounds orders corners", () => {
    expect(moveBounds(frame, 10, -5)).toEqual([10, -5, 110, 55]);
    expect(spanBounds([30, 5], [10, 20])).toEqual([10, 5, 30, 20]);
  });

  it("snap rounds to the grid", () => {
    expect(snap(14, 10)).toBe(10);
    expect(snap(16, 10)).toBe(20);
    expect(snap(-6, 10)).toBe(-10);
  });

  it("frameAt returns the top-most (last) frame under a point, or undefined", () => {
    const frames = [
      { id: "a", title: "A", crop: [0, 0, 100, 100] as HeatmapBounds },
      { id: "b", title: "B", crop: [50, 50, 150, 150] as HeatmapBounds },
    ];
    expect(frameAt(frames, 60, 60)?.id).toBe("b");
    expect(frameAt(frames, 10, 10)?.id).toBe("a");
    expect(frameAt(frames, 500, 500)).toBeUndefined();
  });
});
