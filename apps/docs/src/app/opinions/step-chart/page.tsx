import { Box, Heading, Stack, StepChart, Text } from "rebar-ui";
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
        code: '<StepChart title="Interest rate" xLabels={["Q1","Q2","Q3","Q4"]} series={[{ label: "Base rate", values: [1.5, 2, 2, 3.5] }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["StepChart"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: '`step` (`"after"` by default, or `"before"`/`"middle"`) picks where the right-angle jump happens between two points. For a value that holds constant between discrete change events (an interest rate, an inventory level, a feature-flag rollout percentage), a diagonal `LineChart` would visually imply a gradual change that never actually happened — this draws the real staircase instead.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="step-chart"` on the root `<figure>`; `data-rebar-part="mark"` on each point, `"trendline"` on a trendline when `trendline` is set.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own; a migration typically maps directly to whatever charting library's own \"step\" line-interpolation option the target project uses.",
      },
    ],
  },
];

export default function StepChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>StepChart</Heading>
      <Text color="secondary">
        A line chart drawn with right-angle staircase segments instead of diagonal ones, for values
        that hold constant between discrete change points.
      </Text>

      <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-lg)" }}>
        <StepChart title="Interest rate" xLabels={["Q1", "Q2", "Q3", "Q4"]} series={[{ label: "Base rate", values: [1.5, 2, 2, 3.5] }]} />
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
