import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "One entry of a heuristics/design-principles page: a heading, a bolded one-line rule, doc-section-style rationale prose (same tiny inline markup), and an optional code sample and/or a real nested live Block[] example. Carries its own stable id rather than slugifying one from title, since existing cross-references or a page-index block's own sections list may already point at a specific hand-picked id. Added to convert this project's own /docs/heuristics off hand-authored JSX — 43 of its 46 entries fit this shape exactly." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "heuristic", id: string, title: string, rule: string, rationale: ProseNode[], code?: string, exampleBlocks?: Block[] }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the heuristic block:" }],
  },
  {
      type: "heuristic",
      id: "example-heuristic",
      title: "Example heuristic",
      rule: "State the rule in one bolded sentence.",
      rationale: [
        {
          kind: "text",
          text: "Then explain *why*, with `inline code` and a [link](/docs/heuristics) where useful.",
        },
      ],
      exampleBlocks: [
        {
          type: "checklist",
          heading: "Applied here",
          items: [
            "The rule",
            "The rationale",
            "A live example",
          ],
        },
      ],
    },
];

export default function HeuristicPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Heuristic</Heading>
      <Text color="secondary">{"One entry of a heuristics/design-principles page: a heading, a bolded one-line rule, doc-section-style rationale prose (same tiny inline markup), and an optional code sample and/or a real nested live Block[] example. Carries its own stable id rather than slugifying one from title, since existing cross-references or a page-index block's own sections list may already point at a specific hand-picked id. Added to convert this project's own /docs/heuristics off hand-authored JSX — 43 of its 46 entries fit this shape exactly."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
