import type { ReactNode } from "react";
import { Box, Heading, PieChart, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BROWSER_SLICES = [
  { label: "Chrome", value: 65 },
  { label: "Safari", value: 18 },
  { label: "Edge", value: 8 },
  { label: "Firefox", value: 5 },
  { label: "Other", value: 4 },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<PieChart title="Browser market share" slices={[{ label: "Chrome", value: 65 }, { label: "Safari", value: 18 }, { label: "Edge", value: 8 }, { label: "Firefox", value: 5 }, { label: "Other", value: 4 }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["PieChart"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "A proportional slice chart — pie by default, donut via `innerRadiusRatio` — for showing how a small number of parts make up a whole. Colors default to a small built-in palette, cycled by slice index, when a slice omits its own.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Label position",
    body: [
      {
        kind: "text",
        text: '`labelPosition` controls where each slice\'s label/percentage appears: `"legend"` (default) — a swatch + label + percentage row below the arcs, unchanged from before. `"inside"` — the percentage centered inside each slice wide enough to hold it legibly (a sliver under ~6% of the total stays unlabeled rather than overflowing). `"outside"` — label + percentage placed just past the arc with a short leader line, the standard convention for a pie with several small slices where "inside" text would be illegible. The legend row is omitted for `"inside"`/`"outside"`, since the per-slice labels already carry the same information — showing both would be redundant.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Exploded slices",
    body: [
      {
        kind: "text",
        text: 'A per-slice `exploded?: boolean` flag pushes that slice outward from the center — the standard "exploded pie" convention for calling attention to one or more slices, independent of `labelPosition`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="pie-chart"` on the root `<figure>`; parts: `slice-group`, `slice` (carries `data-rebar-exploded` when that slice is popped out), `legend`, `inside-label`, `outside-label`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own (it recommends `@ant-design/charts`, a separate package built on G2Plot); there's no direct 1:1 antd component mapping for a pie chart, so a migration reimplements this chart against whichever charting library the target project already uses.",
      },
    ],
  },
];

function Mutation({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap="xs">
      <Text size="sm" color="secondary">
        {label}
      </Text>
      <Box
        style={{
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
        }}
      >
        {children}
      </Box>
    </Stack>
  );
}

export default function PieChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>PieChart</Heading>
      <Text color="secondary">
        A proportional slice chart — pie by default, donut via <code>innerRadiusRatio</code> — with
        a legend row below the arcs by default.
      </Text>

      <Mutation label="Default (legend)">
        <PieChart title="Browser market share" slices={BROWSER_SLICES} />
      </Mutation>

      <Stack direction="row" gap="lg" style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
        <Mutation label='labelPosition="inside"'>
          <PieChart title="Browser market share" slices={BROWSER_SLICES} labelPosition="inside" />
        </Mutation>
        <Mutation label='labelPosition="outside"'>
          <PieChart title="Browser market share" slices={BROWSER_SLICES} labelPosition="outside" />
        </Mutation>
        <Mutation label="Donut mode (innerRadiusRatio)">
          <PieChart title="Browser market share" slices={BROWSER_SLICES} innerRadiusRatio={0.6} />
        </Mutation>
        <Mutation label="Exploded slice">
          <PieChart
            title="Browser market share"
            slices={BROWSER_SLICES.map((s, i) => (i === 0 ? { ...s, exploded: true } : s))}
          />
        </Mutation>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
