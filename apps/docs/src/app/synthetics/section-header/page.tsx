import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A centered kicker/title/subtitle block — used between homepage sections." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "section-header", kicker?: string, title: string, subtitle?: string }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the section-header block:" }],
  },
  {
      type: "section-header",
      kicker: "Example kicker",
      title: "Section title",
      subtitle: "Section subtitle.",
    },
];

export default function SectionHeaderPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Section Header</Heading>
      <Text color="secondary">{"A centered kicker/title/subtitle block — used between homepage sections."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
