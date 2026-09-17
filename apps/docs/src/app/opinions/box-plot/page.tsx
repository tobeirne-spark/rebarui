"use client";

import { Box, BoxPlot, Heading, Stack, Text } from "rebar-ui";
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
        code: '<BoxPlot title="API response time (ms)" groups={[{ label: "Platform", min: 80, q1: 120, median: 150, q3: 190, max: 260 }, { label: "Billing", min: 95, q1: 140, median: 175, q3: 230, max: 340 }, { label: "Search", min: 60, q1: 90, median: 110, q3: 140, max: 210 }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["BoxPlot"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "A statistical distribution chart — each group drawn as a vertical box-and-whisker from a pre-computed five-number summary (min/q1/median/q3/max), side by side on a shared numeric y-scale. Built for comparing the spread of several groups' worth of a measured value at a glance, without plotting every raw sample. This component draws the box/whiskers from the summary you supply — it doesn't compute quartiles from raw sample data. `title` renders as a real, visible caption per [Design Heuristics](/about/agent) #16 (charts ship with context, not just an accessible name); colors default to a small built-in palette, cycled by group index, when a group omits its own.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="box-plot"` on the root `<figure>`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own (it recommends pairing with a separate charting library, e.g. `@ant-design/charts`); a migration reimplements this chart against whichever charting library the target project already uses.",
      },
    ],
  },
];

export default function BoxPlotPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>BoxPlot</Heading>
      <Text color="secondary">
        Each group drawn as a vertical box-and-whisker from a pre-computed five-number summary,
        side by side on a shared numeric y-scale.
      </Text>

      <Box
        style={{
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
        }}
      >
        <BoxPlot
          title="API response time (ms), by team"
          yFormat={(v) => `${Math.round(v)}ms`}
          groups={[
            { label: "Platform", min: 80, q1: 120, median: 150, q3: 190, max: 260 },
            { label: "Billing", min: 95, q1: 140, median: 175, q3: 230, max: 340 },
            { label: "Search", min: 60, q1: 90, median: 110, q3: 140, max: 210 },
          ]}
        />
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
