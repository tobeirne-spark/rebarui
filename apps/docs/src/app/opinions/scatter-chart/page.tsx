import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A distribution scatter plot — each series' individual values plotted as a jittered column of points, with a dashed line marking that series' mean. Wraps the real ScatterChart component with a filter footer (one toggle button per series, click to hide/show it) — never a bare 1:1 pass-through, omitted entirely when there's only one series. Promoted from one-off SVG helpers this project's own /benchmarks pages used to keep locally — see it at real scale there. title renders as a real visible caption per Design Heuristics #16 (charts ship with context); colors default to a small built-in palette when a series omits its own." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "scatter-chart", title?: string, ariaLabel?: string, height?: number, series: { label: string, color?: string, values: number[] }[] }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the scatter-chart block:" }],
  },
  {
      type: "scatter-chart",
      title: "Token cost, antd vs. rebar-ui",
      series: [
        {
          label: "antd",
          values: [
            31231,
            31131,
            30891,
            31921,
            30950,
          ],
        },
        {
          label: "rebar-ui",
          values: [
            30211,
            30212,
            30149,
            30253,
            30180,
          ],
        },
      ],
    },
];

export default function ScatterChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Scatter Chart</Heading>
      <Text color="secondary">{"A distribution scatter plot — each series' individual values plotted as a jittered column of points, with a dashed line marking that series' mean. Wraps the real ScatterChart component with a filter footer (one toggle button per series, click to hide/show it) — never a bare 1:1 pass-through, omitted entirely when there's only one series. Promoted from one-off SVG helpers this project's own /benchmarks pages used to keep locally — see it at real scale there. title renders as a real visible caption per Design Heuristics #16 (charts ship with context); colors default to a small built-in palette when a series omits its own."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
