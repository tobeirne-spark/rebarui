import { BarChart, Box, Heading, Stack, Text } from "rebar-ui";
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
        code: '<BarChart title="Monthly signups" bars={[{ label: "Jan", value: 120 }, { label: "Feb", value: 180 }, { label: "Mar", value: 145 }, { label: "Apr", value: 210 }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["BarChart"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "A single-series bar chart — one bar per category, for a plain category-to-value comparison (monthly totals, per-item counts). A direct simplification of `StackedBarChart` (each bar has exactly one segment instead of several) — reuses its exact axis/scaling math. `title` renders as a real, visible caption per [Design Heuristics](/about/agent) #16; a bar's color defaults to a small built-in palette, cycled by bar index, when omitted.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Trendline",
    body: [
      {
        kind: "text",
        text: "Set `trendline` to fit a dashed ordinary-least-squares line across all bars, treating bar index as x. Only meaningful when the bars represent an ordered sequence (e.g. months), not an arbitrary unordered category list.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="bar-chart"` on the root `<figure>`; the caption, when `title` is set, carries `data-rebar-part="title"`; `data-rebar-part="trendline"` on a fitted trendline.',
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

export default function BarChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>BarChart</Heading>
      <Text color="secondary">
        A single-series bar chart — one bar per category, for a plain category-to-value
        comparison.
      </Text>

      <Box
        style={{
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
        }}
      >
        <BarChart
          title="Monthly signups"
          bars={[
            { label: "Jan", value: 120 },
            { label: "Feb", value: 180 },
            { label: "Mar", value: 145 },
            { label: "Apr", value: 210 },
            { label: "May", value: 265 },
          ]}
        />
      </Box>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          <code>trendline</code> fits a dashed OLS line across all bars.
        </Text>
        <Box
          style={{
            border: "1px solid var(--rebar-color-border, #e0e0e0)",
            borderRadius: 4,
            padding: "var(--rebar-space-lg)",
          }}
        >
          <BarChart
            title="Monthly signups"
            trendline
            bars={[
              { label: "Jan", value: 120 },
              { label: "Feb", value: 180 },
              { label: "Mar", value: 145 },
              { label: "Apr", value: 210 },
              { label: "May", value: 265 },
            ]}
          />
        </Box>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
