import type { Construct, OpinionConstructType } from "@rebar-ui/placement";
import type { ConstructTier, Tier } from "./tier.types";

/**
 * One table, one lookup: every shipped construct's tier (see ref/TIERS.md), regardless of which
 * package it physically lives in. This used to be two separate files/objects — one keyed by
 * `packages/core` component names (PascalCase), one by `@rebar-ui/placement` block types
 * (kebab-case `Construct["type"]`) — even though tier is the exact same five-value concept for
 * both, and a real bug came directly from that split: `"mega-menu"` disagreed with its own actual
 * page location because nothing forced its tier and its catalog wiring to be consulted together.
 * `component`/`block` below are kept as two sub-objects, not flattened into one, because that
 * split IS still a real, separate, orthogonal fact about the codebase (component vs. block answers
 * "would a consuming app import this directly, or is this a page-content shape the Packer
 * composes?" — the two packages have genuinely different runtime shapes) — but it's one export,
 * one type, one place a caller looks up "what tier is this," via `tierOf()` below, not two parallel
 * systems each requiring the caller to already know which one to ask.
 *
 * Every name in `component-props.json` — the same source `/components` itself used — must appear
 * in `component` below; `tierOf()` throws otherwise, since guessing wrong between
 * imitation/synthetic/opinion is a real methodology error, not a cosmetic gap (unlike
 * `shippedCategory.ts`'s safe "web" default). `block` is checked at compile time instead (see the
 * assertions at the bottom of this file) since `Construct["type"]` is a real TS union, not
 * generated JSON — a 40th block added to `packages/placement/src/schema.ts` without a matching
 * entry here fails `tsc --noEmit` immediately, as does an "opinion" entry here that disagrees with
 * `@rebar-ui/placement`'s own mechanical `OpinionConstructType` (`packages/placement/src/opinions.ts`).
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
 *
 * Similarly, "composes another named component" is what actually decides Imitation vs. Synthetic
 * in practice, not just "has its own file" — `Pagination`/`SegmentedControl`/`Selector`/
 * `NumberInput` all deliberately reimplement their own raw `<button>`s instead of importing the
 * real `Button`, specifically to stay a standalone primitive. `AiChatInput`/`ToggleGroup`/
 * `Carousel` were found importing and rendering `Button`/`Toggle` directly (a real audit, reading
 * each file, not a guess) and moved to Synthetic to match that same rule.
 */
