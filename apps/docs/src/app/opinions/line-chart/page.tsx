import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A multi-series line chart over an ordered x-axis — for cumulative cost/measurement comparisons where one series may overtake another partway through, hence the optional crossoverIndex marker (a dashed vertical line labeled 'crossover'). Wraps the real LineChart component with the same series-toggle filter footer as scatter-chart. Promoted from this project's own /benchmarks iteration experiment." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "line-chart", title?: string, ariaLabel?: string, height?: number, xLabels: string[], labelStep?: number, crossoverIndex?: number, series: { label: string, color?: string, values: number[], dashed?: boolean }[] }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the line-chart block:" }],
  },
  {
      type: "line-chart",
      title: "Cumulative cost per round",
      xLabels: [
        "R0",
        "R1",
        "R2",
        "R3",
      ],
      crossoverIndex: 3,
      series: [
        {
          label: "antd",
          values: [
            10,
            20,
            30,
            42,
          ],
        },
        {
          label: "rebar-ui + migration",
          values: [
            22,
            28,
            35,
            40,
          ],
          dashed: true,
        },
      ],
    },
];

export default function LineChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Line Chart</Heading>
      <Text color="secondary">{"A multi-series line chart over an ordered x-axis — for cumulative cost/measurement comparisons where one series may overtake another partway through, hence the optional crossoverIndex marker (a dashed vertical line labeled 'crossover'). Wraps the real LineChart component with the same series-toggle filter footer as scatter-chart. Promoted from this project's own /benchmarks iteration experiment."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
