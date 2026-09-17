"use client";

import { Box, GaugeChart, Heading, Stack, Text } from "rebar-ui";
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
        code: '<GaugeChart title="Q3 goal progress" label="of target" value={72} min={0} max={100} valueFormat={(v) => `${v}%`} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["GaugeChart"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "A single-value radial dial — a half-circle track plus a filled arc showing where `value` sits between `min` and `max`, with the number itself printed in the center. Built for a single at-a-glance metric (a load %, a score) rather than a series over time. An overshoot past `max` still pegs the arc at full, but the raw, unclamped value is what's printed in the center — an overshoot is visible as a number, not silently hidden.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="gauge-chart"` on the root `<figure>`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own (it recommends `@ant-design/charts`, a separate package built on G2Plot); there's no direct 1:1 antd component mapping for a gauge chart, so a migration reimplements this chart against whichever charting library the target project already uses.",
      },
    ],
  },
];

export default function GaugeChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>GaugeChart</Heading>
      <Text color="secondary">
        A single-value radial dial — a half-circle track plus a filled arc showing where a value
        sits between a min and max.
      </Text>

      <Box
        style={{
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
        }}
      >
        <GaugeChart
          title="Q3 goal progress"
          label="of target"
          value={72}
          min={0}
          max={100}
          valueFormat={(v) => `${v}%`}
        />
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
