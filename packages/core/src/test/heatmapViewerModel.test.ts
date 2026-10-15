import { describe, expect, it } from "vitest";
import {
  DEFAULT_BANDED_SCALE,
  bandColorFor,
  bandIndexFor,
  brushGroupsOf,
  chipBrushes,
  defaultVisibleBrushesIn,
  frameFor,
  groupMilestones,
  metricValue,
  shadeOptionsOf,
  shadeRegions,
  shadeValue,
  sumCells,
} from "../components/heatmapViewerModel";
import type { HeatmapViewerMetric } from "../components/heatmapViewerModel";
import type { HeatmapLayout, HeatmapRegion } from "../components/heatmapGeometry";

const PROGRESS: HeatmapViewerMetric = { id: "p", label: "Progress", kind: "progress" };
const COUNT: HeatmapViewerMetric = { id: "c", label: "Items", kind: "count", unit: "items" };

describe("sumCells / metricValue", () => {
  it("sums done/expected pairs and counts, and is undefined when no region has data", () => {
    expect(sumCells(PROGRESS, [{ done: 1, expected: 4 }, { done: 3, expected: 4 }, undefined])).toEqual({ done: 4, expected: 8 });
    expect(sumCells(COUNT, [2, 5, undefined])).toBe(7);
    expect(sumCells(PROGRESS, [undefined, undefined])).toBeUndefined();
  });

  it("shows a missing cell as a dash and a zero denominator as 'No data' — never as 0%", () => {
    expect(metricValue(PROGRESS, undefined).text).toBe("—");
    expect(metricValue(PROGRESS, { done: 0, expected: 0 }).text).toBe("No data");
    expect(metricValue(PROGRESS, { done: 0, expected: 10 })).toMatchObject({ text: "0.0 %", share: 0 });
  });

  it("reports a progress figure with its done / expected detail and a count with its unit", () => {
    expect(metricValue(PROGRESS, { done: 182, expected: 250 })).toEqual({ text: "72.8 %", detail: "182 / 250", share: 0.728 });
    expect(metricValue(COUNT, 1204)).toEqual({ text: "1,204 items", raw: 1204 });
  });
});

describe("shadeValue / shadeRegions", () => {
  const regions: HeatmapRegion[] = [
    { id: "a", kind: "k", label: "A", rects: [[0, 0, 1, 1]] },
    { id: "b", kind: "k", label: "B", rects: [[1, 0, 2, 1]], memberIds: ["b1", "b2"] },
    { id: "c", kind: "k", label: "C", rects: [[2, 0, 3, 1]] },
  ];

  it("gives a proportion a share and a missing cell a null share", () => {
    expect(shadeValue(PROGRESS, { done: 1, expected: 2 }).share).toBe(0.5);
    expect(shadeValue(PROGRESS, undefined)).toEqual({ share: null, text: "no data" });
  });

  it("sums a region's member ids and leaves a region with no data hatched", () => {
    const cells: Record<string, { done: number; expected: number }> = { a: { done: 1, expected: 2 }, b1: { done: 1, expected: 4 }, b2: { done: 3, expected: 4 } };
    const { values, legend } = shadeRegions(regions, PROGRESS, (ids) => sumCells(PROGRESS, ids.map((id) => cells[id])));
    expect(values.a!.share).toBe(0.5);
    expect(values.b!.share).toBe(0.5);
    expect(values.c!.share).toBeNull();
    expect(legend).toEqual({ kind: "proportion" });
  });

  it("places counts against the biggest count in view", () => {
    const counts: Record<string, number> = { a: 5, b1: 3, b2: 7, c: 0 };
    const { values, legend } = shadeRegions(regions, COUNT, (ids) => sumCells(COUNT, ids.map((id) => counts[id])));
    expect(legend).toEqual({ kind: "count", max: 10 });
    expect(values.b!.share).toBe(1);
    expect(values.a!.share).toBe(0.5);
    expect(values.c!.share).toBe(0);
  });
});

