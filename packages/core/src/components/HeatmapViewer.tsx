import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { MultiSelect } from "./MultiSelect";
import { Popover } from "./Popover";
import { SchematicHeatmap } from "./SchematicHeatmap";
import { SegmentedControl } from "./SegmentedControl";
import { Select } from "./Select";
import { Table } from "./Table";
import { WaybackSlider } from "./WaybackSlider";
import { defaultColorScale, framesOf, regionsInFrame } from "./heatmapGeometry";
import type { HeatmapFrame, HeatmapRegion } from "./heatmapGeometry";
import {
  bandColorFor,
  brushGroupsOf,
  chipBrushes,
  defaultVisibleBrushesIn,
  frameFor,
  groupMilestones,
  isoDay,
  metricValue,
  parseIsoDay,
  shadeOptionsOf,
  shadeRegions,
  sumCells,
} from "./heatmapViewerModel";
import type {
  HeatmapMetricCell,
  HeatmapMetricValue,
  HeatmapMetricsPanelConfig,
  HeatmapViewerDef,
  HeatmapViewerFilter,
  HeatmapViewerMetric,
  HeatmapViewerQuery,
  HeatmapViewerSnapshot,
  HeatmapViewerSource,
  HeatmapViewerSummary,
} from "./heatmapViewerModel";
import { createStubHeatmapSource } from "./heatmapViewerStub";

/** What `renderNarrative` is handed — the viewer's current reading of the drawing, ready to summarise. */
export interface HeatmapViewerNarrativeContext {
  heatmap: HeatmapViewerDef;
  frame: HeatmapFrame;
  metric: HeatmapViewerMetric;
  /** ISO date of the snapshot on screen. */
  date: string | null;
  filters: Record<string, string[]>;
  /** The regions in view with the figure the drawing is shaded by (`share` null = no data). */
  regions: { id: string; label: string; share: number | null; text: string }[];
  /** Pinned regions (empty = the whole view is the subject). */
  selected: { id: string; label: string }[];
}

export interface HeatmapViewerProps extends Omit<ComponentPropsWithoutRef<"section">, "title"> {
  /** Where the library, drawings and snapshots come from. Default: a built-in made-up source (see
   * `createStubHeatmapSource`) — a host swaps in its own over its API. Treat it as stable: a new
   * object reloads everything. */
  source?: HeatmapViewerSource;
  /** Show this drawing instead of the source's library (a preview of unsaved work, or a single fixed
   * drawing). The library picker is hidden; snapshots still come from `source`. */
  heatmap?: HeatmapViewerDef;
  /** Which library drawing to open first. Default: the first listed. */
  defaultHeatmapId?: string;
  /** The module's heading. Default "Heatmap". */
  title?: ReactNode;
  /** Render something under the plot for the current reading — an assistant's narrative, a note. Only
   * called once a snapshot with figures exists. */
  renderNarrative?: (ctx: HeatmapViewerNarrativeContext) => ReactNode;
  /** Offer the full-screen toggle. Default true. */
  allowExpand?: boolean;
  /** How often to re-ask while a snapshot reports `computing`. Default 15000ms. */
  pollMs?: number;
}

const NO_FILTERS: Record<string, string[]> = {};
const HIDDEN_KEY = (id: string) => `rebar-heatmap-viewer-hidden:${id}`;

