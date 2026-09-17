import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A small, centered card showing a real loading overlay (Spin) over a few lines of content — for demonstrating a loading state, not a real data-bound card. Generic rather than one-off: tip, content lines, and card size are all caller-supplied, not hardcoded to any one demo." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "spin-card", tip?: string, items: string[], width?: number, minHeight?: number }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the spin-card block:" }],
  },
  {
      type: "spin-card",
      tip: "Fetching",
      items: [
        "Project A",
        "Project B",
        "Project C",
      ],
    },
];

export default function SpinCardPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Spin Card</Heading>
      <Text color="secondary">{"A small, centered card showing a real loading overlay (Spin) over a few lines of content — for demonstrating a loading state, not a real data-bound card. Generic rather than one-off: tip, content lines, and card size are all caller-supplied, not hardcoded to any one demo."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