describe("brush groups and frames", () => {
  const layout: Pick<HeatmapLayout, "brushes" | "regions" | "frames" | "cellSize"> = {
    cellSize: 10,
    frames: [{ id: "left", title: "Left", crop: [0, 0, 100, 100] }],
    brushes: [
      { id: "wall", label: "Wall", color: "#000", group: "Fabric" },
      { id: "floor", label: "Floor", color: "#111", group: "Fabric", defaultVisible: false },
      { id: "pipe", label: "Pipe", color: "#222", group: "Services" },
      { id: "loose", label: "Loose", color: "#333" },
    ],
    regions: [
      { id: "w", kind: "wall", label: "W", rects: [[0, 0, 10, 10]] },
      { id: "p", kind: "pipe", label: "P", rects: [[0, 0, 10, 10]] },
      { id: "far", kind: "floor", label: "F", rects: [[500, 500, 510, 510]] },
    ],
  };

  it("lists groups in first-seen order, with 'Other' for an ungrouped brush, and none when no brush has one", () => {
    expect(brushGroupsOf(layout)).toEqual(["Fabric", "Services", "Other"]);
    expect(brushGroupsOf({ regions: [], brushes: [{ id: "x", label: "X", color: "#000" }] })).toEqual([]);
  });

  it("shows a group's default-visible brushes only, and offers chips only for brushes present in the frame", () => {
    expect([...defaultVisibleBrushesIn(layout, "Fabric")]).toEqual(["wall"]);
    expect([...defaultVisibleBrushesIn(layout, null)].sort()).toEqual(["loose", "pipe", "wall"]);
    const frame = frameFor(layout, "left");
    expect(chipBrushes(layout, frame, "Fabric").map((b) => b.id)).toEqual(["wall"]);
    expect(chipBrushes(layout, frame, null).map((b) => b.id)).toEqual(["wall", "pipe"]);
  });

  it("falls back to the first frame (or a fitted whole drawing) for an unknown id", () => {
    expect(frameFor(layout, "nope").id).toBe("left");
    expect(frameFor({ ...layout, frames: [] }, null).id).toBe("all");
  });
});

describe("shadeOptionsOf", () => {
  const metrics: HeatmapViewerMetric[] = [PROGRESS, COUNT, { id: "z", label: "Zed", kind: "count" }];
  it("uses the shade-flagged panel metrics in order, ignoring unknown ids", () => {
    const opts = shadeOptionsOf({
      metrics,
      metricsPanel: { placement: "footer", items: [{ type: "metric", metric: "c", shade: true }, { type: "metric", metric: "ghost", shade: true }, { type: "metric", metric: "p", shade: true }, { type: "metric", metric: "z" }] },
    });
    expect(opts.map((o) => o.id)).toEqual(["c", "p"]);
  });
  it("offers every metric when the panel flags none", () => {
    expect(shadeOptionsOf({ metrics }).map((o) => o.id)).toEqual(["p", "c", "z"]);
  });
});

describe("banded scale", () => {
  it("matches exact 0% and 100% bands before the open-ended ones", () => {
    expect(bandIndexFor(DEFAULT_BANDED_SCALE, 0)).toBe(0);
    expect(bandIndexFor(DEFAULT_BANDED_SCALE, 1)).toBe(5);
    expect(DEFAULT_BANDED_SCALE.bands[bandIndexFor(DEFAULT_BANDED_SCALE, 0.1)]!.label).toBe("<25%");
    expect(DEFAULT_BANDED_SCALE.bands[bandIndexFor(DEFAULT_BANDED_SCALE, 0.25)]!.label).toBe("25-50%");
    expect(DEFAULT_BANDED_SCALE.bands[bandIndexFor(DEFAULT_BANDED_SCALE, 0.99)]!.label).toBe("75-100%");
    expect(bandColorFor(DEFAULT_BANDED_SCALE, 1)).toBe("#2a6f3a");
  });
});

describe("groupMilestones", () => {
  const dates = Array.from({ length: 101 }, (_, i) => `d${i}`);
  it("merges markers closer than the gap into one at their average position, and drops dates not on the slider", () => {
    const groups = groupMilestones(dates, [
      { date: "d10", label: "A" },
      { date: "d11", label: "B" },
      { date: "d50", label: "C" },
      { date: "elsewhere", label: "ghost" },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.items.map((m) => m.label)).toEqual(["A", "B"]);
    expect(groups[0]!.at).toBeCloseTo(0.105, 5);
    expect(groups[1]!.at).toBeCloseTo(0.5, 5);
  });
});
