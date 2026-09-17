import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A toned box with a bold title line and an optional secondary subtitle line below it." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "callout", tone: "info"|"warning"|"success"|"error", icon?: IconName, title: string, subtitle?: string }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the callout block:" }],
  },
  {
      type: "callout",
      tone: "warning",
      icon: "clock",
      title: "In progress",
      subtitle: "Some items incomplete.",
    },
];

export default function CalloutPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Callout</Heading>
      <Text color="secondary">{"A toned box with a bold title line and an optional secondary subtitle line below it."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
