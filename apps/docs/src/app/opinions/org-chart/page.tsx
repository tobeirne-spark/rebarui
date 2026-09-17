import { Heading, OrgChart, Stack, Text } from "rebar-ui";
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
        code: '<OrgChart title="Leadership" people={[{ id: "ceo", name: "Amara Diallo", role: "CEO" }, { id: "cto", name: "Sam Ortiz", role: "CTO", parentId: "ceo" }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["OrgChart"] ?? [] },
  {
    type: "doc-section",
    heading: "role, not title — on purpose",
    body: [
      {
        kind: "text",
        text: 'Each person\'s job title is named `role`, not `title` — `OrgChartProps` already has its own `title` (the chart\'s visible caption, per ref/HEURISTICS.md #16), and reusing the word for a person-level field would make "title" ambiguous depending on which object you\'re reading. A thin, opinionated `NodeLinkGraph` specialization: `layout` is hardcoded to `"hierarchical"` (an org chart is always top-down), and one edge is generated automatically per non-root person — callers never supply `edges` directly.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Bionic reading on name/role labels",
    body: [
      {
        kind: "text",
        text: 'Each person\'s name/role render as SVG `<text>` via a custom `renderNode`, which the ordinary `useBionicChildren` hook can\'t target — a plain HTML `<span>` isn\'t valid inside SVG `<text>` at all. Both fields are split through the SVG-specific `renderBionicSvgText` instead, into real `<tspan>` elements, so bionic reading applies here too, not just to the figcaption title.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="org-chart"` on the root; the underlying `NodeLinkGraph`\'s own toolbar/node/edge parts render underneath unchanged.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no diagramming components of its own; an org chart typically migrates to a dedicated library (Google Charts' OrgChart, GoJS) rather than an antd component.",
      },
    ],
  },
];

export default function OrgChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>OrgChart</Heading>
      <Text color="secondary">
        A tree-shaped hierarchy diagram — always top-down, edges generated automatically from each
        person's own manager.
      </Text>

      <LivePreview>
        <OrgChart
          title="Leadership"
          people={[
            { id: "ceo", name: "Amara Diallo", role: "CEO" },
            { id: "cto", name: "Sam Ortiz", role: "CTO", parentId: "ceo" },
            { id: "cfo", name: "Priya Shah", role: "CFO", parentId: "ceo" },
            { id: "eng", name: "Jordan Lee", role: "Eng Lead", parentId: "cto" },
          ]}
        />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
