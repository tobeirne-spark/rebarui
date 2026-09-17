import { Heading, Heatmap, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

// A full business week x five time-of-day slots — server load (% CPU) sampled through the day.
// Weekday middays run hot (deploy/batch windows, peak traffic); nights and weekends stay low. A
// couple of pairs are deliberately omitted below to keep demonstrating a real data gap, not a
// recorded zero.
const DATA = [
  { row: "Mon", col: "6am", value: 18 },
  { row: "Mon", col: "9am", value: 52 },
  { row: "Mon", col: "12pm", value: 81 },
  { row: "Mon", col: "3pm", value: 74 },
  { row: "Mon", col: "6pm", value: 39 },
  { row: "Tue", col: "6am", value: 15 },
  { row: "Tue", col: "9am", value: 58 },
  { row: "Tue", col: "12pm", value: 88 },
  // "Tue" / "3pm" deliberately omitted — a real gap in the data (a monitoring outage), not a
  // recorded zero.
  { row: "Tue", col: "6pm", value: 41 },
  { row: "Wed", col: "6am", value: 21 },
  { row: "Wed", col: "9am", value: 55 },
  { row: "Wed", col: "12pm", value: 92 },
  { row: "Wed", col: "3pm", value: 79 },
  { row: "Wed", col: "6pm", value: 44 },
  { row: "Thu", col: "6am", value: 19 },
  { row: "Thu", col: "9am", value: 60 },
  { row: "Thu", col: "12pm", value: 85 },
  { row: "Thu", col: "3pm", value: 71 },
  { row: "Thu", col: "6pm", value: 37 },
  { row: "Fri", col: "6am", value: 16 },
  { row: "Fri", col: "9am", value: 47 },
  { row: "Fri", col: "12pm", value: 68 },
  { row: "Fri", col: "3pm", value: 51 },
  { row: "Fri", col: "6pm", value: 22 },
  { row: "Sat", col: "6am", value: 6 },
  { row: "Sat", col: "9am", value: 11 },
  { row: "Sat", col: "12pm", value: 14 },
  { row: "Sat", col: "3pm", value: 12 },
  { row: "Sat", col: "6pm", value: 9 },
  { row: "Sun", col: "6am", value: 5 },
  { row: "Sun", col: "9am", value: 9 },
  { row: "Sun", col: "12pm", value: 13 },
  // "Sun" / "3pm" deliberately omitted — same reason as Tuesday's gap.
  { row: "Sun", col: "6pm", value: 8 },
];

const HEATMAP_VALUE_MIN = Math.min(...DATA.map((d) => d.value));
const HEATMAP_VALUE_MAX = Math.max(...DATA.map((d) => d.value));

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Heatmap title="Server load by day and time (% CPU)" data={[{ row: "Mon", col: "6am", value: 18 }, { row: "Mon", col: "9am", value: 52 }, /* ... */]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Heatmap"] ?? [] },
  {
    type: "doc-section",
    heading: "A missing cell isn't a zero",
    body: [
      {
        kind: "text",
        text: '`data` is sparse — a row×col combination absent from it renders as a distinct, flat neutral cell (`data-rebar-part="cell-missing"`), never blended into the same color scale a real recorded value of 0 would get (`data-rebar-part="cell"`). "No data was ever collected here" and "the value here is exactly zero" are different claims, and this chart keeps them visually distinct rather than picking one interpretation silently — on this page, that\'s a monitoring outage during Tuesday and Sunday\'s 3pm slot, not a real reading of 0% CPU.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "A plain opacity gradient, not a multi-hue scale",
    body: [
      {
        kind: "text",
        text: "The default `colorScale` blends the real `--rebar-color-primary` theme token toward transparent (8% at the minimum value, 100% at the maximum) via CSS `color-mix` — deliberately plain, matching this project's low-fidelity philosophy: a heatmap's job here is showing relative density at a glance, not a perceptually-calibrated multi-hue scale. A consuming app's own theme override still shows through, since it's the real token being blended, not a hardcoded hex.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Reading the color scale",
    body: [
      {
        kind: "text",
        text: `Shading is relative to whatever's in \`data\` — the lowest value renders lightest, the highest darkest. For the data on this page, that's ${HEATMAP_VALUE_MIN}% CPU (Sunday 6am, the quietest slot shown) through ${HEATMAP_VALUE_MAX}% (Wednesday noon, the hottest). There's no separate legend swatch — the plain opacity gradient is the whole scale, and every cell's exact number is available as a native tooltip on hover so nothing forces a reader to eyeball a shade.`,
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="heatmap"` on the root `<figure>`; each cell carries `data-rebar-part="cell"` or `"cell-missing"`, plus `data-row`/`data-col`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own (it recommends `@ant-design/charts`, a separate package built on G2Plot); there's no direct 1:1 antd component mapping for a heatmap.",
      },
    ],
  },
];

export default function HeatmapPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Heatmap</Heading>
      <Text color="secondary">
        A density grid — a missing data point renders distinctly from a real value of zero.
      </Text>

      <Heatmap title="Server load by day and time (% CPU)" data={DATA} cellSize={40} />
      <Text size="sm" color="secondary">
        Shading is relative to the values shown here — lightest to darkest, lowest to highest.
        Hover a cell for its exact figure.
      </Text>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
