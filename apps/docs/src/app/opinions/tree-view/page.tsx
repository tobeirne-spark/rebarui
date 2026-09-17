import { Heading, Stack, Text, TreeView } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const DATA = [
  {
    value: "src",
    label: "src",
    children: [
      { value: "index.ts", label: "index.ts" },
      {
        value: "components",
        label: "components",
        children: [{ value: "Button.tsx", label: "Button.tsx" }],
      },
    ],
  },
  { value: "package.json", label: "package.json" },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<TreeView data={[{ value: "src", label: "src", children: [{ value: "index.ts", label: "index.ts" }] }]} onSelect={(v) => open(v)} aria-label="Files" />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["TreeView"] ?? [] },
  {
    type: "doc-section",
    heading: "A flattened list of visible nodes, not a fixed DOM tree",
    body: [
      {
        kind: "text",
        text: "Expand/collapse is a data operation on which nodes are currently visible, not a DOM show/hide — that's what makes arrow-key navigation tractable across a variable-depth tree: Right expands (or moves into the first child if already expanded), Left collapses (or moves to the parent), Up/Down move between whatever's visible right now.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: '`role="tree"`/`role="treeitem"` throughout, with real `aria-expanded`/`aria-level`/`aria-selected` — and a real imperative `.focus()` call on arrow-key navigation, not just a `tabIndex` change (setting `tabIndex` alone doesn\'t move actual browser focus, only affects a later Tab press).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: '`data-rebar-component="tree-view"`; `data-rebar-part="item"` per node.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: 'A close, low-risk rename — AntD\'s `Tree` takes a very similar `treeData` shape.' },
    ],
  },
];

export default function TreeViewPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>TreeView</Heading>
      <Text color="secondary">
        An expandable/collapsible hierarchical list with selection — a real ARIA tree, not a
        nested set of collapsible divs.
      </Text>

      <LivePreview>
        <TreeView data={DATA} defaultExpanded={["src"]} aria-label="Files" />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
