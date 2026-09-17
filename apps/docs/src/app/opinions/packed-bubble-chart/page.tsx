import { Box, Heading, PackedBubbleChart, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const FLAT = [
  { label: "PDF", value: 420 },
  { label: "DOCX", value: 210 },
  { label: "Markdown", value: 340 },
  { label: "HTML", value: 90 },
  { label: "CSV", value: 60 },
  { label: "TXT", value: 150 },
];

const GROUPED = [
  { label: "PDF", value: 420, group: "Documents" },
  { label: "DOCX", value: 210, group: "Documents" },
  { label: "Markdown", value: 340, group: "Code" },
  { label: "HTML", value: 90, group: "Code" },
  { label: "CSV", value: 60, group: "Data" },
  { label: "JSON", value: 130, group: "Data" },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<PackedBubbleChart title="Chunks by file type" items={[{ label: "PDF", value: 420 }, { label: "Markdown", value: 340 }, /* ... */]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["PackedBubbleChart"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "Each item is a circle sized by `value` (area, not radius, so a reader compares them the way they actually perceive size), packed tightly with a real circle-packing algorithm — no overlaps. Distinct from `BubbleChart` (a real x/y scatter plot with size as a third encoded dimension on real axes): this has no axes at all — position only expresses \"fits densely here,\" never a measured x/y value.",
      },
      {
        kind: "text",
        text: "`grouped` (auto-detected the moment any item sets `group`) packs same-group items into their own cluster first, then packs the clusters together — a real two-level hierarchical packing, shown below with a faint dashed boundary per cluster.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="packed-bubble-chart"` on the root `<figure>`; `data-rebar-part="mark"` per circle, `"group"` on a cluster boundary in grouped mode.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own; a migration typically adopts a dedicated circle-packing library (e.g. d3-hierarchy's `pack` layout) directly.",
      },
    ],
  },
];

export default function PackedBubbleChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>PackedBubbleChart</Heading>
      <Text color="secondary">
        Each item is a circle sized by value, packed tightly with no overlaps — optionally grouped
        into clusters.
      </Text>

      <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-lg)" }}>
        <PackedBubbleChart title="Chunks by file type" items={FLAT} />
      </Box>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          Grouped — same-<code>group</code> items pack into their own cluster first.
        </Text>
        <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-lg)" }}>
          <PackedBubbleChart title="Chunks by file type, grouped" items={GROUPED} />
        </Box>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
