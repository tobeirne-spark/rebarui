import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A centered page-top hero: optional badge, title, subtitle, action buttons, and an optional code snippet. Badge and subtitle support a tiny inline markup (backtick-code, [label](href) links)." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "hero", badge?: string, title: string, subtitle: string, actions?: Action[], codeSnippet?: string }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the hero block:" }],
  },
  {
      type: "hero",
      badge: "v0.1",
      title: "Example Hero",
      subtitle: "A subtitle with `inline code` and a [link](/components).",
      actions: [
        {
          label: "Primary action",
          variant: "primary",
        },
      ],
    },
];

export default function HeroPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Hero</Heading>
      <Text color="secondary">{"A centered page-top hero: optional badge, title, subtitle, action buttons, and an optional code snippet. Badge and subtitle support a tiny inline markup (backtick-code, [label](href) links)."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
