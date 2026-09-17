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
        text: "A modal dialog with a title, body content, and action buttons. Used for focused tasks or confirmations that require user attention.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [
      {
        kind: "code",
        code: "{ type: \"modal\", title: string, body: Construct[], actions?: Action[] }",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [
      {
        kind: "text",
        text: "A live example of the modal block:",
      },
    ],
  },
];

export default function ModalPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Modal</Heading>
      <Text color="secondary">
        A modal dialog with a title, body content, and action buttons. Used for focused tasks or confirmations that require user attention.
      </Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
