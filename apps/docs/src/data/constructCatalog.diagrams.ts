import type { CatalogConstruct } from "./constructCatalog.types";

// See constructCatalog.web.ts for sourcing methodology. Every entry originally catalogued here
// has shipped as a real `packages/core` construct: Pie/Donut, Radar/Polar, Gauge/Meter, Funnel,
// Waterfall, Box Plot, Sparkline, Bubble, Heatmap, Treemap, Candlestick, Geo/Choropleth, Gantt,
// Sankey, Word Cloud, Node-Link Graph, Advanced Data Grid, Pivot Table, Flowchart, Org Chart,
// Mind Map, and Diagram Minimap — see /synthetics/pie-chart, /opinions/radar-chart,
// /synthetics/gauge-chart, /synthetics/funnel-chart, /synthetics/waterfall-chart,
// /opinions/box-plot, /synthetics/sparkline, /opinions/bubble-chart, /opinions/heatmap,
// /synthetics/treemap, /synthetics/candlestick-chart, /synthetics/geo-chart,
// /synthetics/gantt-chart, /synthetics/sankey-diagram, /synthetics/word-cloud,
// /opinions/node-link-graph, /opinions/data-grid, /synthetics/pivot-table,
// /opinions/flowchart, /opinions/org-chart, /opinions/mind-map, and
// /synthetics/diagram-minimap. The original "cartesian charts" bundle entry
// (Line/Bar/Area/Scatter/Bubble) is fully closed too. `GeoChart` is a deliberate abstraction (an
// abstract regional grid choropleth, not real geographic border rendering) — see its own doc
// comment for why. `OrgChart`/`MindMap`/`Flowchart`/`DiagramMinimap` are thin compositions over
// the foundational `NodeLinkGraph` construct rather than four separate reimplementations.
export const DIAGRAM_CATALOG: CatalogConstruct[] = [];
