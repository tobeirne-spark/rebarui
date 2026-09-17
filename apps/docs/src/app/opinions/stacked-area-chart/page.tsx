import { Box, Heading, Stack, StackedAreaChart, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<StackedAreaChart title="Signups" xLabels={["Jan","Feb","Mar","Apr"]} series={[{ label: "Free", values: [10, 15, 22, 28] }, { label: "Paid", values: [5, 8, 12, 18] }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["StackedAreaChart"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "Each series' band stacks on top of the ones before it in `series` order — showing both each series' own shape *and* the running total (the topmost band's upper edge) at once, the composition-over-time counterpart to `StackedBarChart`. Each band is filled solid (not the low-opacity overlap `AreaChart` uses), since stacked bands never overlap each other by construction, with a thin divider line between bands for legibility.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Series filtering",
    body: [
      {
        kind: "text",
        text: "Set `filterable` for a toggle row below the chart — hiding a series drops its whole band and the bands above it collapse down to fill the gap, the same behavior `StackedBarChart`'s own `filterable` segments already have.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="stacked-area-chart"` on the root `<figure>`; `data-rebar-part="mark"` on each point.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own; a migration typically maps directly to whatever charting library's own \"stacked area\" mode the target project uses.",
      },
    ],
  },
];

export default function StackedAreaChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>StackedAreaChart</Heading>
      <Text color="secondary">
        A multi-series area chart where each series&apos; band stacks on top of the ones before it.
      </Text>

      <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-lg)" }}>
        <StackedAreaChart
          title="Signups"
          xLabels={["Jan", "Feb", "Mar", "Apr"]}
          series={[
            { label: "Free", values: [10, 15, 22, 28] },
            { label: "Paid", values: [5, 8, 12, 18] },
          ]}
        />
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
