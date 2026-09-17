import { Box, Heading, RibbonChart, Stack, Text } from "rebar-ui";
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
        code: '<RibbonChart title="Leaderboard" xLabels={["Q1","Q2","Q3","Q4"]} series={[{ label: "Team Alpha", values: [10, 30, 25, 40] }, { label: "Team Beta", values: [30, 10, 35, 20] }, { label: "Team Gamma", values: [20, 20, 15, 30] }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["RibbonChart"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "A rank-based ribbon/bump chart — each series is a thick band whose vertical position at every x step reflects its *rank* among the other series there (1st, 2nd, 3rd, ...), not its raw value. Built for leaderboard-style \"who's ahead over time\" comparisons where the relative order matters more than the exact magnitude gap between series — see `LineChart`/`StackedLineChart` for magnitude-based comparisons instead. Ties are broken by each series' own position in `series` (stable), so a tie never flickers rank between two otherwise-identical values.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="ribbon-chart"` on the root `<figure>`; `data-rebar-part="mark"` on each ribbon.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own; a migration typically pre-computes the same per-position ranks and feeds them to a bump-chart implementation in whatever charting library the target project uses.",
      },
    ],
  },
];

export default function RibbonChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>RibbonChart</Heading>
      <Text color="secondary">
        A rank-based ribbon/bump chart — each series&apos; vertical position reflects its rank at
        each x step, not its raw value.
      </Text>

      <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-lg)" }}>
        <RibbonChart
          title="Leaderboard"
          xLabels={["Q1", "Q2", "Q3", "Q4"]}
          series={[
            { label: "Team Alpha", values: [10, 30, 25, 40] },
            { label: "Team Beta", values: [30, 10, 35, 20] },
            { label: "Team Gamma", values: [20, 20, 15, 30] },
          ]}
        />
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
