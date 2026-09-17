// Generates apps/docs/src/generated/component-props.json from packages/core's actual
// TypeScript prop types, so the docs site's props tables can't silently drift from the real
// component signatures (the whole reason ref/MARKETING_SITE.md calls for generation over
// hand-maintained tables). Run via predev/prebuild — the output is derived data, gitignored,
// not committed, same treatment as .next/.
import { withCustomConfig } from "react-docgen-typescript";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coreDir = path.resolve(__dirname, "../../../packages/core");
const tsconfigPath = path.join(coreDir, "tsconfig.json");

const parser = withCustomConfig(tsconfigPath, {
  savePropValueAsString: true,
  shouldExtractLiteralValuesFromEnum: true,
  propFilter: (prop) => {
    if (!prop.parent) return true;
    return !prop.parent.fileName.includes("node_modules");
  },
});

const COMPONENT_FILES = [
  "Box.tsx",
  "Stack.tsx",
  "Text.tsx",
  "Heading.tsx",
  "Button.tsx",
  "Input.tsx",
  "Card.tsx",
  "Alert.tsx",
  "Dialog.tsx",
  "Tabs.tsx",
  "Form.tsx",
  "Checkbox.tsx",
  "RadioGroup.tsx",
  "Switch.tsx",
  "Select.tsx",
  "Tooltip.tsx",
  "Popover.tsx",
  "Dropdown.tsx",
  "Slider.tsx",
  "Progress.tsx",
  "Avatar.tsx",
  "AspectRatio.tsx",
  "Accordion.tsx",
  "Toast.tsx",
  "Carousel.tsx",
  "Divider.tsx",
  "Tag.tsx",
  "Badge.tsx",
  "Empty.tsx",
  "Skeleton.tsx",
  "Spin.tsx",
  "Breadcrumb.tsx",
  "Steps.tsx",
  "Statistic.tsx",
  "Result.tsx",
  "Descriptions.tsx",
  "Timeline.tsx",
  "Rate.tsx",
  "NavBar.tsx",
  "SidebarNav.tsx",
  "AppShell.tsx",
  "HoverCard.tsx",
  "NavIndex.tsx",
  "SectionNav.tsx",
  "Wizard.tsx",
  "NumberInput.tsx",
  "PinInput.tsx",
  "SegmentedControl.tsx",
  "Editable.tsx",
  "ColorPicker.tsx",
  "Combobox.tsx",
  "MultiSelect.tsx",
  "Cascader.tsx",
  "Pagination.tsx",
  "TreeView.tsx",
  "Iframe.tsx",
  "Table.tsx",
  "ScatterChart.tsx",
  "LineChart.tsx",
  "StackedBarChart.tsx",
  "CodeBlock.tsx",
  "Kanban.tsx",
  "ThemeToggle.tsx",
  "Sticky.tsx",
  "QRCode.tsx",
  "Watermark.tsx",
  "BarChart.tsx",
  "AreaChart.tsx",
  "Sparkline.tsx",
  "PieChart.tsx",
  "GaugeChart.tsx",
  "FunnelChart.tsx",
  "WaterfallChart.tsx",
  "DistributionChart.tsx",
  "RadarChart.tsx",
  "BoxPlot.tsx",
  "Drawer.tsx",
  "SidePanel.tsx",
  "BottomSheet.tsx",
  "ActionSheet.tsx",
  "MobileTabBar.tsx",
  "ScrollArea.tsx",
  "Footer.tsx",
  "ScrollMask.tsx",
  "Ellipsis.tsx",
  "FloatingBubble.tsx",
  "FloatingPanel.tsx",
  "SplitButton.tsx",
  "Calendar.tsx",
  "TimePicker.tsx",
  "ResizablePanels.tsx",
  "Transfer.tsx",
  "CommandPalette.tsx",
  "Barcode.tsx",
  "DatePicker.tsx",
  "Image.tsx",
  "Lightbox.tsx",
  "FileUpload.tsx",
  "BubbleChart.tsx",
  "Heatmap.tsx",
  "StackedLineChart.tsx",
  "StackedAreaChart.tsx",
  "SteppedBarChart.tsx",
  "StepChart.tsx",
  "IndexChart.tsx",
  "Histogram.tsx",
  "RibbonChart.tsx",
  "CalendarHeatmap.tsx",
  "BulletGraph.tsx",
  "PackedBubbleChart.tsx",
  "UMAPPlot.tsx",
  "RichTextEditor.tsx",
  "PullToRefresh.tsx",
  "PickerWheel.tsx",
  "SwipeActions.tsx",
  "Treemap.tsx",
  "CandlestickChart.tsx",
  "GeoChart.tsx",
  "GanttChart.tsx",
  "PertChart.tsx",
  "WaybackSlider.tsx",
  "SankeyDiagram.tsx",
  "WordCloud.tsx",
  "NodeLinkGraph.tsx",
  "DataGrid.tsx",
  "PivotTable.tsx",
  "OrgChart.tsx",
  "MindMap.tsx",
  "Flowchart.tsx",
  "DiagramMinimap.tsx",
  "Popconfirm.tsx",
  "TreeSelect.tsx",
  "Tour.tsx",
  "Mentions.tsx",
  "BackTop.tsx",
  "Affix.tsx",
  "AvatarGroup.tsx",
  "ButtonGroup.tsx",
  "SpeedDial.tsx",
  "Masonry.tsx",
  "Collapsible.tsx",
  "Toggle.tsx",
  "ToggleGroup.tsx",
  "ContextMenu.tsx",
  "Menubar.tsx",
  "GitGraph.tsx",
  "VersionHistory.tsx",
  "IndexBar.tsx",
  "GraphExplorer.tsx",
  "ErrorBlock.tsx",
  "NoticeBar.tsx",
  "ProgressCircle.tsx",
  "Selector.tsx",
  "NumberKeyboard.tsx",
  "ChatThread.tsx",
  "WaveformAudioPlayer.tsx",
  "UploadQueue.tsx",
  "InfiniteScrollGrid.tsx",
  "TodoItem.tsx",
  "TextToSpeechBar.tsx",
  "FloatingSelectionToolbar.tsx",
  "SlashCommandMenu.tsx",
  "VoiceComposer.tsx",
  "AiChatInput.tsx",
  "ShapeGallery.tsx",
  "FileManager.tsx",
  "LayersPanel.tsx",
];

