import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A small, static, presentational summary table — headers plus a plain grid of string/number cells, no sorting/selection/pagination. Distinct from table (which pairs the real Table component with search/filters over row objects): this exists for the exact headers-plus-rows-of-cells shape a benchmark results table needs, with no column-keyed object indirection to build. Renders through the same real Table component underneath, just without the extra props that would invite features this kind of static presentational table doesn't need." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "stats-table", headers: string[], rows: (string | number)[][] }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the stats-table block:" }],
  },
  {
      type: "stats-table",
      headers: [
        "Metric",
        "antd",
        "rebar-ui",
      ],
      rows: [
        [
          "Tokens",
          31231,
          30211,
        ],
        [
          "Wall clock (s)",
          42,
          18,
        ],
      ],
    },
];

export default function StatsTablePage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Stats Table</Heading>
      <Text color="secondary">{"A small, static, presentational summary table — headers plus a plain grid of string/number cells, no sorting/selection/pagination. Distinct from table (which pairs the real Table component with search/filters over row objects): this exists for the exact headers-plus-rows-of-cells shape a benchmark results table needs, with no column-keyed object indirection to build. Renders through the same real Table component underneath, just without the extra props that would invite features this kind of static presentational table doesn't need."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
