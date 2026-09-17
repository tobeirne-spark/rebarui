/**
 * Tier per shipped construct (see ref/TIERS.md). Every name in `component-props.json` — the same
 * source `/components` itself uses — must appear in exactly one of these four lists;
 * `constructTier()` throws otherwise, since guessing wrong between imitation/synthetic/opinion is
 * a real methodology error, not a cosmetic gap (unlike `shippedCategory.ts`'s safe "web" default).
 *
 * The delegated-state exception (see ref/TIERS.md): several Opinion-tier entries below show zero
 * own `useState` in their own source file — they delegate their entire state machine to a wrapped
 * Radix primitive (`Select`, `Accordion`, `Tabs`, `Dialog`, `Popover`, `Dropdown`, `Tooltip`,
 * `HoverCard`, `ContextMenu`, `Collapsible`, `Menubar`), a shared chart hook
 * (`useChartMarkSelection`/`useSeriesFilter` — every hover/click/persistent-selection or
 * series-toggle chart below), or another Opinion-tier construct (`NodeLinkGraph`'s pan/zoom/drag,
 * under `Flowchart`/`MindMap`/`OrgChart`/`PertChart`; `Table`/`Editable`/`Accordion`, under
 * `DataGrid`; `Drawer`, under `BottomSheet`/`ActionSheet`/`Popconfirm`/`Lightbox`/`VersionHistory`;
 * react-hook-form, under `Form`). Tier was decided by reading each one's actual source, not by
 * grepping for `useState` in isolation.
 */
const IMITATION: readonly string[] = [
  "AiChatInput",
  "Avatar",
  "Badge",
  "Barcode",
  "Box",
  "Button",
  "Carousel",
  "Checkbox",
  "Divider",
  "Heading",
  "Iframe",
  "Input",
  "NumberInput",
  "Pagination",
  "PinInput",
  "Progress",
  "ProgressCircle",
  "QRCode",
  "Radio",
  "RadioGroup",
  "Rate",
  "ScrollArea",
  "SegmentedControl",
  "Selector",
  "Skeleton",
  "Slider",
  "Spin",
  "Stack",
  "Statistic",
  "Switch",
  "Tag",
  "Text",
  "Toggle",
  "ToggleGroup",
  "Watermark",
];

const SYNTHETIC: readonly string[] = [
  "AccordionItem",
  "Affix",
  "Alert",
  "AspectRatio",
  "AvatarGroup",
  "BackTop",
  "BarChart",
  "BulletGraph",
  "ButtonGroup",
  "CandlestickChart",
  "Card",
  "ChatThread",
  "CodeBlock",
  "Descriptions",
  "DiagramMinimap",
  "Empty",
  "ErrorBlock",
  "FormItem",
  "FunnelChart",
  "GanttChart",
  "GaugeChart",
  "GeoChart",
  "GitGraph",
  "InfiniteScrollGrid",
  "Masonry",
  "NoticeBar",
  "PieChart",
  "PivotTable",
  "Result",
  "SankeyDiagram",
  "ScrollMask",
  "Sparkline",
  "SteppedBarChart",
  "Steps",
  "Sticky",
  "Tab",
  "TabList",
  "TabPanel",
  "Timeline",
  "ToastProvider",
  "Treemap",
  "WaterfallChart",
  "WaybackSlider",
  "WordCloud",
];

const OPINION: readonly string[] = [
  "Accordion",
  "ActionSheet",
  "AreaChart",
  "BottomSheet",
  "BoxPlot",
  "BubbleChart",
  "Calendar",
  "CalendarHeatmap",
  "Cascader",
  "Collapsible",
  "ColorPicker",
  "Combobox",
  "CommandPalette",
  "ContextMenu",
  "DataGrid",
  "DatePicker",
  "Dialog",
  "DistributionChart",
  "Drawer",
  "Dropdown",
  "Editable",
  "Ellipsis",
  "FileManager",
  "FileUpload",
  "FloatingBubble",
  "FloatingPanel",
  "FloatingSelectionToolbar",
  "Flowchart",
  "Form",
  "GraphExplorer",
  "Heatmap",
  "Histogram",
  "HoverCard",
  "Image",
  "IndexBar",
  "IndexChart",
  "Kanban",
  "LayersPanel",
  "Lightbox",
  "LineChart",
  "Mentions",
  "Menubar",
  "MindMap",
  "MultiSelect",
  "NodeLinkGraph",
  "NumberKeyboard",
  "OrgChart",
  "PackedBubbleChart",
  "PertChart",
  "PickerWheel",
  "Popconfirm",
  "Popover",
  "PullToRefresh",
  "RadarChart",
  "ResizablePanels",
  "RibbonChart",
  "RichTextEditor",
  "ScatterChart",
  "Select",
  "ShapeGallery",
  "SlashCommandMenu",
  "SpeedDial",
  "SplitButton",
  "StackedAreaChart",
  "StackedBarChart",
  "StackedLineChart",
  "StepChart",
  "SwipeActions",
  "Table",
  "Tabs",
  "TextToSpeechBar",
  "ThemeToggle",
  "TimePicker",
  "Toast",
  "TodoItem",
  "Tooltip",
  "Tour",
  "Transfer",
  "TreeSelect",
  "TreeView",
  "UMAPPlot",
  "UploadQueue",
  "VersionHistory",
  "VoiceComposer",
  "WaveformAudioPlayer",
  "Wizard",
];

const ORDER: readonly string[] = [
  "AppShell",
  "Breadcrumb",
  "Footer",
  "MobileTabBar",
  "NavBar",
  "NavIndex",
  "SectionNav",
  "SidePanel",
  "SidebarNav",
];

const GENESIS: readonly string[] = [
  // Starter projects - currently empty, will be populated as projects are added
];

const IMITATION_SET = new Set(IMITATION);
const SYNTHETIC_SET = new Set(SYNTHETIC);
const OPINION_SET = new Set(OPINION);
const ORDER_SET = new Set(ORDER);
const GENESIS_SET = new Set(GENESIS);

export function constructTier(name: string): "imitation" | "synthetic" | "opinion" | "order" | "genesis" {
  if (IMITATION_SET.has(name)) return "imitation";
  if (SYNTHETIC_SET.has(name)) return "synthetic";
  if (OPINION_SET.has(name)) return "opinion";
  if (ORDER_SET.has(name)) return "order";
  if (GENESIS_SET.has(name)) return "genesis";
  throw new Error(`Unclassified construct tier: ${name}`);
}
