import type { CatalogCategory } from "./constructCatalog.types";

// Every shipped component used to be hardcoded to category "web" in components/layout.tsx, back
// when Mobile/Diagram were still catalogued-but-unbuilt gaps (see the constructCatalog.mobile.ts/
// constructCatalog.diagrams.ts header comments for the exact original lists this was sourced
// from). Once those gaps shipped as real components, that hardcode silently went stale — every
// shipped component still read as "web" regardless of what it actually is, which is why the
// sidebar's Web/Mobile/Diagram category filter appeared to have lost Mobile and Diagram entirely
// (nothing was ever tagged that way, and the catalog — the only other source of those two
// categories — had emptied out too). This map is the real fix: an explicit category per shipped
// component, not inferred at render time.
const MOBILE: readonly string[] = [
  "ActionSheet",
  "BottomSheet",
  "MobileTabBar",
  "PullToRefresh",
  "PickerWheel",
  "SwipeActions",
  "IndexBar",
  "ErrorBlock",
  "NoticeBar",
  "ProgressCircle",
  "Selector",
  "NumberKeyboard",
  "Footer",
  "ScrollMask",
  "Ellipsis",
  "FloatingBubble",
  "FloatingPanel",
];

const DIAGRAM: readonly string[] = [
  "PieChart",
  "RadarChart",
  "GaugeChart",
  "FunnelChart",
  "WaterfallChart",
  "DistributionChart",
  "BoxPlot",
  "Sparkline",
  "BubbleChart",
  "Heatmap",
  "StackedLineChart",
  "StackedAreaChart",
  "SteppedBarChart",
  "StepChart",
  "IndexChart",
  "Histogram",
  "RibbonChart",
  "CalendarHeatmap",
  "BulletGraph",
  "PackedBubbleChart",
  "UMAPPlot",
  "Treemap",
  "CandlestickChart",
  "GeoChart",
  "GanttChart",
  "PertChart",
  "SankeyDiagram",
  "WordCloud",
  "NodeLinkGraph",
  "GraphExplorer",
  "DataGrid",
  "PivotTable",
  "Flowchart",
  "OrgChart",
  "MindMap",
  "DiagramMinimap",
  "LineChart",
  "BarChart",
  "AreaChart",
  "ScatterChart",
  "StackedBarChart",
];

const MOBILE_SET = new Set(MOBILE);
const DIAGRAM_SET = new Set(DIAGRAM);

/** Every other shipped component defaults to "web" — the common case, not a special one. */
export function shippedCategory(name: string): CatalogCategory {
  if (MOBILE_SET.has(name)) return "mobile";
  if (DIAGRAM_SET.has(name)) return "diagram";
  return "web";
}
