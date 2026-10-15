// A self-contained, made-up data source for `HeatmapViewer`: two fictional drawings (a campus site plan
// and a utilities run) and deterministic snapshots for them. It exists so the viewer renders and can be
// developed, documented and tested with no network or backend — and as the reference for what a real
// `HeatmapViewerSource` has to return. Every number is derived from a hash of (region, metric, date,
// filters), so the same query always gives the same answer.

import type { HeatmapBrush, HeatmapRegion } from "./heatmapGeometry";
import type {
  HeatmapMetricCell,
  HeatmapViewerDef,
  HeatmapViewerMetric,
  HeatmapViewerQuery,
  HeatmapViewerSnapshot,
  HeatmapViewerSource,
  HeatmapViewerSummary,
} from "./heatmapViewerModel";
import { DEFAULT_BANDED_SCALE } from "./heatmapViewerModel";

/** FNV-1a over a string, mapped to [0, 1). */
function unit(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 100000) / 100000;
}

const METRICS: HeatmapViewerMetric[] = [
  { id: "overall", label: "Overall complete", description: "Documents, attributes and photos together.", kind: "progress" },
  { id: "documents", label: "Documents", description: "Required documents received.", kind: "progress" },
  { id: "photos", label: "Photos", description: "Assets with an installed photo.", kind: "progress" },
  { id: "open-items", label: "Open items", description: "Punch items still open.", kind: "count" },
  { id: "assets", label: "Assets", description: "Assets recorded here.", kind: "count", unit: "assets" },
];

const CAMPUS_BRUSHES: HeatmapBrush[] = [
  { id: "building", label: "Building", color: "#0066cc", group: "Fabric" },
  { id: "outdoor", label: "Outdoor", color: "#2e7d32", group: "Fabric" },
  { id: "service", label: "Service", color: "#757575", group: "Services", showLabel: true },
];

const CAMPUS_REGIONS: HeatmapRegion[] = [
  { id: "north-block", kind: "building", label: "North Block", rects: [[0, 0, 220, 90]] },
  { id: "east-hall", kind: "building", label: "East Hall", rects: [[230, 0, 380, 90], [290, 90, 380, 190]] },
  { id: "library", kind: "building", label: "Library", rects: [[0, 100, 120, 190]] },
  { id: "courtyard", kind: "outdoor", label: "Courtyard", rects: [[130, 100, 280, 120], [130, 170, 280, 190], [130, 120, 150, 170], [260, 120, 280, 170]] },
  { id: "car-park", kind: "outdoor", label: "Car park", rects: [[0, 200, 280, 260]] },
  { id: "plant-room", kind: "service", label: "Plant", rects: [[290, 200, 380, 260]] },
  { id: "pump-house", kind: "service", label: "Pump house", rects: [[390, 0, 430, 40]] },
];

const CAMPUS: HeatmapViewerDef = {
  id: "campus",
  title: "Campus handover",
  cellSize: 10,
  brushes: CAMPUS_BRUSHES,
  frames: [
    { id: "site", title: "Whole site", crop: [-10, -10, 440, 270] },
    { id: "main", title: "Main buildings", crop: [-10, -10, 390, 200] },
  ],
  regions: CAMPUS_REGIONS,
  metrics: METRICS,
  metricsPanel: {
    placement: "footer",
    title: "Key numbers",
    defaultShade: "overall",
    items: [
      { type: "heading", text: "Collection" },
      { type: "metric", metric: "overall", shade: true },
      { type: "metric", metric: "documents", shade: true },
      { type: "metric", metric: "photos", shade: true },
      { type: "heading", text: "Register" },
      { type: "metric", metric: "open-items", shade: true },
      { type: "metric", metric: "assets" },
    ],
  },
  filters: [
    { id: "phase", label: "Phase", field: "phase" },
    { id: "contractor", label: "Contractor", field: "contractor" },
  ],
};

const UTILITIES_BRUSHES: HeatmapBrush[] = [{ id: "interval", label: "Interval", color: "#b26a00", showLabel: true }];

