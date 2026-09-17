import { Affix, Box, Button, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Affix offsetTop={16}>\n  <Button>Pinned once scrolled past</Button>\n</Affix>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Affix"] ?? [] },
  {
    type: "doc-section",
    heading: "No layout jump when pinning",
    body: [
      {
        kind: "text",
        text: "A same-sized placeholder renders in the document flow the moment content becomes pinned, so nothing else on the page visually jumps — a well-known implementation detail of any real affix/sticky behavior. Measurement is rAF-throttled (at most once per animation frame regardless of scroll-event volume), matching `SectionNav`'s own existing scroll-measurement convention.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Watches the real page scroll",
    body: [
      {
        kind: "text",
        text: "This component listens to the real `window` scroll (not an arbitrary scrollable container's own), so the demo below is placed directly in this page's own normal flow, with spacer content around it — scroll this actual page to see it pin and un-pin, not a bounded demo box.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="affix"` on the root; the pinned content and its placeholder each carry their own `data-rebar-part`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's own `Affix` is a close direct equivalent — `offsetTop`/`onAffixChange` map directly across (`onChange` in AntD).",
      },
    ],
  },
];

export default function AffixPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Affix</Heading>
      <Text color="secondary">
        Pins its children in place once the page scrolls past them, un-pinning on the way back.
      </Text>

      <Text size="sm" color="secondary">
        Scroll this page down — the button below pins to the top of the viewport, then un-pins
        when you scroll back up past it.
      </Text>

      <Affix offsetTop={8}>
        <Button size="sm">Pinned once scrolled past</Button>
      </Affix>

      <Box style={{ height: 600 }} aria-hidden="true" />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
