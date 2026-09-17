import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A persistent, non-modal side panel (the Slack 'thread'/'details' pattern) beside a nested main: Block[] document — no backdrop, the main content stays fully visible and interactive while it's open. Collapses to a slim, always-present rail with a toggle button rather than disappearing entirely, so there's always a real way back in. Distinct from modal (a forced-open, backdrop-covering Dialog for static-render contexts only)." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "side-panel", main: Block[], panel: { title: string, blocks: Block[], defaultOpen?: boolean } }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the side-panel block:" }],
  },
  {
      type: "side-panel",
      main: [
        {
          type: "checklist",
          heading: "Checklist",
          items: [
            "Reviewed",
            "Approved",
          ],
        },
      ],
      panel: {
        title: "Thread",
        blocks: [
          {
            type: "callout",
            tone: "info",
            title: "Alex",
            subtitle: "Can we ship this Friday?",
          },
        ],
      },
    },
];

export default function SidePanelPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Side Panel</Heading>
      <Text color="secondary">{"A persistent, non-modal side panel (the Slack 'thread'/'details' pattern) beside a nested main: Block[] document — no backdrop, the main content stays fully visible and interactive while it's open. Collapses to a slim, always-present rail with a toggle button rather than disappearing entirely, so there's always a real way back in. Distinct from modal (a forced-open, backdrop-covering Dialog for static-render contexts only)."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
