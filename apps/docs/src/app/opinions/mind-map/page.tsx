import { Heading, MindMap, Stack, Text } from "rebar-ui";
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
        code: '<MindMap topic="Launch plan" branches={[{ id: "design", label: "Design", children: [{ id: "wireframes", label: "Wireframes" }] }, { id: "build", label: "Build" }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["MindMap"] ?? [] },
  {
    type: "doc-section",
    heading: "Why hierarchical, not circular — a real comparison, not a default",
    body: [
      {
        kind: "text",
        text: '`NodeLinkGraph`\'s `"circular"` layout places every node — including the root — on one ring, spaced by flat array index with no awareness of parent/child structure. Handed a topic + branches + children, that puts the topic itself on the same ring as its own branches and grandchildren, with nothing left at the actual center — defeating the one thing a mind map needs most: a visually distinct hub. `"hierarchical"` isn\'t a literal radial burst either, but it correctly separates topic/branch/child into tiers by real tree structure, which reads as a correct mind map rather than a mis-centered one — so it\'s hardcoded here, the same way `OrgChart` hardcodes its own always-top-down layout.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Bionic reading on node labels",
    body: [
      {
        kind: "text",
        text: 'Topic/branch/child labels render as SVG `<text>`, which the ordinary `useBionicChildren` hook can\'t target — a plain HTML `<span>` isn\'t valid inside SVG `<text>` at all. `NodeLinkGraph` (which this component builds on) wires its default node/edge labels through a dedicated SVG-aware renderer instead, splitting each word into real `<tspan>` elements, so bionic reading applies here too, not just to the figcaption title.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="mind-map"` on the root; the underlying `NodeLinkGraph`\'s own toolbar/node/edge parts render underneath unchanged.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no diagramming components of its own; a mind map typically migrates to a dedicated library (e.g. DHTMLX Diagram) rather than an antd component.",
      },
    ],
  },
];

export default function MindMapPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>MindMap</Heading>
      <Text color="secondary">
        A radial-reading node diagram — a central topic, branches, and one level of children.
      </Text>

      <LivePreview>
        <MindMap
          topic="Launch plan"
          branches={[
            { id: "design", label: "Design", children: [{ id: "wireframes", label: "Wireframes" }, { id: "review", label: "Review" }] },
            { id: "build", label: "Build", children: [{ id: "backend", label: "Backend" }] },
            { id: "marketing", label: "Marketing" },
          ]}
        />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
