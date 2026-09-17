import { Box, Heading, Stack, Text, WaterfallChart } from "rebar-ui";
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
        code: '<WaterfallChart title="Q3 profit bridge" steps={[{ label: "Starting revenue", value: 120000, isTotal: true }, { label: "New sales", value: 34000 }, { label: "Upsells", value: 9500 }, { label: "Refunds", value: -6200 }, { label: "Churn", value: -18300 }, { label: "Ending revenue", value: 139000, isTotal: true }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["WaterfallChart"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "A cumulative incremental-change chart — a starting total, a sequence of +/- deltas, an ending total — where each bar floats at its own cumulative height rather than starting from zero (a total bar, set via `isTotal`, is the exception, always rendered from zero). Positive steps render in the success color, negative in the danger color, and total bars in the primary color, with a dashed connector between each bar and the next.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="waterfall-chart"` on the root `<figure>`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own (it recommends `@ant-design/charts`, a separate package built on G2Plot); there's no direct 1:1 antd component mapping for a waterfall chart, so a migration reimplements this chart against whichever charting library the target project already uses.",
      },
    ],
  },
];

export default function WaterfallChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>WaterfallChart</Heading>
      <Text color="secondary">
        A cumulative incremental-change chart — a starting total, a sequence of +/- deltas, and an
        ending total.
      </Text>

      <Box
        style={{
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
        }}
      >
        <WaterfallChart
          title="Q3 profit bridge"
          steps={[
            { label: "Starting revenue", value: 120000, isTotal: true },
            { label: "New sales", value: 34000 },
            { label: "Upsells", value: 9500 },
            { label: "Refunds", value: -6200 },
            { label: "Churn", value: -18300 },
            { label: "Ending revenue", value: 139000, isTotal: true },
          ]}
        />
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