// react-docgen-typescript detects every component-shaped export in a parsed file, not just the
// one named after it — parsing "Drawer.tsx" (needed for `Drawer`'s own props) also yields
// `DrawerPanel`, the shared internal plumbing `BottomSheet`/`ActionSheet` build on. `DrawerPanel`
// is deliberately not exported from `packages/core/src/index.ts` (see its own doc comment) — a
// consumer can't actually `import { DrawerPanel } from "rebar-ui"`, so it shouldn't appear
// alongside real public components on `/components` (surfaced as a "no reference page" entry
// nobody could ever build a real page for, since it isn't a real public API). Filtered out here
// rather than given a fake page.
// Same reasoning for `buildTruncated` — a plain, non-component helper function exported from
// `Ellipsis.tsx` purely so its truncation math has a real unit test (jsdom can't exercise the
// real measure-and-search effect, see that file's own comment); not a component, not part of the
// public `rebar-ui` API surface.
const INTERNAL_ONLY = new Set(["DrawerPanel", "buildTruncated"]);

const result = {};

for (const file of COMPONENT_FILES) {
  const filePath = path.join(coreDir, "src/components", file);
  const docs = parser.parse(filePath);
  for (const doc of docs) {
    if (INTERNAL_ONLY.has(doc.displayName)) continue;
    result[doc.displayName] = Object.values(doc.props).map((prop) => ({
      name: prop.name,
      type: prop.type?.raw ?? prop.type?.name ?? "unknown",
      required: prop.required,
      defaultValue: prop.defaultValue?.value ?? null,
      description: prop.description || null,
    }));
  }
}

const outDir = path.resolve(__dirname, "../src/generated");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "component-props.json"),
  JSON.stringify(result, null, 2) + "\n",
);

console.log(
  `Generated props for ${Object.keys(result).length} components: ${Object.keys(result).join(", ")}`,
);
