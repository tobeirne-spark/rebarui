import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "An inline alert strip — icon, one line of text, and an optional trailing action button." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "banner", tone: "info"|"warning"|"success"|"error", icon?: IconName, text: string, action?: Action }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the banner block:" }],
  },
  {
      type: "banner",
      tone: "info",
      icon: "info",
      text: "Nothing entered here is saved.",
      action: {
        label: "Reset",
        icon: "refresh",
      },
    },
];

export default function BannerPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Banner</Heading>
      <Text color="secondary">{"An inline alert strip — icon, one line of text, and an optional trailing action button."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
