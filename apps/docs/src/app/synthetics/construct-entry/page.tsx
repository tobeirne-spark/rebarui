import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [
      {
        kind: "text",
        text: "An entry in a construct index/directory — a title, optional description, and a link to the construct's full page. Used to build index pages.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [
      {
        kind: "code",
        code: "{ type: \"construct-entry\", title: string, description?: string, href: string }",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [
      {
        kind: "text",
        text: "A live example of the construct-entry block:",
      },
    ],
  },
];

export default function ConstructEntryPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Construct Entry</Heading>
      <Text color="secondary">
        An entry in a construct index/directory — a title, optional description, and a link to the construct's full page. Used to build index pages.
      </Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
