import { GitGraph, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const COMMITS = [
  { id: "a1", parentIds: [], branch: "main", message: "Initial commit", author: "Ada" },
  { id: "b2", parentIds: ["a1"], branch: "main", message: "Add login page", author: "Ada" },
  { id: "c3", parentIds: ["b2"], branch: "feature/search", message: "Start search feature", author: "Grace" },
  { id: "d4", parentIds: ["b2"], branch: "main", message: "Fix typo in footer", author: "Ada" },
  { id: "e5", parentIds: ["c3"], branch: "feature/search", message: "Add search results page", author: "Grace" },
  { id: "f6", parentIds: ["d4", "e5"], branch: "main", message: "Merge search feature", author: "Ada" },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<GitGraph\n  commits={[\n    { id: "a1", parentIds: [], branch: "main", message: "Initial commit" },\n    { id: "b2", parentIds: ["a1"], branch: "main", message: "Add login page" },\n  ]}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["GitGraph"] ?? [] },
  {
    type: "doc-section",
    heading: "A purpose-built layout, not a NodeLinkGraph composition",
    body: [
      {
        kind: "text",
        text: "A git graph's layout rules (branch columns stay fixed for a branch's lifetime, commits flow chronologically along one axis, merge commits draw curved connectors to two parent columns) are genuinely different from NodeLinkGraph's general-purpose layouts, so this is standalone — the same reasoning GanttChart/SankeyDiagram already stand on.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Read-only, real visible text per commit",
    body: [
      {
        kind: "text",
        text: "Every commit shows a real visible short hash, branch name, and truncated message next to its dot — not tooltip-only — plus a visually-hidden full list of every commit for screen-reader users. Branch colors are assigned deterministically from a hash of the branch name, overridable via `branchColors`.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="git-graph"` on the root `<figure>`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no git-history visualization of its own; migrating typically means adopting a dedicated library (e.g. gitgraph.js) directly.",
      },
    ],
  },
];

export default function GitGraphPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>GitGraph</Heading>
      <Text color="secondary">
        A static visualization of a git commit history — branch columns, merge connectors, real
        visible commit text.
      </Text>

      <GitGraph commits={COMMITS} title="Project history" />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
