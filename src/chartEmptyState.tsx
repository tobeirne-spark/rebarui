import { Empty } from "./components/Empty";

/**
 * Shared guard + render for the exact same bug found (and fixed here, once) across every chart
 * component in this library: an empty (or all-empty-series) dataset let `Math.min(...[])`/
 * `Math.max(...[])` — which evaluate to `Infinity`/`-Infinity` in JS — flow straight into scale
 * math, producing broken `NaN`/`Infinity`-based SVG coordinates instead of the visible placeholder
 * ref/HEURISTICS.md #16/#20 require for absent data. Every chart's own early-return keeps its own
 * `<figure>` wrapper (className/data-rebar-component/aria-label unchanged) and just swaps the plot
 * content for this — data-rebar-component stays consistent whether a chart has data or not, which
 * matters for anything selecting on it.
 */
export function renderChartEmptyState(height: number) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height }}>
      <Empty description="No data" />
    </div>
  );
}
