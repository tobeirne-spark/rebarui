// Types and pure helpers behind `HeatmapViewer` — the BI module that wraps `SchematicHeatmap` with a
// library picker, frame picker, shade-by metric switch, brush filters, slicers, a snapshot-date
// slider, a metrics panel and a table view. Nothing in here touches React or the DOM, and nothing
// knows where numbers come from: a host supplies a `HeatmapViewerSource` (the shapes below) and the
// viewer only ever reads the snapshot it returns.

import { framesOf, brushesOf, regionInCrop } from "./heatmapGeometry";
import type { HeatmapBrush, HeatmapFrame, HeatmapLayout, HeatmapRegion } from "./heatmapGeometry";

// ---- what a metric is -------------------------------------------------------------------------------

/** `progress`: a done/expected pair per region — shades by `done / expected` and sums across regions.
 * `count`: a plain number per region — shaded against the biggest count in view and summed. */
export type HeatmapMetricKind = "progress" | "count";

export interface HeatmapViewerMetric {
  id: string;
  label: string;
  description?: string;
  kind: HeatmapMetricKind;
  /** Appended to a count's figure ("m", "items"). */
  unit?: string;
}

/** One region's figure for one metric: `{ done, expected }` for a `progress` metric, a number for a `count`. */
export type HeatmapMetricCell = { done: number; expected: number } | number;

/** The metric a panel row / shade option reads, as the viewer presents it. */
export interface HeatmapMetricValue {
  /** The headline figure ("72.2 %", "1,204"). */
  text: string;
  /** A second line ("182 / 250"). */
  detail?: string;
  /** 0..1 when the figure is a proportion — drives the panel's bar and the drawing's shade. */
  share?: number;
  /** The headline as a plain number when it is a count — shades the drawing against the biggest count in view. */
  raw?: number;
}

export const NO_DATA = "No data";
const DASH = "—";

const n = (v: number) => v.toLocaleString();
export const pct = (share: number) => `${(share * 100).toFixed(1)} %`;

/** Add several regions' cells together (a region built from member regions). Undefined when none has data. */
export function sumCells(metric: HeatmapViewerMetric, cells: (HeatmapMetricCell | undefined)[]): HeatmapMetricCell | undefined {
  let done = 0;
  let expected = 0;
  let total = 0;
  let any = false;
  for (const c of cells) {
    if (c === undefined || c === null) continue;
    any = true;
    if (typeof c === "number") total += c;
    else {
      done += c.done;
      expected += c.expected;
    }
  }
  if (!any) return undefined;
  return metric.kind === "count" ? total : { done, expected };
}

/** A metric's headline for one (possibly summed) cell. A missing cell is a dash, never a false zero. */
export function metricValue(metric: HeatmapViewerMetric, cell: HeatmapMetricCell | undefined): HeatmapMetricValue {
  if (cell === undefined) return { text: DASH };
  if (metric.kind === "count") {
    const v = typeof cell === "number" ? cell : cell.done;
    return Number.isFinite(v) ? { text: `${n(v)}${metric.unit ? ` ${metric.unit}` : ""}`, raw: v } : { text: DASH };
  }
  if (typeof cell === "number") return Number.isFinite(cell) ? { text: pct(Math.min(1, Math.max(0, cell))), share: Math.min(1, Math.max(0, cell)) } : { text: NO_DATA };
  if (!(cell.expected > 0) || !Number.isFinite(cell.done)) return { text: NO_DATA };
  const share = Math.min(1, Math.max(0, cell.done / cell.expected));
  return { text: pct(share), detail: `${n(cell.done)} / ${n(cell.expected)}`, share };
}

export interface HeatmapShadeValue {
  /** 0..1 position on the colour scale; null = no value here (drawn as the hatched "no data"). */
  share: number | null;
  /** The hover/readout text. */
  text: string;
  /** The count, before it is placed against the biggest count in view. */
  raw?: number;
}

export function shadeValue(metric: HeatmapViewerMetric, cell: HeatmapMetricCell | undefined): HeatmapShadeValue {
  const v = metricValue(metric, cell);
  if (v.share !== undefined) return { share: v.share, text: v.detail ? `${v.text} (${v.detail})` : v.text };
  if (v.raw !== undefined) return { share: null, raw: v.raw, text: v.text };
  return { share: null, text: "no data" };
}

/** Per-region shade values for the drawing, with count metrics placed against the biggest count in view. */
export function shadeRegions(
  regions: readonly HeatmapRegion[],
  metric: HeatmapViewerMetric,
  cellsFor: (ids: string[]) => HeatmapMetricCell | undefined,
): { values: Record<string, { share: number | null; text: string }>; legend: { kind: "proportion" } | { kind: "count"; max: number } } {
  const per = regions.map((r) => shadeValue(metric, cellsFor(r.memberIds ?? [r.id])));
  const maxRaw = Math.max(0, ...per.map((v) => v.raw ?? 0));
  const isCount = per.some((v) => v.raw !== undefined) && !per.some((v) => v.share !== null);
  const values: Record<string, { share: number | null; text: string }> = {};
  regions.forEach((r, i) => {
    const v = per[i]!;
    values[r.id] = v.raw !== undefined ? { share: maxRaw > 0 ? v.raw / maxRaw : 0, text: v.text } : { share: v.share, text: v.text };
  });
  return { values, legend: isCount ? { kind: "count", max: maxRaw } : { kind: "proportion" } };
}