export const CONSTRUCT_TIER = {
  component: {
    AiChatInput: "synthetic", // composes a real `Button` (send/dictation), not a raw <button> — see file header.
    Avatar: "imitation",
    Badge: "imitation",
    Barcode: "imitation",
    Box: "imitation",
    Button: "imitation",
    Carousel: "synthetic", // composes a real `Button` (prev/next) + a track/dots grouping — see file header.
    Checkbox: "imitation",
    Divider: "imitation",
    Heading: "imitation",
    Iframe: "imitation",
    Input: "imitation",
    Kbd: "imitation",
    NumberInput: "imitation",
    Pagination: "imitation",
    PinInput: "imitation",
    Progress: "imitation",
    ProgressCircle: "imitation",
    QRCode: "imitation",
    Radio: "imitation",
    RadioGroup: "imitation",
    Rate: "imitation",
    ScrollArea: "imitation",
    SegmentedControl: "imitation",
    Selector: "imitation",
    Skeleton: "imitation",
    Slider: "imitation",
    Spin: "imitation",
    Stack: "imitation",
    Statistic: "imitation",
    Switch: "imitation",
    Tag: "imitation",
    Text: "imitation",
    Toggle: "imitation",
    ToggleGroup: "synthetic", // composes real `Toggle`s in a .map() — a grouping, not a primitive. See file header.
    Watermark: "imitation",

    AccordionItem: "synthetic",
    Affix: "synthetic",
    Alert: "synthetic",
    AspectRatio: "synthetic",
    AvatarGroup: "synthetic",
    BackTop: "synthetic",
    BarChart: "synthetic",
    BulletGraph: "synthetic",
    ButtonGroup: "synthetic",
    CandlestickChart: "synthetic",
    Card: "synthetic",
    ChatThread: "synthetic",
    CodeBlock: "synthetic",
    Countdown: "synthetic",
    Descriptions: "synthetic",
    DiagramMinimap: "synthetic",
    DiffViewer: "synthetic",
    Empty: "synthetic",
    ErrorBlock: "synthetic",
    FormItem: "synthetic",
    FunnelChart: "synthetic",
    GanttChart: "synthetic",
    GaugeChart: "synthetic",
    GeoChart: "synthetic",
    GitGraph: "synthetic",
    InfiniteScrollGrid: "synthetic",
    Masonry: "synthetic",
    NoticeBar: "synthetic",
    PieChart: "synthetic",
    PivotTable: "synthetic",
    Result: "synthetic",
    SankeyDiagram: "synthetic",
    ScrollMask: "synthetic",
    Sparkline: "synthetic",
    SteppedBarChart: "synthetic",
    Steps: "synthetic",
    Sticky: "synthetic",
    Tab: "synthetic",
    TabList: "synthetic",
    TabPanel: "synthetic",
    Timeline: "synthetic",
    ToastProvider: "synthetic",
    Treemap: "synthetic",
    WaterfallChart: "synthetic",
    WaybackSlider: "synthetic",
    WordCloud: "synthetic",

    Accordion: "opinion",
    ActionSheet: "opinion",
    AreaChart: "opinion",
    BottomSheet: "opinion",
    BoxPlot: "opinion",
    BubbleChart: "opinion",
    Calendar: "opinion",
    CalendarHeatmap: "opinion",
    SchematicHeatmap: "opinion", // real hover/focus + pinned-selection state (controlled via selectedId/onSelect, or uncontrolled) that changes the readout and every region outline.
    HeatmapPainter: "opinion", // real internal state machines: tool (paint/frame), camera, in-flight drag, painted-cell draft, frame selection, space-to-pan.
    Cascader: "opinion",
    Collapsible: "opinion",
    ColorPicker: "opinion",
    Combobox: "opinion",
    CommentThread: "opinion",
    CommandPalette: "opinion",
    ConstructSearch: "opinion", // real query/open/activeIndex + keyboard nav + filtered dropdown — same shape as CommandPalette. See file header.
    ContextMenu: "opinion",
    DataGrid: "opinion",
    DatePicker: "opinion",
    Dialog: "opinion",
    DistributionChart: "opinion",
    Drawer: "opinion",
    Dropdown: "opinion",
    Editable: "opinion",
    Ellipsis: "opinion",
    FileManager: "opinion",
    FileUpload: "opinion",
    FloatingBubble: "opinion",
    FloatingPanel: "opinion",
    FloatingSelectionToolbar: "opinion",
    Flowchart: "opinion",
    Form: "opinion",
    FloatAssistant: "opinion",
    GraphExplorer: "opinion",
    Heatmap: "opinion",
    Histogram: "opinion",
    HoverCard: "opinion",
    Image: "opinion",
    ImageCropper: "opinion",
    IndexBar: "opinion",
    IndexChart: "opinion",
    Kanban: "opinion",
    LayersPanel: "opinion",
    Lightbox: "opinion",
    LineChart: "opinion",
    Mentions: "opinion",
    Menubar: "opinion",
    MindMap: "opinion",
    MultiSelect: "opinion",
    NodeLinkGraph: "opinion",
    NumberKeyboard: "opinion",
    OrgChart: "opinion",
    PackedBubbleChart: "opinion",
    PertChart: "opinion",
    PhoneInput: "opinion",
    PickerWheel: "opinion",
    Popconfirm: "opinion",
    Popover: "opinion",
    PullToRefresh: "opinion",
    RadarChart: "opinion",
    ResizablePanels: "opinion",
    RibbonChart: "opinion",
    RichTextEditor: "opinion",
    ScatterChart: "opinion",
    Select: "opinion",
    ShapeGallery: "opinion",
    SignaturePad: "opinion",
    SlashCommandMenu: "opinion",
    SpeedDial: "opinion",
    SplitButton: "opinion",
    StackedAreaChart: "opinion",
    StackedBarChart: "opinion",
    StackedLineChart: "opinion",
    StepChart: "opinion",
    SwipeActions: "opinion",
    Table: "opinion",
    Tabs: "opinion",
    TagInput: "opinion",
    TextToSpeechBar: "opinion",
    ThemeToggle: "opinion",
    TimePicker: "opinion",
    Toast: "opinion",
    TodoItem: "opinion",
    Tooltip: "opinion",
    Tour: "opinion",
    Transfer: "opinion",
    TreeSelect: "opinion",
    TreeView: "opinion",
    UMAPPlot: "opinion",
    UploadQueue: "opinion",
    VersionHistory: "opinion",
    VideoPlayer: "opinion",
    VoiceComposer: "opinion",
    VoiceInputBar: "opinion", // mode-driven UI via a required `state` enum (idle/listening/speaking/processing), zero internal useState — same delegated-state shape as VoiceComposer/TextToSpeechBar, not state ownership.
    WaveformAudioPlayer: "opinion",
    Wizard: "opinion",
    WorkspaceSwitcher: "opinion", // real open/closed dropdown + selection state, delegated to Dropdown/Radix — the same shape as ThemeToggle, not page-arrangement governance like NavBar/SidebarNav.

    AppShell: "order",
    Breadcrumb: "order",
    Col: "order",
    Container: "order",
    Footer: "order",
    Grid: "order",
    MobileTabBar: "order",
    NavBar: "order",
    NavIndex: "order",
    Row: "order",
    SectionNav: "order",
    SidePanel: "order",
    SidebarNav: "order",
    SkipLink: "order",

    // Geneses — starter projects, currently empty, will be populated as projects are added.
  } satisfies Record<string, Tier>,

  block: {
    header: "synthetic",
    "nav-bar": "order",
    "site-header": "order",
    "nav-index": "order",
    "page-index": "order",
    "side-panel": "order",
    banner: "synthetic",
    checklist: "synthetic",
    "goal-tracker": "opinion",
    "ai-chat": "opinion",
    callout: "synthetic",
    "spin-card": "synthetic",
    "error-block": "synthetic",
    footer: "synthetic",
    "feature-grid": "synthetic",
    "pillar-grid": "synthetic",
    hero: "synthetic",
    "section-header": "synthetic",
    "card-grid": "synthetic",
    "persona-card": "synthetic",
    table: "opinion",
    "data-list": "synthetic",
    "filter-bar": "synthetic",
    form: "opinion",
    tabs: "order",
    modal: "order",
    wizard: "opinion",
    "card-kanban": "opinion",
    "sticky-kanban": "opinion",
    "doc-section": "synthetic",
    "props-table": "synthetic",
    heuristic: "synthetic",
    iframe: "synthetic",
    comparison: "order",
    "scatter-chart": "opinion",
    "line-chart": "opinion",
    "stacked-bar-chart": "opinion",
    "stats-table": "synthetic",
    gallery: "synthetic",
    "construct-entry": "synthetic",
    "mega-menu": "order",
    "float-assistant": "opinion",
  } satisfies Record<Construct["type"], ConstructTier>,
};

