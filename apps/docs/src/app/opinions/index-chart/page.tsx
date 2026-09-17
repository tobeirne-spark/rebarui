import { Box, Heading, IndexChart, Stack, Text } from "rebar-ui";
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
        code: '<IndexChart title="Relative performance" xLabels={["Jan","Feb","Mar","Apr"]} series={[{ label: "Fund A", values: [50, 54, 58, 61] }, { label: "Fund B", values: [200, 190, 210, 230] }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["IndexChart"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: '`series` is rebased internally to `baseValue` (default 100) at each series\' own first value — the standard "indexed to 100" comparison for series on very different absolute scales (comparing several funds\' relative performance regardless of their actual unit price). A dashed reference line marks `baseValue` itself. A series starting at 0 stays flat at `baseValue` rather than dividing by zero.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="index-chart"` on the root `<figure>`; `data-rebar-part="mark"` on each point, `"trendline"` on a trendline when `trendline` is set.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own; a migration typically pre-computes the same index-100 rebasing and feeds it to whatever charting library the target project already uses.",
      },
    ],
  },
];

export default function IndexChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>IndexChart</Heading>
      <Text color="secondary">
        A line chart that rebases every series to a common starting index (100 by default) instead
        of plotting raw values.
      </Text>

      <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-lg)" }}>
        <IndexChart
          title="Relative performance"
          xLabels={["Jan", "Feb", "Mar", "Apr"]}
          series={[
            { label: "Fund A", values: [50, 54, 58, 61] },
            { label: "Fund B", values: [200, 190, 210, 230] },
          ]}
        />
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
