import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A stacked bar chart — each bar broken into labeled cost/quantity segments, with the bar's own total shown above it. Wraps the real StackedBarChart component with a filter footer toggling one distinct segment label across every bar at once (the 'series' here is the repeated category, not one specific bar). Promoted from this project's own /benchmarks 'vibe coding vs. hiring developers' scenario." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "stacked-bar-chart", title?: string, ariaLabel?: string, height?: number, bars: { label: string, segments: { label: string, value: number, color?: string }[] }[] }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the stacked-bar-chart block:" }],
  },
  {
      type: "stacked-bar-chart",
      title: "Cost composition",
      bars: [
        {
          label: "Hire developers",
          segments: [
            {
              label: "Build",
              value: 16800,
            },
            {
              label: "Revisions",
              value: 16800,
            },
          ],
        },
        {
          label: "AI-assisted",
          segments: [
            {
              label: "Oversight",
              value: 3500,
            },
          ],
        },
      ],
    },
];

export default function StackedBarChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Stacked Bar Chart</Heading>
      <Text color="secondary">{"A stacked bar chart — each bar broken into labeled cost/quantity segments, with the bar's own total shown above it. Wraps the real StackedBarChart component with a filter footer toggling one distinct segment label across every bar at once (the 'series' here is the repeated category, not one specific bar). Promoted from this project's own /benchmarks 'vibe coding vs. hiring developers' scenario."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
