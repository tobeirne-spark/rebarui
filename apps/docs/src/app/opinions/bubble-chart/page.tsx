import { BubbleChart, Heading, Stack, Text } from "rebar-ui";
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
        code: '<BubbleChart title="Product lines: price vs. rating vs. volume" series={[{ label: "2026", points: [{ x: 12, y: 4.2, size: 800 }, { x: 25, y: 4.6, size: 2200 }, { x: 8, y: 3.9, size: 400 }] }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["BubbleChart"] ?? [] },
  {
    type: "doc-section",
    heading: "Sqrt scaling, not linear",
    body: [
      {
        kind: "text",
        text: "Marker radius scales with the square root of `size`, so *area* (what a viewer actually perceives) is proportional to the underlying value, not radius itself — a value 4x larger renders 2x the radius, not 4x, matching how human perception of circle size works. Radii are clamped to a fixed range so no point vanishes to nothing or overwhelms the chart.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Trendline",
    body: [
      {
        kind: "text",
        text: "Set `trendline` to fit a dashed ordinary-least-squares line per series over its real `(x, y)` points, drawn from the series' own min to max x.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="bubble-chart"` on the root `<figure>`; `data-rebar-part="trendline"` on a fitted trendline.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own (it recommends `@ant-design/charts`, a separate package built on G2Plot); there's no direct 1:1 antd component mapping for a bubble chart.",
      },
    ],
  },
];

export default function BubbleChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>BubbleChart</Heading>
      <Text color="secondary">
        A scatter chart with a third dimension encoded as marker size — sqrt-scaled so area, not
        radius, tracks the underlying value.
      </Text>

      <BubbleChart
        title="Product lines: price vs. rating vs. sales volume"
        series={[
          {
            label: "2026",
            points: [
              { x: 12, y: 4.2, size: 800 },
              { x: 25, y: 4.6, size: 2200 },
              { x: 8, y: 3.9, size: 400 },
              { x: 18, y: 4.4, size: 1300 },
              { x: 30, y: 4.1, size: 600 },
            ],
          },
        ]}
      />

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          <code>trendline</code> fits a dashed OLS line per series over its real points.
        </Text>
        <BubbleChart
          title="Product lines: price vs. rating vs. sales volume"
          trendline
          series={[
            {
              label: "2026",
              points: [
                { x: 12, y: 4.2, size: 800 },
                { x: 25, y: 4.6, size: 2200 },
                { x: 8, y: 3.9, size: 400 },
                { x: 18, y: 4.4, size: 1300 },
                { x: 30, y: 4.1, size: 600 },
              ],
            },
          ]}
        />
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
