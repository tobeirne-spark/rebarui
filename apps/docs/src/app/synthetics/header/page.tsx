import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A title bar row — a heading with an optional trailing icon button (e.g. a close ×)." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "header", title: string, action?: Action }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the header block:" }],
  },
  {
      type: "header",
      title: "Preview",
      action: {
        icon: "close",
        label: "Close",
      },
    },
];

export default function HeaderPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Header</Heading>
      <Text color="secondary">{"A title bar row — a heading with an optional trailing icon button (e.g. a close ×)."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
