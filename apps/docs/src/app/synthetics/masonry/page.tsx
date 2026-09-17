import { Card, Heading, Masonry, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const HEIGHTS = [120, 200, 90, 160, 240, 110, 180, 140, 260];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Masonry columns={3} gap={16}>\n  <Card style={{ height: 120 }}>Item 1</Card>\n  <Card style={{ height: 200 }}>Item 2</Card>\n  {/* ... */}\n</Masonry>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Masonry"] ?? [] },
  {
    type: "doc-section",
    heading: "CSS columns, not a JS-measured layout",
    body: [
      {
        kind: "text",
        text: "Pure `column-count`/`column-gap` with `break-inside: avoid` on each item — no `ResizeObserver`, correct on first paint including SSR. The one honest tradeoff: CSS columns fills top-to-bottom before wrapping to the next column, so item order reads top-to-bottom-then-left-to-right, not a shortest-column-next true masonry algorithm — for most galleries/feeds this reads the same to a viewer.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="masonry"` on the root; each item wrapper carries `data-rebar-part="item"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD has no direct built-in equivalent (MUI's `Masonry` is the closer match) — on migration, keep the same CSS-columns technique directly, or swap to `react-masonry-css` if column-balancing needs to be exact.",
      },
    ],
  },
];

export default function MasonryPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Masonry</Heading>
      <Text color="secondary">
        A Pinterest-style waterfall grid — items of varying height packed into balanced columns.
      </Text>

      <Masonry columns={3} gap={16}>
        {HEIGHTS.map((height, i) => (
          <Card key={i} style={{ height }}>
            <Text>Item {i + 1}</Text>
          </Card>
        ))}
      </Masonry>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
