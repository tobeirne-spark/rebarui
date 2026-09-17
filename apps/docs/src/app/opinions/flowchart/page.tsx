import { Flowchart, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Flowchart steps={[{ id: "start", label: "Start", shape: "start-end", next: ["check"] }, { id: "check", label: "Valid?", shape: "decision", next: ["yes", "no"] }, /* ... */]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Flowchart"] ?? [] },
  {
    type: "doc-section",
    heading: "Edges from next, not parentId — because a decision fans out",
    body: [
      {
        kind: "text",
        text: '`OrgChart` derives edges from a single-parent `parentId`; a flowchart step can flow into more than one target (a decision\'s yes/no branches), which a one-parent model can\'t express — so edges come from each step\'s own `next` array instead. Shapes render distinctly via `renderNode`: `"process"` a plain rounded rect, `"decision"` a diamond, `"start-end"` a pill.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "A documented layout limitation",
    body: [
      {
        kind: "text",
        text: 'Layout depth needs one synthetic parent per step, fabricated as "the first step whose `next` list names it" — a best-effort visual layout, not a claim of a true topological sort. Every edge from `next` is still real and always drawn; a flowchart with genuine loops or multiple rejoining paths renders correctly, just not necessarily in the most visually optimal arrangement.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Bionic reading",
    body: [
      {
        kind: "text",
        text: 'Both the figcaption `title` and each step\'s own label now support bionic reading — the title via the ordinary `useBionicChildren` hook, and each step\'s SVG `<text>` label (drawn via this component\'s own `renderNode`, since a plain HTML `<span>` isn\'t valid inside SVG `<text>` at all) via the SVG-specific `renderBionicSvgText`, splitting into real `<tspan>` elements. `bionic`/`bionicOptions` props added to cover both.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="flowchart"` on the root; the underlying `NodeLinkGraph`\'s own toolbar/node/edge parts render underneath unchanged.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no diagramming components of its own; structured flowchart/BPMN shapes typically migrate to a dedicated library (JointJS, mxGraph) rather than an antd component.",
      },
    ],
  },
];

export default function FlowchartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Flowchart</Heading>
      <Text color="secondary">
        Structured process/decision/start-end shapes — edges derived from each step's own outgoing
        flow.
      </Text>

      <LivePreview>
        <Flowchart
          steps={[
            { id: "start", label: "Start", shape: "start-end", next: ["check"] },
            { id: "check", label: "Valid?", shape: "decision", next: ["yes", "no"] },
            { id: "yes", label: "Process order", shape: "process", next: ["end"] },
            { id: "no", label: "Reject", shape: "process", next: ["end"] },
            { id: "end", label: "End", shape: "start-end" },
          ]}
        />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