const UTILITIES: HeatmapViewerDef = {
  id: "utilities",
  title: "Utilities run",
  cellSize: 10,
  brushes: UTILITIES_BRUSHES,
  frames: [],
  regions: ["A", "B", "C", "D", "E", "F"].map((letter, i) => ({
    id: `run-${letter}`,
    kind: "interval",
    label: `Run ${letter}`,
    rects: [[i * 80, 0, i * 80 + 76, 50]] as [number, number, number, number][],
  })),
  metrics: METRICS.filter((m) => m.id === "overall" || m.id === "open-items"),
  metricsPanel: {
    placement: "popover",
    title: "This run",
    defaultShade: "overall",
    items: [
      { type: "metric", metric: "overall", shade: true },
      { type: "metric", metric: "open-items", shade: true },
    ],
  },
  scale: DEFAULT_BANDED_SCALE,
};

// A flat, side-on cutaway of an invented spaceship, drawn here as an inline SVG (no image file, nothing
// copied from anywhere) so the example shows a tracing image behind painted regions with no assets to host.
const SHIP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="620" height="260" viewBox="0 0 620 260">
<rect width="620" height="260" fill="#0b1630"/>
<g fill="#c9d3e6" stroke="#5c6b8a" stroke-width="3" stroke-linejoin="round">
<path d="M0 150 L40 80 L450 70 L580 135 L600 150 L580 165 L450 230 L40 220 Z"/>
<path d="M190 72 L250 22 L330 72 Z"/>
<path d="M190 228 L250 238 L330 228 Z"/>
</g>
<g stroke="#5c6b8a" stroke-width="2" fill="none"><path d="M395 71 V28"/><path d="M385 28 H405"/></g>
<g fill="#7fb4ff" stroke="#5c6b8a" stroke-width="2"><circle cx="470" cy="125" r="7"/><circle cx="495" cy="130" r="7"/><circle cx="360" cy="120" r="5"/><circle cx="385" cy="120" r="5"/></g>
</svg>`;
const SHIP_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SHIP_SVG)}`;

const SHIP_BRUSHES: HeatmapBrush[] = [
  { id: "deck", label: "Deck", color: "#3fa7ff", group: "Habitable" },
  { id: "machinery", label: "Machinery", color: "#ff8c42", group: "Machinery" },
  { id: "external", label: "External", color: "#9be564", group: "Machinery" },
];

const STARSHIP: HeatmapViewerDef = {
  id: "starship",
  title: "Starship Meridian",
  cellSize: 10,
  brushes: SHIP_BRUSHES,
  background: { url: SHIP_IMAGE, x: 0, y: 0, scale: 1, opacity: 1, showInPlot: true, width: 620, height: 260 },
  frames: [
    { id: "ship", title: "Whole ship", crop: [-10, 10, 610, 250] },
    { id: "bow", title: "Bow", crop: [420, 20, 610, 240] },
  ],
  regions: [
    { id: "bridge", kind: "deck", label: "Bridge", rects: [[440, 110, 520, 170]] },
    { id: "crew", kind: "deck", label: "Crew quarters", rects: [[300, 100, 430, 160], [340, 160, 430, 200]] },
    { id: "cargo", kind: "deck", label: "Cargo bay", rects: [[140, 100, 290, 200]] },
    { id: "airlock", kind: "deck", label: "Airlock", rects: [[440, 180, 500, 200]] },
    { id: "reactor", kind: "machinery", label: "Reactor", rects: [[60, 120, 130, 180]] },
    { id: "engines", kind: "machinery", label: "Engines", rects: [[10, 100, 50, 140], [10, 160, 50, 200]] },
    { id: "antenna", kind: "external", label: "Antenna", rects: [[380, 30, 410, 70]] },
  ],
  metrics: [
    { id: "systems", label: "Systems checked", description: "Systems signed off in this compartment.", kind: "progress" },
    { id: "repairs", label: "Repairs done", description: "Repair jobs finished.", kind: "progress" },
    { id: "faults", label: "Open faults", description: "Faults still open.", kind: "count", unit: "faults" },
  ],
  metricsPanel: {
    placement: "right",
    title: "Ship status",
    defaultShade: "systems",
    items: [
      { type: "metric", metric: "systems", shade: true },
      { type: "metric", metric: "repairs", shade: true },
      { type: "metric", metric: "faults", shade: true },
    ],
  },
  scale: DEFAULT_BANDED_SCALE,
};

const LIBRARY: HeatmapViewerDef[] = [CAMPUS, STARSHIP, UTILITIES];

/** Weekly snapshots, oldest first. Fixed so the stub never depends on today's date. */
const DATES = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 6, 14 + i * 7));
  return d.toISOString().slice(0, 10);
});

const FILTER_VALUES: Record<string, string[]> = {
  phase: ["Design", "Construction", "Commissioning"],
  contractor: ["Northline", "Eastbridge", "Halden & Co"],
};

