import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A heading (level 1, 2, or 3) plus prose/code/list content — the block type this page and every /docs/* page are (or will be) built from, including each page's own title (level 1) and intro paragraph, not just its subsections. Prose text supports the same tiny inline markup as hero." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "doc-section", heading?: string, level?: 1 | 2 | 3, body: ProseNode[] }
// ProseNode = { kind: "text", text: string }
//           | { kind: "code", code: string }
//           | { kind: "list", items: string[], ordered?: boolean }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the doc-section block:" }],
  },
  {
      type: "doc-section",
      heading: "Example",
      body: [
        {
          kind: "text",
          text: "A paragraph with `inline code` and a [link](/docs).",
        },
        {
          kind: "list",
          items: [
            "First point",
            "Second point",
          ],
        },
      ],
    },
];

export default function DocSectionPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Doc Section</Heading>
      <Text color="secondary">{"A heading (level 1, 2, or 3) plus prose/code/list content — the block type this page and every /docs/* page are (or will be) built from, including each page's own title (level 1) and intro paragraph, not just its subsections. Prose text supports the same tiny inline markup as hero."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
