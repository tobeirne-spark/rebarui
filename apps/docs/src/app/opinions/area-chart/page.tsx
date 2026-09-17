import { AreaChart, Box, Heading, Stack, Text } from "rebar-ui";
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
        code: '<AreaChart title="Weekly traffic" xLabels={["W1","W2","W3","W4"]} series={[{ label: "Visitors", values: [1200,1550,1420,1890] }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["AreaChart"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "A multi-series area chart over an ordered x-axis — the same shape as `LineChart` (same scaling/label logic, reused exactly), with the area under each line filled using the series' own color at low opacity so overlapping series stay legible. `title` renders as a real, visible caption per [Design Heuristics](/about/agent) #16; a series' color defaults to a small built-in palette, cycled by series index, when omitted.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Trendline",
    body: [
      {
        kind: "text",
        text: "Set `trendline` to fit and draw a dashed ordinary-least-squares line per visible series over the filled area.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="area-chart"` on the root `<figure>`; the caption, when `title` is set, carries `data-rebar-part="title"`; `data-rebar-part="trendline"` on a fitted trendline.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own (it recommends pairing with a separate charting library, e.g. `@ant-design/charts`, built on G2Plot); a migration reimplements this chart against whichever charting library the target project already uses.",
      },
    ],
  },
];

export default function AreaChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>AreaChart</Heading>
      <Text color="secondary">
        A multi-series area chart over an ordered x-axis, with the area under each line filled at
        low opacity.
      </Text>

      <Box
        style={{
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
        }}
      >
        <AreaChart
          title="Weekly site traffic"
          xLabels={["W1", "W2", "W3", "W4", "W5", "W6"]}
          series={[{ label: "Visitors", values: [1200, 1550, 1420, 1890, 2100, 1975] }]}
        />
      </Box>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          <code>trendline</code> fits and draws a dashed OLS line per series.
        </Text>
        <Box
          style={{
            border: "1px solid var(--rebar-color-border, #e0e0e0)",
            borderRadius: 4,
            padding: "var(--rebar-space-lg)",
          }}
        >
          <AreaChart
            title="Noisy signal with trend"
            xLabels={["W1", "W2", "W3", "W4", "W5", "W6"]}
            trendline
            series={[{ label: "Visitors", values: [1200, 1550, 1420, 1890, 1700, 2050] }]}
          />
        </Box>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