// ---- the definition of one heatmap in the library -----------------------------------------------------

export type HeatmapMetricsPlacement = "footer" | "top" | "left" | "right" | "popover" | "none";

/** One row of the metrics panel: a metric (optionally offered as a shade-by option) or a section heading. */
export type HeatmapMetricsPanelItem = { type: "metric"; metric: string; shade?: boolean } | { type: "heading"; text: string };

export interface HeatmapMetricsPanelConfig {
  placement: HeatmapMetricsPlacement;
  title?: string;
  items: HeatmapMetricsPanelItem[];
  /** The metric the drawing is shaded by first (one of the `shade`-flagged items). */
  defaultShade?: string;
}

/** A slicer above the plot: the snapshot field it filters by and the label above its dropdown. */
export interface HeatmapViewerFilter {
  id: string;
  label: string;
  field: string;
}

/** One band of a banded colour scale: starts at `min` (a percentage, 0-100) and runs to the next band's `min`;
 * an `exact` band matches only a value equal to its `min` (used for 0% and 100%). */
export interface HeatmapScaleBand {
  label: string;
  color: string;
  min: number;
  exact?: boolean;
}

export interface HeatmapScaleConfig {
  title?: string;
  bands: HeatmapScaleBand[];
}

/** One heatmap in the library: a painted layout (`HeatmapPainter`'s output) plus how to read it. */
export interface HeatmapViewerDef extends HeatmapLayout {
  id: string;
  title: string;
  /** Every metric this drawing can show. Panel rows and shade options refer to these by id. */
  metrics: HeatmapViewerMetric[];
  metricsPanel?: HeatmapMetricsPanelConfig;
  filters?: HeatmapViewerFilter[];
  /** Absent = the plot's default ramp. */
  scale?: HeatmapScaleConfig;
  /** Show the snapshot-date slider. Absent = shown. */
  wayback?: boolean;
}

/** What the library picker lists. */
export interface HeatmapViewerSummary {
  id: string;
  title: string;
  regionCount: number;
}

export interface HeatmapMilestone {
  date: string;
  label: string;
  detail?: string | null;
}

export interface HeatmapFilterOption {
  value: string;
  count: number;
}

/** One dated snapshot of every region's figures, as the source computed it. */
export interface HeatmapViewerSnapshot {
  /** The snapshot returned (ISO `YYYY-MM-DD`); null before the first one exists. */
  date: string | null;
  /** Every date a snapshot exists for, oldest first — the slider's stops. */
  dates: string[];
  /** The subset of `dates` derived after the fact rather than measured on the day. */
  reconstructedDates?: string[];
  milestones?: HeatmapMilestone[];
  /** ISO time the snapshot was computed. */
  computedAt: string | null;
  /** A recompute is in flight: `cells` may be null, and the viewer polls until it lands. */
  computing?: boolean;
  /** region id → metric id → figure. Null = nothing computed yet. */
  cells: Record<string, Record<string, HeatmapMetricCell>> | null;
  /** Each filter field's available values, biggest first (`__blank__` = empty). */
  filterValues?: Record<string, HeatmapFilterOption[]>;
}

export interface HeatmapViewerQuery {
  heatmapId: string;
  /** ISO date, or null for the latest snapshot. */
  date: string | null;
  /** Filter field → the values picked. Absent/empty field = no restriction. */
  filters: Record<string, string[]>;
}

/** Where the viewer's data comes from. The built-in `createStubHeatmapSource()` makes up a fictional
 * campus; a real host implements these three (plus `refresh` if it can recompute on demand) over its
 * own API. Every method may reject — the viewer shows the failure rather than an empty drawing. */
export interface HeatmapViewerSource {
  listHeatmaps(): Promise<HeatmapViewerSummary[]>;
  getHeatmap(id: string): Promise<HeatmapViewerDef>;
  getSnapshot(query: HeatmapViewerQuery): Promise<HeatmapViewerSnapshot>;
  /** Ask the source to recompute now. Shown as a "Refresh" button only when given. */
  refresh?(query: HeatmapViewerQuery): Promise<void>;
}

// ---- brush groups -------------------------------------------------------------------------------------

/** The group a brush belongs to when the author gave it none. */
export const UNGROUPED_BRUSHES = "Other";
export const brushGroupOf = (b: HeatmapBrush): string => b.group?.trim() || UNGROUPED_BRUSHES;

/** The layout's brush groups in first-seen order — empty when no brush has a group (then every brush is offered at once). */
export function brushGroupsOf(layout: Pick<HeatmapLayout, "brushes" | "regions">): string[] {
  const brushes = brushesOf(layout);
  if (!brushes.some((b) => b.group?.trim())) return [];
  return [...new Set(brushes.map(brushGroupOf))];
}

