import { GeoChart, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const REGIONS = [
  { id: "wa", label: "WA", value: 187 },
  { id: "nt", label: "NT", value: 23 },
  { id: "sa", label: "SA", value: 104 },
  { id: "qld", label: "QLD", value: 298 },
  { id: "nsw", label: "NSW", value: 412 },
  { id: "vic", label: "VIC", value: 356 },
  { id: "tas", label: "TAS", value: 42 },
];

// Rough approximation of each state/territory's real position on a map of Australia — this is
// exactly the scenario GeoChart's `layout` prop exists for (see "An abstract grid, not real
// cartography" below): NT/QLD across the north, WA alone in the west, SA in the center, NSW/VIC/TAS
// down the east and southeast.
const LAYOUT = [
  { id: "nt", row: 0, col: 1 },
  { id: "qld", row: 0, col: 2 },
  { id: "wa", row: 1, col: 0 },
  { id: "sa", row: 1, col: 1 },
  { id: "nsw", row: 1, col: 2 },
  { id: "vic", row: 2, col: 1 },
  { id: "tas", row: 2, col: 2 },
];

const VALUE_MIN = Math.min(...REGIONS.map((r) => r.value));
const VALUE_MAX = Math.max(...REGIONS.map((r) => r.value));

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<GeoChart title="New customers by state, Q3" regions={[{ id: "nsw", label: "NSW", value: 412 }, { id: "vic", label: "VIC", value: 356 }, /* ... */]} layout={[{ id: "nsw", row: 1, col: 2 }, /* ... */]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["GeoChart"] ?? [] },
  {
    type: "doc-section",
    heading: "An abstract grid, not real cartography",
    body: [
      {
        kind: "text",
        text: "This is deliberately **not** a real geographic map renderer — that would require either a mapping dependency with real GeoJSON/TopoJSON border data, or an enormous hand-authored path dataset, both out of scope for this project's low-fidelity, no-heavy-dependency philosophy. Instead, `GeoChart` is an abstract regional grid choropleth: think of it as a `Heatmap` whose cells you position like a map (`layout` gives each region an explicit row/column), using the exact same `color-mix` opacity-gradient default `Heatmap` uses. Real geographic rendering is a genuine future gap, not something this component pretends to solve.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Reading the color scale",
    body: [
      {
        kind: "text",
        text: `Shading is relative to whatever's in \`regions\` — the lowest value renders lightest, the highest darkest, and everything else interpolates between. For the data on this page: the lightest cell is the state with the fewest new customers (${VALUE_MIN}), the darkest the state with the most (${VALUE_MAX}). There's no separate legend swatch — the plain opacity gradient is the whole scale, and each cell's exact number is available as a native tooltip on hover (see the \`<title>\` element in its markup) so nothing forces a reader to eyeball a shade.`,
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="geo-chart"` on the root `<figure>`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own; a real geographic choropleth typically migrates to a dedicated mapping library (e.g. `@ant-design/charts`' geo chart, built on real GeoJSON) rather than an antd component, since this component's own abstraction wouldn't carry over as-is.",
      },
    ],
  },
];

export default function GeoChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>GeoChart</Heading>
      <Text color="secondary">
        A data-shaded regional grid — an abstract choropleth, not real geographic rendering.
      </Text>

      <GeoChart
        title="New customers by state, Q3"
        regions={REGIONS}
        layout={LAYOUT}
        cellSize={64}
      />
      <Text size="sm" color="secondary">
        Grid position roughly approximates each state&rsquo;s real position on a map of Australia (see
        &ldquo;An abstract grid, not real cartography&rdquo; below); shading is relative to the
        values shown here — lightest to darkest, lowest to highest. Hover a cell for its exact
        figure.
      </Text>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
