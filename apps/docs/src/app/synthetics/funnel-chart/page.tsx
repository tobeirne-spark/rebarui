import { Box, FunnelChart, Heading, Stack, Text } from "rebar-ui";
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
        code: '<FunnelChart title="Signup funnel" stages={[{ label: "Visitors", value: 42000 }, { label: "Signups", value: 6300 }, { label: "Purchases", value: 1150 }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["FunnelChart"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "A staged, narrowing-bar chart (Visitors → Signups → Purchases, ...) — each stage's width scaled against the first stage's value, drawn as a smoothly-curved (bezier) shape that eases from its own width down to the next stage's, so the whole shape reads as one continuous funnel rather than stacked, angular trapezoids. Colors default to a small built-in palette, cycled by stage index, when a stage omits its own. `milestones` adds a dashed target/checkpoint line (e.g. an industry benchmark) at a specific stage boundary, the same visual convention `LineChart`'s own `crossoverIndex` marker uses.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="funnel-chart"` on the root `<figure>`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own (it recommends `@ant-design/charts`, a separate package built on G2Plot); there's no direct 1:1 antd component mapping for a funnel chart, so a migration reimplements this chart against whichever charting library the target project already uses.",
      },
    ],
  },
];

export default function FunnelChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>FunnelChart</Heading>
      <Text color="secondary">
        A staged, narrowing-bar chart — each stage&apos;s width scaled against the first
        stage&apos;s value, tapering into the next.
      </Text>

      <Box
        style={{
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
        }}
      >
        <FunnelChart
          title="Signup funnel"
          stages={[
            { label: "Visitors", value: 42000 },
            { label: "Signups", value: 6300 },
            { label: "Purchases", value: 1150 },
          ]}
          milestones={[{ afterStageIndex: 0, label: "Industry benchmark: 12%" }]}
        />
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
