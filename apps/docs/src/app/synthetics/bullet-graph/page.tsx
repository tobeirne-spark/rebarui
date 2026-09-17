import { Box, BulletGraph, Heading, Stack, Text } from "rebar-ui";
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
        code: '<BulletGraph title="Q3 KPIs" measures={[{ label: "Revenue", value: 275, target: 250, ranges: [150, 225, 300] }, { label: "Profit margin", value: 40, target: 60, ranges: [30, 60, 90] }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["BulletGraph"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "Stephen Few's bullet graph — a single measure bar against a target tick, judged in context by three qualitative range bands (e.g. poor/satisfactory/good) instead of a full gauge/dial's worth of chrome. Several measures stack as rows in one chart, each independently scaled to its own `ranges`.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="bullet-graph"` on the root `<figure>`; `data-rebar-part="measure"` per row, `"measure-bar"` and `"target"` within it.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no bullet-graph component of its own; a migration typically composes a thin `Progress` bar with a custom target-tick overlay, or adopts a dedicated dataviz library.",
      },
    ],
  },
];

export default function BulletGraphPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>BulletGraph</Heading>
      <Text color="secondary">
        A single measure bar against a target tick, judged in context by three qualitative range
        bands.
      </Text>

      <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-lg)" }}>
        <BulletGraph
          title="Q3 KPIs"
          measures={[
            { label: "Revenue", value: 275, target: 250, ranges: [150, 225, 300] },
            { label: "Profit margin", value: 40, target: 60, ranges: [30, 60, 90] },
          ]}
        />
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