/** The brushes shown until a viewer toggles them — within one group when the layout has groups. */
export function defaultVisibleBrushesIn(layout: Pick<HeatmapLayout, "brushes" | "regions">, group?: string | null): Set<string> {
  return new Set(
    brushesOf(layout)
      .filter((b) => b.defaultVisible !== false && (!group || brushGroupOf(b) === group))
      .map((b) => b.id),
  );
}

/** A frame (or the fitted "Whole drawing") to show: the one asked for, else the first. */
export function frameFor(layout: Pick<HeatmapLayout, "frames" | "regions" | "cellSize">, id: string | null): HeatmapFrame {
  const frames = framesOf(layout);
  return frames.find((f) => f.id === id) ?? frames[0]!;
}

/** The brushes worth offering as chips: those with a region in the frame, inside the active group. */
export function chipBrushes(layout: Pick<HeatmapLayout, "brushes" | "regions">, frame: HeatmapFrame, group: string | null): HeatmapBrush[] {
  const present = new Set(layout.regions.filter((r) => regionInCrop(r, frame.crop)).map((r) => r.kind));
  return brushesOf(layout).filter((b) => present.has(b.id) && (!group || brushGroupOf(b) === group));
}

// ---- shade-by options -----------------------------------------------------------------------------------

export interface HeatmapShadeOption {
  id: string;
  label: string;
}

/** The shade-by options: the panel's `shade`-flagged metrics in order, or — when it flags none — every metric. */
export function shadeOptionsOf(def: Pick<HeatmapViewerDef, "metrics" | "metricsPanel">): HeatmapShadeOption[] {
  const byId = new Map(def.metrics.map((m) => [m.id, m]));
  const flagged = (def.metricsPanel?.items ?? []).flatMap((i) => (i.type === "metric" && i.shade && byId.has(i.metric) ? [i.metric] : []));
  const ids = flagged.length > 0 ? [...new Set(flagged)] : def.metrics.map((m) => m.id);
  return ids.map((id) => ({ id, label: byId.get(id)!.label }));
}

// ---- banded colour scale --------------------------------------------------------------------------------

/** A banded "progress" palette: exactly 0%, then quarters, then exactly 100%. */
export const DEFAULT_BANDED_SCALE: HeatmapScaleConfig = {
  title: "Progress",
  bands: [
    { label: "0%", color: "#d9d9de", min: 0, exact: true },
    { label: "<25%", color: "#d98f8f", min: 0 },
    { label: "25-50%", color: "#e8a02e", min: 25 },
    { label: "50-75%", color: "#a3b536", min: 50 },
    { label: "75-100%", color: "#5aa33a", min: 75 },
    { label: "100%", color: "#2a6f3a", min: 100, exact: true },
  ],
};

/** The band a 0..1 share falls in: an `exact` band wins when the percentage equals its `min`;
 * otherwise the highest non-exact band whose `min` the percentage has reached. */
export function bandIndexFor(scale: HeatmapScaleConfig, share: number): number {
  const p = share * 100;
  const exact = scale.bands.findIndex((b) => b.exact && Math.abs(p - b.min) < 1e-9);
  if (exact >= 0) return exact;
  let best = -1;
  scale.bands.forEach((b, i) => {
    if (!b.exact && b.min <= p && (best < 0 || b.min >= scale.bands[best]!.min)) best = i;
  });
  return best >= 0 ? best : Math.max(0, scale.bands.findIndex((b) => !b.exact));
}

export function bandColorFor(scale: HeatmapScaleConfig, share: number): string {
  return scale.bands[bandIndexFor(scale, share)]?.color ?? "#d9d9de";
}

// ---- the slider's milestones ----------------------------------------------------------------------------

export interface HeatmapMilestoneGroup {
  /** 0..1 position along the slider. */
  at: number;
  items: (HeatmapMilestone & { at: number })[];
}

/** Milestones that would overlap on the slider (days a day or two apart on a long scale) merge into one
 * marker whose tooltip lists them all; the marker sits at their average position. */
export function groupMilestones(dates: readonly string[], milestones: readonly HeatmapMilestone[], minGap = 0.02): HeatmapMilestoneGroup[] {
  const n = Math.max(1, dates.length - 1);
  const placed = milestones
    .map((m) => ({ ...m, at: dates.indexOf(m.date) / n }))
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at);
  const groups: HeatmapMilestoneGroup[] = [];
  for (const m of placed) {
    const last = groups[groups.length - 1];
    if (last && m.at - last.items[last.items.length - 1]!.at < minGap) {
      last.items.push(m);
      last.at = last.items.reduce((sum, x) => sum + x.at, 0) / last.items.length;
    } else groups.push({ at: m.at, items: [m] });
  }
  return groups;
}

export const isoDay = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parseIsoDay = (iso: string): Date => new Date(`${iso}T00:00:00`);
