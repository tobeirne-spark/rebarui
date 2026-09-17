import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "Real Tabs (Radix underneath) — each tab holds its own nested Block[], rendered recursively, so any other block type can live inside a tab panel." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "tabs", tabs: { label: string, blocks: Block[] }[] }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the tabs block:" }],
  },
  {
      type: "tabs",
      tabs: [
        {
          label: "Team",
          blocks: [
            {
              type: "callout",
              tone: "info",
              title: "Team panel",
            },
          ],
        },
        {
          label: "Details",
          blocks: [
            {
              type: "callout",
              tone: "info",
              title: "Details panel",
            },
          ],
        },
      ],
    },
];

export default function TabsPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Tabs</Heading>
      <Text color="secondary">{"Real Tabs (Radix underneath) — each tab holds its own nested Block[], rendered recursively, so any other block type can live inside a tab panel."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