function readHidden(id: string): string[] {
  try {
    const raw = window.localStorage.getItem(HIDDEN_KEY(id));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeHidden(id: string, next: string[]): void {
  try {
    window.localStorage.setItem(HIDDEN_KEY(id), JSON.stringify(next));
  } catch {
    // A per-viewer convenience only.
  }
}

const fmtDay = (iso: string) => parseIsoDay(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

interface PanelProps {
  panel: HeatmapMetricsPanelConfig;
  metrics: Record<string, HeatmapViewerMetric>;
  subject: string;
  cellFor: (metric: HeatmapViewerMetric) => HeatmapMetricCell | undefined;
  shadeId: string;
  shadeable: ReadonlySet<string>;
  onShade: (id: string) => void;
  hidden: ReadonlySet<string>;
  onHiddenChange: (next: string[]) => void;
  onClose?: () => void;
  layout: "stack" | "grid";
}

/** The key numbers for the pinned regions (or the whole view): rows of metrics and headings, each metric row
 * showing its figure and, for a proportion, a bar. A row that can colour the drawing switches it on press. */
function MetricsPanel({ panel, metrics, subject, cellFor, shadeId, shadeable, onShade, hidden, onHiddenChange, onClose, layout }: PanelProps) {
  type Row = { type: "heading"; text: string } | { type: "metric"; metric: HeatmapViewerMetric; value: HeatmapMetricValue };
  const all: Row[] = [];
  for (const item of panel.items) {
    const metric = item.type === "metric" ? metrics[item.metric] : undefined;
    if (item.type === "heading") all.push(item);
    else if (metric) all.push({ type: "metric", metric, value: metricValue(metric, cellFor(metric)) });
  }
  const metricRows = all.filter((r): r is Extract<Row, { type: "metric" }> => r.type === "metric");
  // Hidden metrics drop out, and a heading with nothing left under it goes with them.
  const rows = all.filter((r, i) => {
    if (r.type === "metric") return !hidden.has(r.metric.id);
    for (let j = i + 1; j < all.length && all[j]!.type !== "heading"; j++) {
      const next = all[j]!;
      if (next.type === "metric" && !hidden.has(next.metric.id)) return true;
    }
    return false;
  });
  const visibleCount = metricRows.filter((r) => !hidden.has(r.metric.id)).length;

  return (
    <section className="rebar-heatmap-viewer-panel" data-rebar-part="metrics-panel" aria-label={panel.title || "Metrics"}>
      <div className="rebar-heatmap-viewer-panel-head">
        <div>
          <strong>{panel.title || "Metrics"}</strong>
          <div className="rebar-heatmap-viewer-subtle" data-rebar-part="subject">
            {subject}
          </div>
        </div>
        <div className="rebar-heatmap-viewer-panel-actions">
          {metricRows.length > 1 ? (
            <Popover
              trigger={
                <button type="button" className="rebar-heatmap-viewer-link" aria-label="Choose which metrics to show" data-rebar-part="metrics-picker">
                  {hidden.size > 0 ? `Metrics (${hidden.size} hidden)` : "Metrics"}
                </button>
              }
            >
              <div className="rebar-heatmap-viewer-picker">
                {metricRows.map((r) => {
                  const on = !hidden.has(r.metric.id);
                  return (
                    <Checkbox
                      key={r.metric.id}
                      id={`rebar-hv-${r.metric.id}`}
                      checked={on}
                      disabled={on && visibleCount <= 1}
                      onCheckedChange={(checked) => {
                        const next = new Set(hidden);
                        if (checked === true) next.delete(r.metric.id);
                        else next.add(r.metric.id);
                        onHiddenChange([...next]);
                      }}
                    >
                      {r.metric.label}
                    </Checkbox>
                  );
                })}
                <button type="button" className="rebar-heatmap-viewer-link" onClick={() => onHiddenChange([])}>
                  Show all
                </button>
              </div>
            </Popover>
          ) : null}
          {onClose ? (
            <button type="button" className="rebar-heatmap-viewer-link" aria-label="Close metrics" onClick={onClose}>
              ×
            </button>
          ) : null}
        </div>
      </div>
      {rows.length === 0 ? (
        <span className="rebar-heatmap-viewer-subtle">No metrics chosen for this drawing yet.</span>
      ) : (
        <div className="rebar-heatmap-viewer-rows" data-layout={layout}>
          {rows.map((r, i) => {
            if (r.type === "heading") {
              return (
                <div key={`h${i}`} className="rebar-heatmap-viewer-heading" data-rebar-part="panel-heading">
                  {r.text}
                </div>
              );
            }
            const canShade = shadeable.has(r.metric.id);
            const selected = shadeId === r.metric.id;
            const fill = r.value.share;
            const body = (
              <>
                <span className="rebar-heatmap-viewer-row-main">
                  <span>{r.metric.label}</span>
                  {r.value.detail ? <span className="rebar-heatmap-viewer-subtle">{r.value.detail}</span> : null}
                  {fill !== undefined ? (
                    <span
                      className="rebar-heatmap-viewer-bar"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(fill * 100)}
                      aria-label={`${r.metric.label} progress`}
                    >
                      <span style={{ width: `${Math.min(100, fill * 100)}%` }} />
                    </span>
                  ) : null}
                </span>
                <span className="rebar-heatmap-viewer-row-value">{r.value.text}</span>
              </>
            );
            return canShade ? (
              <button
                key={r.metric.id}
                type="button"
                className="rebar-heatmap-viewer-row"
                data-rebar-part="metric-row"
                data-metric={r.metric.id}
                data-shading={selected ? "true" : undefined}
                aria-pressed={selected}
                title={selected ? "The drawing is shaded by this metric" : "Press to shade the drawing by this metric"}
                onClick={() => onShade(r.metric.id)}
              >
                {body}
              </button>
            ) : (
              <div key={r.metric.id} className="rebar-heatmap-viewer-row" data-rebar-part="metric-row" data-metric={r.metric.id}>
                {body}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** Slicers: a multi-select per filter plus "Clear all filters". Options are the snapshot's own values. */
function Filters({
  filters,
  values,
  selected,
  onChange,
}: {
  filters: HeatmapViewerFilter[];
  values: HeatmapViewerSnapshot["filterValues"];
  selected: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
}) {
  const any = Object.values(selected).some((v) => v.length > 0);
  return (
    <div className="rebar-heatmap-viewer-filters" data-rebar-part="filters" role="group" aria-label="Heatmap filters">
      {filters.map((f) => (
        <label key={f.id} className="rebar-heatmap-viewer-field">
          <span className="rebar-heatmap-viewer-field-label">{f.label}</span>
          <MultiSelect
            aria-label={f.label}
            placeholder="All"
            disabled={!values?.[f.field]}
            options={(values?.[f.field] ?? []).map((v) => ({ value: v.value, label: `${v.value === "__blank__" ? "(blank)" : v.value} (${v.count.toLocaleString()})` }))}
            values={selected[f.field] ?? []}
            onValuesChange={(next) => onChange({ ...selected, [f.field]: next })}
          />
        </label>
      ))}
      <Button size="sm" variant="secondary" disabled={!any} onClick={() => onChange({})}>
        Clear all filters
      </Button>
    </div>
  );
}

/**
 * A BI module over `SchematicHeatmap`: everything a viewer needs to read a painted drawing as a
 * dashboard — a library picker, a frame picker, a shade-by metric switch, brush groups and chips, slicer
 * filters, a snapshot-date slider (with milestone markers), the drawing itself, a metrics panel (docked on
 * any side, or as a pop-over at the pinned region), a table view, full screen, and a slot for a narrative.
 *
 * It owns the interaction and none of the data. Everything it shows comes from a `HeatmapViewerSource`
 * (`listHeatmaps`, `getHeatmap`, `getSnapshot`, optional `refresh`); with no `source` it runs on a built-in
 * made-up one so it works standalone. A drawing is a `HeatmapViewerDef` — the `HeatmapPainter`'s
 * `HeatmapLayout` plus the metrics, panel, slicers and colour scale that say how to read it.
 *
 * Opinion tier: real state machines that branch what is rendered — the open drawing and frame, the active
 * brush group and visible brushes, the shade metric, the snapshot date, slicer selections, a pinned set of
 * regions (press to pin, Shift/Ctrl/Cmd-press to add or remove), chart/table mode, full screen — plus
 * asynchronous loading/error/computing states for the source. Regions, slider, selects and the table are
 * the real `SchematicHeatmap`, `WaybackSlider`, `Select`/`MultiSelect` and `Table`.
 */
export function HeatmapViewer({
  source: sourceProp,
  heatmap,
  defaultHeatmapId,
  title = "Heatmap",
  renderNarrative,
  allowExpand = true,
  pollMs = 15000,
  className,
  ...props
}: HeatmapViewerProps) {
  const fallbackSource = useRef<HeatmapViewerSource | null>(null);
  if (!sourceProp && !fallbackSource.current) fallbackSource.current = createStubHeatmapSource();
  const source = sourceProp ?? fallbackSource.current!;

  const [library, setLibrary] = useState<HeatmapViewerSummary[] | null>(null);
  const [heatmapId, setHeatmapId] = useState<string | null>(heatmap ? heatmap.id : (defaultHeatmapId ?? null));
  const [loaded, setLoaded] = useState<HeatmapViewerDef | null>(null);
  const [error, setError] = useState<string | null>(null);
  const def = heatmap ?? loaded;

  const [viewId, setViewId] = useState<string | null>(null);
  const [brushGroup, setBrushGroup] = useState<string | null>(null);
  const [visibleBrushes, setVisibleBrushes] = useState<Set<string>>(new Set());
  const [shadeId, setShadeId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [mode, setMode] = useState<"chart" | "table">("chart");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterSel, setFilterSel] = useState<Record<string, string[]>>(NO_FILTERS);
  const [expanded, setExpanded] = useState(false);
  const [hiddenMetrics, setHiddenMetrics] = useState<string[]>([]);
  const [popoverAt, setPopoverAt] = useState<{ x: number; y: number } | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  const [snapshot, setSnapshot] = useState<HeatmapViewerSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- the library and the open drawing ---------------------------------------------------------

  useEffect(() => {
    if (heatmap) return;
    let cancelled = false;
    source
      .listHeatmaps()
      .then((list) => {
        if (cancelled) return;
        setLibrary(list);
        setHeatmapId((current) => current ?? list[0]?.id ?? null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLibrary([]);
        setError(e instanceof Error ? e.message : "Could not load the heatmap library.");
      });
    return () => {
      cancelled = true;
    };
  }, [source, heatmap]);

  // Whatever drawing is open, reset the per-drawing view state to that drawing's own defaults.
  const openDef = useCallback((next: HeatmapViewerDef) => {
    const groups = brushGroupsOf(next);
    setViewId(framesOf(next)[0]!.id);
    setBrushGroup(groups[0] ?? null);
    setVisibleBrushes(defaultVisibleBrushesIn(next, groups[0] ?? null));
    setSelectedIds([]);
    setFilterSel(NO_FILTERS);
    setShadeId(null);
    setDate(null);
    setHiddenMetrics(readHidden(next.id));
  }, []);

  useEffect(() => {
    if (heatmap) {
      openDef(heatmap);
      return;
    }
    if (!heatmapId) return;
    let cancelled = false;
    setLoaded(null);
    setError(null);
    source
      .getHeatmap(heatmapId)
      .then((next) => {
        if (cancelled) return;
        setLoaded(next);
        openDef(next);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load that heatmap.");
      });
    return () => {
      cancelled = true;
    };
  }, [source, heatmap, heatmapId, openDef]);

  // ---- the snapshot --------------------------------------------------------------------------------

  const defId = def?.id;
  const waybackOn = def?.wayback !== false;
  const query = useMemo<HeatmapViewerQuery | null>(() => (defId ? { heatmapId: defId, date: waybackOn ? date : null, filters: filterSel } : null), [defId, date, filterSel, waybackOn]);
  const fetchSnapshot = useCallback(
    (q: HeatmapViewerQuery, showLoading: boolean, isCancelled: () => boolean) => {
      if (showLoading) setLoading(true);
      return source
        .getSnapshot(q)
        .then((s) => {
          if (!isCancelled()) setSnapshot(s);
        })
        .catch((e: unknown) => {
          if (isCancelled()) return;
          setSnapshot(null);
          setError(e instanceof Error ? e.message : "Could not load the figures.");
        })
        .finally(() => {
          if (showLoading && !isCancelled()) setLoading(false);
        });
    },
    [source],
  );
  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    void fetchSnapshot(query, true, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [query, fetchSnapshot]);
  // While a recompute runs, ask again quietly until it lands.
  useEffect(() => {
    if (!query || !snapshot?.computing) return;
    let cancelled = false;
    const timer = setInterval(() => void fetchSnapshot(query, false, () => cancelled), pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [query, snapshot?.computing, fetchSnapshot, pollMs]);
  const refresh = useCallback(() => {
    if (!query || !source.refresh) return;
    void source
      .refresh(query)
      .then(() => fetchSnapshot(query, false, () => false))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Refresh failed."));
  }, [query, source, fetchSnapshot]);

  // ---- derived view ---------------------------------------------------------------------------------

  const metricById = useMemo(() => Object.fromEntries((def?.metrics ?? []).map((m) => [m.id, m])), [def]);
  const panelCfg = def?.metricsPanel;
  const hiddenSet = useMemo(() => new Set(hiddenMetrics), [hiddenMetrics]);
  const shadeOptions = useMemo(() => {
    if (!def) return [];
    const all = shadeOptionsOf(def);
    const shown = all.filter((o) => !hiddenSet.has(o.id));
    return shown.length > 0 ? shown : all;
  }, [def, hiddenSet]);
  const shadeIds = useMemo(() => new Set(shadeOptions.map((o) => o.id)), [shadeOptions]);
  const activeShadeId = shadeId && shadeIds.has(shadeId) ? shadeId : (shadeOptions.find((o) => o.id === panelCfg?.defaultShade)?.id ?? shadeOptions[0]?.id ?? null);
  const activeMetric = activeShadeId ? metricById[activeShadeId] : undefined;

  const frames = useMemo(() => (def ? framesOf(def) : []), [def]);
  const frame = def ? frameFor(def, viewId) : null;
  const groups = useMemo(() => (def ? brushGroupsOf(def) : []), [def]);
  const activeGroup = groups.length > 0 ? (brushGroup && groups.includes(brushGroup) ? brushGroup : groups[0]!) : null;
  const chips = useMemo(() => (def && frame ? chipBrushes(def, frame, activeGroup) : []), [def, frame, activeGroup]);
  const brushById = useMemo(() => Object.fromEntries((def?.brushes ?? []).map((b) => [b.id, b])), [def]);
  const regions = useMemo<HeatmapRegion[]>(() => (def && frame ? regionsInFrame(def, frame, visibleBrushes) : []), [def, frame, visibleBrushes]);
  const cells = snapshot?.cells ?? null;

  const cellsFor = useCallback(
    (metric: HeatmapViewerMetric, ids: string[]) => sumCells(metric, ids.map((id) => cells?.[id]?.[metric.id])),
    [cells],
  );
  const shaded = useMemo(() => (activeMetric ? shadeRegions(regions, activeMetric, (ids) => cellsFor(activeMetric, ids)) : null), [regions, activeMetric, cellsFor]);

  const scale = def?.scale;
  const colorScale = useMemo(() => (scale ? (share: number) => bandColorFor(scale, share) : defaultColorScale), [scale]);
  const legendBands = scale?.bands.map((b) => ({ label: b.label, color: b.color }));
  const schematicLabels = shaded?.legend.kind === "count" ? { low: "0", high: shaded.legend.max.toLocaleString() } : undefined;

  const selectZone = useCallback((id: string, additive: boolean) => {
    setSelectedIds((prev) => {
      if (additive) return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      return prev.length === 1 && prev[0] === id ? [] : [id];
    });
  }, []);

  // The panel's subject: the pinned regions, or every region in view when none is pinned.
  const subject = useMemo(() => {
    const picked = regions.filter((r) => selectedIds.includes(r.id));
    const ids = (picked.length > 0 ? picked : regions).flatMap((r) => r.memberIds ?? [r.id]);
    const text = picked.length === 0 ? "All zones in view" : picked.length <= 3 ? picked.map((r) => r.label).join(" + ") : `${picked.length} zones: ${picked.slice(0, 3).map((r) => r.label).join(", ")}…`;
    return { picked, ids: [...new Set(ids)], text };
  }, [regions, selectedIds]);

  const changeHidden = useCallback(
    (next: string[]) => {
      setHiddenMetrics(next);
      if (defId) writeHidden(defId, next);
    },
    [defId],
  );

  // Full screen is a fixed overlay rather than the browser's Fullscreen API: pop-overs and menus render
  // into <body>, which a natively fullscreen element would hide.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector('[role="dialog"], [role="listbox"], [role="menu"], [data-radix-popper-content-wrapper]')) setExpanded(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  // The pop-over placement dismisses like a pop-over: a press outside it (other than a region, which re-targets it,
  // or another pop-up) clears the selection.
  const popoverMode = panelCfg?.placement === "popover";
  useEffect(() => {
    if (!popoverMode || selectedIds.length === 0) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t?.closest("[data-metrics-popover], g[data-region], [data-radix-popper-content-wrapper]")) return;
      setSelectedIds([]);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [popoverMode, selectedIds.length]);

  // ---- the slider ------------------------------------------------------------------------------------

  const dateList = snapshot?.dates ?? [];
  const dates = useMemo(() => (waybackOn ? dateList : []).map(parseIsoDay), [dateList, waybackOn]);
  const reconstructed = useMemo(() => new Set(snapshot?.reconstructedDates ?? []), [snapshot?.reconstructedDates]);
  const milestoneGroups = useMemo(() => groupMilestones(dateList, snapshot?.milestones ?? []), [dateList, snapshot?.milestones]);
  const shownDate = snapshot?.date ?? null;
  const latest = dateList[dateList.length - 1] ?? null;

  const narrativeCtx: HeatmapViewerNarrativeContext | null =
    def && frame && activeMetric && shaded && cells
      ? {
          heatmap: def,
          frame,
          metric: activeMetric,
          date: shownDate,
          filters: filterSel,
          regions: regions.map((r) => ({ id: r.id, label: r.label, share: shaded.values[r.id]?.share ?? null, text: shaded.values[r.id]?.text ?? "no data" })),
          selected: subject.picked.map((r) => ({ id: r.id, label: r.label })),
        }
      : null;

  // ---- render -----------------------------------------------------------------------------------------

  const tableRows = useMemo(
    () =>
      regions
        .map((r) => ({ id: r.id, label: r.label, brush: brushById[r.kind]?.label ?? r.kind, share: shaded?.values[r.id]?.share ?? null, text: shaded?.values[r.id]?.text ?? "no data" }))
        .sort((a, b) => (a.share ?? 2) - (b.share ?? 2)),
    [regions, shaded, brushById],
  );

  const placement = panelCfg && panelCfg.placement !== "none" ? panelCfg.placement : null;
  const metricsPanel = (extra: { onClose?: () => void; layout: "stack" | "grid" }) =>
    panelCfg && activeShadeId ? (
      <MetricsPanel
        panel={panelCfg}
        metrics={metricById}
        subject={subject.text}
        cellFor={(m) => cellsFor(m, subject.ids)}
        shadeId={activeShadeId}
        shadeable={shadeIds}
        onShade={setShadeId}
        hidden={hiddenSet}
        onHiddenChange={changeHidden}
        {...extra}
      />
    ) : null;

  const plot =
    def && frame && activeMetric && shaded ? (
      <div
        ref={plotRef}
        className="rebar-heatmap-viewer-plot"
        data-rebar-part="plot"
        // The pop-over opens next to the region that was pressed; presses on the pop-over itself must not move it.
        onPointerDownCapture={(e) => {
          const t = e.target as Element;
          if (t.closest("[data-metrics-popover]") || !t.closest("g[data-region]")) return;
          const box = plotRef.current?.getBoundingClientRect();
          if (box) setPopoverAt({ x: Math.min(e.clientX - box.left + 12, Math.max(0, box.width - 300)), y: Math.max(0, e.clientY - box.top + 12) });
        }}
        // A press on empty space clears the selection (Shift leaves it alone).
        onClick={(e) => {
          const t = e.target as Element;
          if (e.shiftKey || t.closest("g[data-region], [data-metrics-popover], [data-radix-popper-content-wrapper]")) return;
          setSelectedIds([]);
        }}
      >
        <SchematicHeatmap
          regions={regions}
          brushes={brushById}
          background={def.background}
          crop={frame.crop}
          values={Object.fromEntries(Object.entries(shaded.values).map(([id, v]) => [id, v.share === null ? undefined : v.share]))}
          colorScale={colorScale}
          legendBands={legendBands}
          labels={schematicLabels}
          formatValue={({ region }) => `${region.label}: ${shaded.values[region.id]?.text ?? "no data"}`}
          selectedIds={selectedIds}
          onSelect={(id, info) => (id === null ? setSelectedIds([]) : selectZone(id, info?.additive ?? false))}
          ariaLabel={`${activeMetric.label} per zone, ${def.title}${frames.length > 1 ? ` — ${frame.title}` : ""}`}
        />
        {placement === "popover" && selectedIds.length > 0 && popoverAt ? (
          <div data-metrics-popover className="rebar-heatmap-viewer-popover" style={{ left: popoverAt.x, top: popoverAt.y }}>
            {metricsPanel({ onClose: () => setSelectedIds([]), layout: "stack" })}
          </div>
        ) : null}
      </div>
    ) : null;

  let body: ReactNode;
  if (error && !def) {
    body = (
      <p role="alert" className="rebar-heatmap-viewer-message" data-rebar-part="error">
        {error}
      </p>
    );
  } else if (library && library.length === 0 && !heatmap) {
    body = <p className="rebar-heatmap-viewer-message">No heatmaps in the library yet.</p>;
  } else if (!def || !frame) {
    body = (
      <p className="rebar-heatmap-viewer-message" role="status">
        Loading the heatmap…
      </p>
    );
  } else if (!loading && !snapshot?.cells) {
    body = (
      <p className="rebar-heatmap-viewer-message" role="status" data-rebar-part={snapshot?.computing ? "computing" : "not-computed"}>
        {snapshot?.computing ? "Computing the first snapshot now — it will appear here as soon as it is done." : "Not computed yet."}
      </p>
    );
  } else if (mode === "table") {
    body = (
      <Table
        aria-label={`${activeMetric?.label ?? "Metric"} per zone`}
        rowKey="id"
        data={tableRows}
        pageSize={tableRows.length > 25 ? 25 : undefined}
        columns={[
          {
            key: "label",
            header: "Zone",
            render: (_v, row) => (
              <button type="button" className="rebar-heatmap-viewer-link" aria-pressed={selectedIds.includes(row.id)} onClick={(e) => selectZone(row.id, e.shiftKey || e.ctrlKey || e.metaKey)}>
                {row.label}
              </button>
            ),
          },
          { key: "brush", header: "Kind" },
          { key: "text", header: activeMetric?.label ?? "Value" },
        ]}
      />
    );
  } else {
    const row = placement === "left" || placement === "right";
    const side = placement && placement !== "popover" ? <div className={clsx("rebar-heatmap-viewer-side", row && "rebar-heatmap-viewer-side-row")}>{metricsPanel({ layout: placement === "footer" || placement === "top" ? "grid" : "stack" })}</div> : null;
    body = (
      <div className="rebar-heatmap-viewer-layout" data-placement={placement ?? "none"} data-rebar-part="layout">
        {placement === "top" || placement === "left" ? side : null}
        {plot}
        {placement === "footer" || placement === "right" ? side : null}
      </div>
    );
  }

  return (
    <section
      className={clsx("rebar-heatmap-viewer", expanded && "rebar-heatmap-viewer-expanded", className)}
      data-rebar-component="heatmap-viewer"
      data-rebar-state={expanded ? "expanded" : undefined}
      aria-label={typeof title === "string" ? title : "Heatmap"}
      {...props}
    >
      <div className="rebar-heatmap-viewer-head" data-rebar-part="header">
        <span className="rebar-heatmap-viewer-title">
          <strong>{title}</strong>
          {snapshot?.computedAt ? (
            <span className="rebar-heatmap-viewer-subtle" data-rebar-part="freshness">
              Computed {new Date(snapshot.computedAt).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : null}
          {source.refresh && def ? (
            <Button size="sm" variant="tertiary" onClick={refresh} disabled={!!snapshot?.computing}>
              {snapshot?.computing ? "Computing…" : "Refresh"}
            </Button>
          ) : null}
        </span>
        <div className="rebar-heatmap-viewer-controls">
          {!heatmap && library && library.length > 0 && heatmapId ? (
            <label className="rebar-heatmap-viewer-field rebar-heatmap-viewer-field-inline">
              <span className="rebar-heatmap-viewer-subtle">Drawing:</span>
              <Select size="sm" aria-label="Heatmap drawing" value={heatmapId} onValueChange={setHeatmapId} options={library.map((h) => ({ value: h.id, label: `${h.title} (${h.regionCount})` }))} />
            </label>
          ) : null}
          {frames.length > 1 ? <Select size="sm" aria-label="Frame" value={frame?.id} onValueChange={setViewId} options={frames.map((f) => ({ value: f.id, label: f.title }))} /> : null}
          {shadeOptions.length > 1 ? (
            shadeOptions.length <= 4 ? (
              <SegmentedControl aria-label="Shade by" value={activeShadeId ?? undefined} onValueChange={setShadeId} options={shadeOptions.map((o) => ({ value: o.id, label: o.label }))} />
            ) : (
              <label className="rebar-heatmap-viewer-field rebar-heatmap-viewer-field-inline">
                <span className="rebar-heatmap-viewer-subtle">Shade by:</span>
                <Select size="sm" aria-label="Shade by" value={activeShadeId ?? undefined} onValueChange={setShadeId} options={shadeOptions.map((o) => ({ value: o.id, label: o.label }))} />
              </label>
            )
          ) : null}
          <SegmentedControl
            aria-label="View as"
            value={mode}
            onValueChange={(v) => setMode(v as "chart" | "table")}
            options={[
              { value: "chart", label: "Drawing" },
              { value: "table", label: "Table" },
            ]}
          />
          {allowExpand ? (
            <Button size="sm" variant="secondary" aria-label={expanded ? "Exit full screen" : "Full screen"} aria-pressed={expanded} onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Exit full screen" : "Full screen"}
            </Button>
          ) : null}
        </div>
      </div>

      {def && (groups.length > 1 || chips.length > 1) ? (
        <div className="rebar-heatmap-viewer-brushes" data-rebar-part="brushes" role="group" aria-label="Brush filters">
          {groups.length > 1 ? (
            <SegmentedControl
              aria-label="Brush group"
              value={activeGroup ?? undefined}
              onValueChange={(g) => {
                setBrushGroup(g);
                setVisibleBrushes(defaultVisibleBrushesIn(def, g));
                setSelectedIds([]);
              }}
              options={groups.map((g) => ({ value: g, label: g }))}
            />
          ) : null}
          <span className="rebar-heatmap-viewer-subtle">Show:</span>
          {chips.map((b) => (
            <button
              key={b.id}
              type="button"
              className="rebar-heatmap-viewer-chip"
              data-rebar-part="brush-chip"
              data-brush={b.id}
              aria-pressed={visibleBrushes.has(b.id)}
              onClick={() =>
                setVisibleBrushes((prev) => {
                  const next = new Set(prev);
                  if (next.has(b.id)) next.delete(b.id);
                  else next.add(b.id);
                  return next;
                })
              }
            >
              <span className="rebar-heatmap-viewer-chip-swatch" style={{ background: b.color }} aria-hidden="true" />
              {b.label}
            </button>
          ))}
        </div>
      ) : null}

      {def?.filters && def.filters.length > 0 ? <Filters filters={def.filters} values={snapshot?.filterValues} selected={filterSel} onChange={setFilterSel} /> : null}

      {dates.length > 0 ? (
        <div className="rebar-heatmap-viewer-wayback" data-rebar-part="wayback">
          <WaybackSlider
            dates={dates}
            value={shownDate ? parseIsoDay(shownDate) : dates[dates.length - 1]}
            onValueChange={(d) => {
              const iso = isoDay(d);
              setDate(iso === latest ? null : iso);
            }}
            dateFormat={(d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            aria-label="Snapshot date"
          />
          {milestoneGroups.length > 0 ? (
            <div className="rebar-heatmap-viewer-milestones" data-rebar-part="milestones" aria-label="Milestones">
              {milestoneGroups.map((g) => {
                const target = g.items[g.items.length - 1]!.date;
                const label = g.items.length === 1 ? `${g.items[0]!.label} on ${fmtDay(g.items[0]!.date)}` : `${g.items.length} milestones, ${fmtDay(g.items[0]!.date)} to ${fmtDay(target)}`;
                return (
                  <button
                    key={target}
                    type="button"
                    className="rebar-heatmap-viewer-milestone"
                    data-rebar-part="milestone"
                    aria-label={label}
                    title={`${g.items.map((m) => `${fmtDay(m.date)} — ${m.label}${m.detail ? ` (${m.detail})` : ""}`).join("\n")}\nPress to jump to ${fmtDay(target)}.`}
                    style={{ left: `${g.at * 100}%` }}
                    onClick={() => setDate(target === latest ? null : target)}
                  >
                    <span className="rebar-heatmap-viewer-milestone-mark" />
                    {g.items.length > 1 ? <span className="rebar-heatmap-viewer-milestone-count">{g.items.length}</span> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
          <span className="rebar-heatmap-viewer-subtle" data-rebar-part="wayback-note">
            {shownDate && reconstructed.has(shownDate)
              ? "Reconstructed: this day was derived after the fact, not measured on the day."
              : milestoneGroups.length > 0
                ? "Diamonds mark milestone days; press one to jump to it."
                : null}
          </span>
        </div>
      ) : null}

      {body}

      {error && def ? (
        <p role="alert" className="rebar-heatmap-viewer-message" data-rebar-part="error">
          {error}
        </p>
      ) : null}

      {renderNarrative && narrativeCtx ? (
        <div className="rebar-heatmap-viewer-narrative" data-rebar-part="narrative">
          {renderNarrative(narrativeCtx)}
        </div>
      ) : null}
    </section>
  );
}
