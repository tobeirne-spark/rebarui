import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A heading followed by a vertical stack of bordered, checkable rows." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "checklist", heading?: string, items: string[] }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the checklist block:" }],
  },
  {
      type: "checklist",
      heading: "Checklist",
      items: [
        "First item",
        "Second item",
        "Third item",
      ],
    },
];

export default function ChecklistPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Checklist</Heading>
      <Text color="secondary">{"A heading followed by a vertical stack of bordered, checkable rows."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
