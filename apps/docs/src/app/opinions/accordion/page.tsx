import { Accordion, AccordionItem, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Accordion type="single" collapsible defaultValue="shipping">\n  <AccordionItem value="shipping" trigger="Shipping">\n    Ships within 2 business days.\n  </AccordionItem>\n</Accordion>',
      },
    ],
  },
  { type: "props-table", heading: "Accordion props", rows: componentProps["Accordion"] ?? [] },
  { type: "props-table", heading: "AccordionItem props", rows: componentProps["AccordionItem"] ?? [] },
  {
    type: "doc-section",
    heading: "Single or multiple open regions",
    body: [
      {
        kind: "text",
        text: '`type="single"` (only one region open at a time — pair with `collapsible` to also allow closing the last open one) or `type="multiple"` (any number open at once), the real Radix distinction. Each `AccordionItem` needs a `value`, a `trigger` (the always-visible header content), and `children` (the collapsible body). Distinct from a standalone `Collapsible` — that\'s a single region with no group/multi-item coordination at all.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="accordion"` on the root; `data-rebar-part="item"` per item.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: 'AntD\'s `Collapse` takes an `items` array shape rather than JSX children — a real, if mechanical, restructuring, not a straight prop rename.' },
    ],
  },
];

export default function AccordionPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Accordion</Heading>
      <Text color="secondary">
        A real Radix accordion — single or multiple open regions.
      </Text>

      <LivePreview>
        <Accordion type="single" collapsible defaultValue="shipping" style={{ maxWidth: 420 }}>
          <AccordionItem value="shipping" trigger="Shipping">
            Ships within 2 business days via standard courier.
          </AccordionItem>
          <AccordionItem value="returns" trigger="Returns">
            Returns accepted within 30 days, unworn, with tags attached.
          </AccordionItem>
        </Accordion>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
