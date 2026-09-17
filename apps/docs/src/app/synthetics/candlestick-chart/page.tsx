import { CandlestickChart, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const DATA = [
  { label: "Mon", open: 42, high: 45, low: 40, close: 44 },
  { label: "Tue", open: 44, high: 44.5, low: 39, close: 40 },
  { label: "Wed", open: 40, high: 43, low: 39.5, close: 42.8 },
  { label: "Thu", open: 42.8, high: 43, low: 38, close: 38.5 },
  { label: "Fri", open: 38.5, high: 41, low: 38, close: 40.9 },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<CandlestickChart title="Weekly close" data={[{ label: "Mon", open: 42, high: 45, low: 40, close: 44 }, /* ... */]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["CandlestickChart"] ?? [] },
  {
    type: "doc-section",
    heading: "Wick and body",
    body: [
      {
        kind: "text",
        text: "Each entry renders a thin wick spanning the full `high`/`low` range, and a filled body spanning `open`/`close`, colored `upColor` when the period closed at or above its open, `downColor` otherwise. The y-axis range and tick spacing reuse the same convention `LineChart`/`ScatterChart` already use — padded min/max, evenly spaced ticks — rather than a new axis approach invented for this chart alone.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "CandlestickChart vs. BoxPlot",
    body: [
      {
        kind: "text",
        text: 'Visually similar (both draw a wick plus a body per category) but answer different questions. `CandlestickChart` is a **time-ordered price record** — each candle is one period\'s literal open/high/low/close, and the body\'s two ends are exactly those two numbers, not a statistical measure. `BoxPlot` is a **statistical distribution summary** — its box spans the interquartile range (25th-75th percentile) around a visible median line, deliberately not the same thing as an "open" and "close." A candlestick\'s body doesn\'t mark a median at all, which is the concrete tell if the two ever look ambiguous side by side. Use `CandlestickChart` for a sequence of real periodic values (price, temperature range per day); use `BoxPlot` to summarize the spread of a dataset.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="candlestick-chart"` on the root `<figure>`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own; a financial candlestick chart typically migrates to a dedicated library like `lightweight-charts` rather than an antd component.",
      },
    ],
  },
];

export default function CandlestickChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>CandlestickChart</Heading>
      <Text color="secondary">
        A financial price-range chart — one wick-and-body candle per period.
      </Text>

      <CandlestickChart title="Weekly close" data={DATA} />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
