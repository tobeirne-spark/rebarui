import { Box, Heading, Stack, SteppedBarChart, Text } from "rebar-ui";
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
        code: '<SteppedBarChart title="Daily active users" bars={[{ label: "Mon", value: 120 }, { label: "Tue", value: 180 }, { label: "Wed", value: 140 }, { label: "Thu", value: 220 }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["SteppedBarChart"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "No gutter between bars — each one spans its full category band, so the tops together form one continuous staircase silhouette, traced explicitly with a bold outline on top rather than left for the reader to infer from adjacency alone. For a category sequence where the *shape of change* across categories matters as much as each individual value — an ordinal axis, not `BarChart`'s independent, gapped comparisons.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="stepped-bar-chart"` on the root `<figure>`; `data-rebar-part="outline"` on the bold top-tracing polyline.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own; a migration typically sets `barGap: 0`/`barCategoryGap: 0` on whatever bar-chart component the target project uses, plus a separately-drawn outline overlay if the staircase silhouette itself needs to be kept.",
      },
    ],
  },
];

export default function SteppedBarChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>SteppedBarChart</Heading>
      <Text color="secondary">
        A bar chart with no gutter between bars — the tops form one continuous staircase
        silhouette.
      </Text>

      <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-lg)" }}>
        <SteppedBarChart
          title="Daily active users"
          bars={[
            { label: "Mon", value: 120 },
            { label: "Tue", value: 180 },
            { label: "Wed", value: 140 },
            { label: "Thu", value: 220 },
          ]}
        />
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
