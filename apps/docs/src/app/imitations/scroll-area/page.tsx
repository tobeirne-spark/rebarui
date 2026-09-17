import { Heading, ScrollArea, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const ITEMS = Array.from({ length: 18 }, (_, i) => `Row ${i + 1} — a short line of list content`);

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: `<ScrollArea maxHeight={150}>\n  {items.map((item) => (\n    <Text key={item} size="sm">{item}</Text>\n  ))}\n</ScrollArea>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["ScrollArea"] ?? [] },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="scroll-area"`; `data-rebar-orientation` mirrors the `orientation` prop (`"vertical"|"horizontal"|"both"`).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Genuinely CSS-only",
    body: [
      {
        kind: "text",
        text: "No scroll-primitive dependency, no JS scroll logic — this is real native scrolling (`overflow: auto`, never `hidden`, on whichever axis is active) with a thinner, theme-aware scrollbar via plain `scrollbar-width`/`::-webkit-scrollbar` styling.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD has no dedicated scroll-area primitive of its own — a custom scrollbar is normally done with plain CSS in an antd app too, the same approach this component takes, so there's nothing to remap beyond dropping the `rebar-ui` import.",
      },
    ],
  },
];

export default function ScrollAreaPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>ScrollArea</Heading>
      <Text color="secondary">
        A custom-styled scrollable container replacing native scrollbars with a thinner,
        theme-aware one — real native scrolling underneath, no JS.
      </Text>

      <LivePreview>
        <ScrollArea maxHeight={150} style={{ maxWidth: 320 }}>
          <Stack gap="xs">
            {ITEMS.map((item) => (
              <Text key={item} size="sm">
                {item}
              </Text>
            ))}
          </Stack>
        </ScrollArea>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
