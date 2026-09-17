import { Box, Heading, Sparkline, Stack, Text } from "rebar-ui";
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
        code: '<Sparkline ariaLabel="Stock price, last 8 quarters" values={[42, 44, 41, 47, 52, 49, 55, 61]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Sparkline"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "A tiny, axis-less trend line — no ticks, no x labels, no legend, just the line itself, meant to sit inline (a table cell, a stat card). Reuses `LineChart`'s scaling math, stripped down to a single series and no chrome. `ariaLabel` is required, not optional — unlike the other charts, a sparkline has no visible caption of its own to fall back on for its accessible name.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="sparkline"` on the root `<svg>` itself — unlike the other charts, there is no wrapping `<figure>` and no `data-rebar-part`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own (it recommends pairing with a separate charting library, e.g. `@ant-design/charts`, built on G2Plot); a migration reimplements this inline trend line against whichever charting library the target project already uses.",
      },
    ],
  },
];

export default function SparklinePage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Sparkline</Heading>
      <Text color="secondary">
        A tiny, axis-less trend line meant to sit inline — a table cell, a stat card — with no
        ticks, labels, or legend.
      </Text>

      <Box
        style={{
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
        }}
      >
        <Text>
          Stock price (last 8 quarters):{" "}
          <Sparkline
            ariaLabel="Stock price, last 8 quarters"
            values={[42, 44, 41, 47, 52, 49, 55, 61]}
          />
        </Text>
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
