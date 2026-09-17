import { Box, Heading, Stack, StackedLineChart, Text } from "rebar-ui";
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
        code: '<StackedLineChart title="Signups" xLabels={["Jan","Feb","Mar","Apr"]} series={[{ label: "Free", values: [10, 15, 22, 28] }, { label: "Paid", values: [5, 8, 12, 18] }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["StackedLineChart"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "Each line plots a *cumulative running total* (itself plus every series stacked below it in `series` order), not its own raw values — the topmost line is always the grand total. Shows each series' individual contribution to a growing whole without the visual weight `StackedAreaChart`'s filled bands carry, useful when the reader mainly needs to compare shapes/slopes rather than read the exact fill volume at a glance.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Series filtering",
    body: [
      {
        kind: "text",
        text: "Set `filterable` for a toggle row below the chart — hiding a series drops it from the stack entirely and the remaining lines' cumulative sums recompute without it, the same behavior `StackedBarChart`'s own `filterable` segments already have.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="stacked-line-chart"` on the root `<figure>`; `data-rebar-part="mark"` on each point.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own; a migration typically pre-computes the same cumulative sums and feeds them to whatever charting library's own line chart the target project uses.",
      },
    ],
  },
];

export default function StackedLineChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>StackedLineChart</Heading>
      <Text color="secondary">
        A multi-series line chart where each line plots a cumulative running total, not raw values
        — the composition-over-time counterpart to `LineChart`.
      </Text>

      <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-lg)" }}>
        <StackedLineChart
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
