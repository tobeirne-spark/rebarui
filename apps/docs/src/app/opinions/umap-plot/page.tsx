import { Heading, Stack, Text, UMAPPlot } from "rebar-ui";
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
        code: '<UMAPPlot\n  title="Support corpus embeddings"\n  clusters={[\n    { label: "Billing", points: [{ x: 1.2, y: 0.4, id: "doc-14", preview: "Refunds are processed within 5 business days." }] },\n    { label: "Technical", points: [{ x: -2.1, y: 1.8, id: "doc-52", preview: "The app crashes on login after the latest update." }] },\n  ]}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["UMAPPlot"] ?? [] },
  {
    type: "doc-section",
    heading: "Built for browsing a vector database",
    body: [
      {
        kind: "text",
        text: "A UMAP (or t-SNE/PCA) reduction turns each stored embedding into one 2D point — this component's real, intended use is inspecting what's actually *in* a vector database: hover a point and its `preview` (the underlying record's real text content) shows up, not its raw coordinates. `id`/`preview` are both optional — omit them for a plain embedding plot with nothing else to show, in which case the tag falls back to printing the point's raw x/y.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "No numeric axis ticks, on purpose",
    body: [
      {
        kind: "text",
        text: 'A UMAP embedding\'s x/y values carry no real-world unit or interpretable scale on their own — only relative distance and clustering do. Printing tick numbers would imply a precision the values don\'t actually have, so this chart shows plain "UMAP-1"/"UMAP-2" dimension captions instead, the same convention umap-learn and scikit-learn\'s own example plots use.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Shared chart interaction",
    body: [
      {
        kind: "text",
        text: "Hovering a point shows its value tag; clicking makes that tag persist after the pointer moves away; clicking a different point swaps which one persists; clicking empty plot space clears the selection — the same `useChartMarkSelection` interaction every other chart in this family shares (see [Design Heuristics](/about/agent) heuristic #16).",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="umap-plot"` on the root `<figure>`; `data-rebar-part="point"` per point, `"cluster"` per cluster group, `"legend"`/`"legend-item"`/`"legend-swatch"` for the legend row.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own (it recommends `@ant-design/charts`, a separate package built on G2Plot); there's no direct 1:1 antd component mapping for a UMAP/embedding scatter plot.",
      },
    ],
  },
];

const CLUSTERS = [
  {
    label: "Billing",
    points: [
      { x: 3.1, y: 1.4, id: "doc-14", preview: "Refunds are processed within 5 business days of approval." },
      { x: 3.6, y: 0.9, id: "doc-31", preview: "You can update your card on file from the billing settings page." },
      { x: 2.7, y: 1.9, id: "doc-08" },
      { x: 3.3, y: 2.2 },
    ],
  },
  {
    label: "Technical support",
    points: [
      { x: -2.4, y: 2.1, id: "doc-52", preview: "The app crashes on login after the latest update on Android 14." },
      { x: -1.9, y: 1.6, id: "doc-77", preview: "Password reset emails can take up to 10 minutes to arrive." },
      { x: -2.8, y: 2.6 },
      { x: -1.5, y: 2.4, id: "doc-19" },
      { x: -2.2, y: 1.1 },
    ],
  },
  {
    label: "Product feedback",
    points: [
      { x: 0.4, y: -2.8, id: "doc-63", preview: "Requesting a dark mode toggle for the mobile app." },
      { x: 0.9, y: -3.3, id: "doc-90", preview: "The export-to-CSV button is hard to find in the new layout." },
      { x: -0.2, y: -2.4 },
    ],
  },
];

export default function UMAPPlotPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>UMAPPlot</Heading>
      <Text color="secondary">
        A 2D embedding scatter plot — the standard way to visualize a UMAP (or t-SNE/PCA)
        dimensionality reduction, built for browsing what a vector database actually contains.
      </Text>

      <UMAPPlot title="Support corpus embeddings, by topic cluster" clusters={CLUSTERS} />
      <Text size="xs" color="secondary">
        Hover or click a point to see the record it represents.
      </Text>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
