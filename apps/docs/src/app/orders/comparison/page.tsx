import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "The first block whose own layout isn't single-column: two labeled panels side by side, each holding its own nested Block[], rendered recursively the same way tabs/modal already nest. Measures the left panel's real rendered height and applies it to the right, so an embedded iframe on either side — which needs an explicit height, unlike normal content — always matches its sibling instead of drifting out of sync. Added to print both sides of this project's own homepage 'build in Rebar, migrate to antd' comparison, see PACKER_COVERAGE.md." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "comparison", leftLabel: string, leftBlocks: Block[], rightLabel: string, rightBlocks: Block[] }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the comparison block:" }],
  },
  {
      type: "comparison",
      leftLabel: "Rebar",
      leftBlocks: [
        {
          type: "checklist",
          heading: "Checklist",
          items: [
            "First item",
            "Second item",
          ],
        },
      ],
      rightLabel: "Embedded page",
      rightBlocks: [
        {
          type: "iframe",
          src: "https://example.com",
          title: "Example embed",
        },
      ],
    },
];

export default function ComparisonPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Comparison</Heading>
      <Text color="secondary">{"The first block whose own layout isn't single-column: two labeled panels side by side, each holding its own nested Block[], rendered recursively the same way tabs/modal already nest. Measures the left panel's real rendered height and applies it to the right, so an embedded iframe on either side — which needs an explicit height, unlike normal content — always matches its sibling instead of drifting out of sync. Added to print both sides of this project's own homepage 'build in Rebar, migrate to antd' comparison, see PACKER_COVERAGE.md."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
