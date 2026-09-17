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
        text: "A page index — a list of section links for in-page navigation, like a table of contents for a long page.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [
      {
        kind: "code",
        code: "{ type: \"page-index\", items: { label: string, anchor: string }[] }",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [
      {
        kind: "text",
        text: "A live example of the page-index block:",
      },
    ],
  },
];

export default function PageIndexPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Page Index</Heading>
      <Text color="secondary">
        A page index — a list of section links for in-page navigation, like a table of contents for a long page.
      </Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
