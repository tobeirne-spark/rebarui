import { Heading, SankeyDiagram, Stack, Text } from "rebar-ui";
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
        code: '<SankeyDiagram title="Signup funnel" nodes={[{ id: "visit", label: "Visit" }, { id: "signup", label: "Signup" }, { id: "paid", label: "Paid" }]} links={[{ source: "visit", target: "signup", value: 400 }, { source: "signup", target: "paid", value: 120 }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["SankeyDiagram"] ?? [] },
  {
    type: "doc-section",
    heading: "Curved links, not filled ribbons",
    body: [
      {
        kind: "text",
        text: "Links render as semi-transparent stroked cubic-bezier curves between each node's own vertical center, thickness proportional to `value` — a simpler, honest stand-in for the filled, proportional-width ribbon paths a full Sankey library would draw. Node columns (depth) are computed from link direction — a node with no incoming links lands in column 0 — via a bounded-pass propagation that terminates even on a cyclic graph, rather than requiring the input to form a strict DAG.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="sankey-diagram"` on the root `<figure>`; each node carries `data-rebar-node-column`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own (it recommends `@ant-design/charts`, built on G2Plot); there's no direct 1:1 antd component mapping for a Sankey diagram.",
      },
    ],
  },
];

export default function SankeyDiagramPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>SankeyDiagram</Heading>
      <Text color="secondary">
        A flow/volume-between-nodes diagram — link thickness proportional to value.
      </Text>

      <SankeyDiagram
        title="Signup funnel"
        nodes={[
          { id: "visit", label: "Visit" },
          { id: "signup", label: "Signup" },
          { id: "trial", label: "Trial" },
          { id: "paid", label: "Paid" },
          { id: "churn", label: "Churned" },
        ]}
        links={[
          { source: "visit", target: "signup", value: 400 },
          { source: "signup", target: "trial", value: 260 },
          { source: "trial", target: "paid", value: 90 },
          { source: "trial", target: "churn", value: 170 },
        ]}
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
