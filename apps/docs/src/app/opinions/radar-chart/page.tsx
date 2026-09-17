import { Box, Heading, RadarChart, Stack, Text } from "rebar-ui";
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
        code: '<RadarChart axes={["Speed", "Power", "Range", "Price", "Support"]} series={[{ label: "Standard", values: [60, 55, 50, 80, 65] }, { label: "Pro", values: [90, 85, 75, 40, 90] }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["RadarChart"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "A multi-axis polygon comparison chart (\"radar\"/\"spider\" chart) — one filled polygon per series, each vertex scaled along its own axis from a shared center. Built for comparing several items across the same small set of dimensions (e.g. a product/spec comparison) at a glance. `title` renders as a real, visible caption per [Design Heuristics](/about/agent) #16 (charts ship with context, not just an accessible name); colors default to a small built-in palette, cycled by series index, when a series omits its own — see [StackedBarChart](/opinions/stacked-bar-chart)'s own page for the exact default-palette order every chart in this library shares.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="radar-chart"` on the root `<figure>`.',
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

export default function RadarChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>RadarChart</Heading>
      <Text color="secondary">
        One filled polygon per series, each vertex scaled along its own axis from a shared
        center — for comparing several items across the same dimensions at a glance.
      </Text>
      <Text size="sm" color="secondary">
        Set <code>filterable</code> to make each legend item a real toggle button — click one to
        hide/show its own series (try it below). The axis scale stays fixed to the full dataset
        either way, so the remaining series don&apos;t jump to a new scale.
      </Text>

      <Box
        style={{
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
        }}
      >
        <RadarChart
          title="Product tier comparison"
          axes={["Speed", "Power", "Range", "Price", "Support"]}
          series={[
            { label: "Standard", values: [60, 55, 50, 80, 65] },
            { label: "Pro", values: [90, 85, 75, 40, 90] },
          ]}
          filterable
        />
      </Box>

      <Stack direction="row" gap="lg" style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
        <Stack gap="xs">
          <Text size="sm" color="secondary">
            3 axes (a triangle)
          </Text>
          <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-lg)" }}>
            <RadarChart
              title="Skill triangle"
              axes={["Attack", "Defense", "Speed"]}
              series={[{ label: "Hero", values: [70, 55, 85] }]}
            />
          </Box>
        </Stack>
        <Stack gap="xs">
          <Text size="sm" color="secondary">
            8 axes (an octagon)
          </Text>
          <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-lg)" }}>
            <RadarChart
              title="Full skill spread"
              axes={["STR", "DEX", "CON", "INT", "WIS", "CHA", "LCK", "SPD"]}
              series={[
                { label: "Character A", values: [80, 60, 70, 50, 40, 65, 55, 75] },
                { label: "Character B", values: [45, 85, 50, 70, 60, 40, 80, 55] },
              ]}
            />
          </Box>
        </Stack>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