export function tierOf(name: string): Tier {
  const component = (CONSTRUCT_TIER.component as Record<string, Tier | undefined>)[name];
  if (component) return component;
  const block = (CONSTRUCT_TIER.block as Record<string, Tier | undefined>)[name];
  if (block) return block;
  throw new Error(`Unclassified construct tier: ${name}`);
}

// Kept as a distinct name from `tierOf` for call sites that only ever have a real
// `Construct["type"]` in hand (never throws — `block` is exhaustive by the assertions below).
export function blockTier(type: Construct["type"]): ConstructTier {
  return CONSTRUCT_TIER.block[type];
}

// Type-level cross-check, both directions: every block type marked "opinion" above must be one of
// @rebar-ui/placement's real OpinionConstructType members, and every real OpinionConstructType
// member must be marked "opinion" above. Either direction failing turns the corresponding
// assertion type into `never`, and `never` can't hold the literal `true` below — a `tsc --noEmit`
// failure, not a silent drift.
type OpinionEntriesHere = {
  [K in keyof typeof CONSTRUCT_TIER.block]: (typeof CONSTRUCT_TIER.block)[K] extends "opinion" ? K : never;
}[keyof typeof CONSTRUCT_TIER.block];

type _NoExtraOpinionsHere = Exclude<OpinionEntriesHere, OpinionConstructType> extends never ? true : never;
type _NoMissingOpinionsHere = Exclude<OpinionConstructType, OpinionEntriesHere> extends never ? true : never;
const _noExtraOpinionsHere: _NoExtraOpinionsHere = true;
const _noMissingOpinionsHere: _NoMissingOpinionsHere = true;
void _noExtraOpinionsHere;
void _noMissingOpinionsHere;