/** How strongly the picked filter values narrow a region: each picked value keeps a hashed slice of the assets. */
function filterShare(regionId: string, filters: Record<string, string[]>): number {
  let share = 1;
  for (const [field, picked] of Object.entries(filters)) {
    if (!picked || picked.length === 0) continue;
    const all = FILTER_VALUES[field] ?? [];
    const kept = picked.reduce((sum, v) => sum + (0.2 + 0.6 * unit(`${field}:${v}:${regionId}`)), 0) / Math.max(1, all.length);
    share *= Math.min(1, kept);
  }
  return share;
}

function cellFor(def: HeatmapViewerDef, regionId: string, metric: HeatmapViewerMetric, dateIndex: number, filters: Record<string, string[]>): HeatmapMetricCell | undefined {
  // A couple of regions per drawing are left without a figure at all, to exercise the hatched "no data" state.
  if (def.regions.length > 5 && unit(`gap:${def.id}:${regionId}`) < 0.12) return undefined;
  const scale = filterShare(regionId, filters);
  const size = 40 + Math.floor(unit(`size:${regionId}:${metric.id}`) * 360);
  if (metric.kind === "count") {
    const open = Math.round(size * scale * (1 - Math.min(0.95, (dateIndex + 1) / (DATES.length + 2))) * 0.35);
    return metric.id === "assets" ? Math.round(size * scale) : open;
  }
  const expected = Math.max(1, Math.round(size * scale));
  const pace = 0.35 + 0.9 * unit(`pace:${regionId}:${metric.id}`);
  const progress = Math.min(1, (pace * (dateIndex + 1)) / DATES.length);
  return { done: Math.round(expected * progress), expected };
}

export interface StubHeatmapSourceOptions {
  /** Artificial latency per call, so loading states are visible in a demo. Default 0. */
  delayMs?: number;
}

/** A `HeatmapViewerSource` over two made-up drawings. */
export function createStubHeatmapSource({ delayMs = 0 }: StubHeatmapSourceOptions = {}): HeatmapViewerSource {
  let refreshes = 0;
  const wait = <T,>(value: T): Promise<T> => (delayMs > 0 ? new Promise((resolve) => setTimeout(() => resolve(value), delayMs)) : Promise.resolve(value));
  const defOf = (id: string): HeatmapViewerDef => {
    const def = LIBRARY.find((d) => d.id === id);
    if (!def) throw new Error(`Unknown heatmap "${id}"`);
    return def;
  };

  return {
    listHeatmaps: () => wait<HeatmapViewerSummary[]>(LIBRARY.map((d) => ({ id: d.id, title: d.title, regionCount: d.regions.length }))),
    getHeatmap: (id) => wait(defOf(id)),
    getSnapshot: (query: HeatmapViewerQuery) => {
      const def = defOf(query.heatmapId);
      const found = query.date ? DATES.indexOf(query.date) : -1;
      const dateIndex = found >= 0 ? found : DATES.length - 1;
      const cells: Record<string, Record<string, HeatmapMetricCell>> = {};
      for (const region of def.regions) {
        const row: Record<string, HeatmapMetricCell> = {};
        for (const metric of def.metrics) {
          const cell = cellFor(def, region.id, metric, dateIndex, query.filters);
          if (cell !== undefined) row[metric.id] = cell;
        }
        cells[region.id] = row;
      }
      const filterValues = Object.fromEntries(
        (def.filters ?? []).map((f) => [
          f.field,
          (FILTER_VALUES[f.field] ?? []).map((value) => ({ value, count: 200 + Math.floor(unit(`count:${f.field}:${value}`) * 1800) })).sort((a, b) => b.count - a.count),
        ]),
      );
      const snapshot: HeatmapViewerSnapshot = {
        date: DATES[dateIndex]!,
        dates: DATES,
        reconstructedDates: DATES.slice(0, 3),
        milestones: [
          { date: DATES[3]!, label: "Register import", detail: "First bulk load from the legacy system" },
          { date: DATES[4]!, label: "Re-import", detail: "Corrections applied" },
          { date: DATES[9]!, label: "Phase 2 import" },
        ],
        computedAt: new Date(Date.UTC(2026, 8, 30, 6, refreshes)).toISOString(),
        cells,
        filterValues,
      };
      return wait(snapshot);
    },
    refresh: async () => {
      refreshes += 1;
      await wait(undefined);
    },
  };
}
