"use client";

import { Collapsible, Heading, Stack, Text } from "rebar-ui";
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
        code: '<Collapsible trigger="Show shipping details">\n  <Text>Ships within 2-3 business days via standard courier.</Text>\n</Collapsible>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Collapsible"] ?? [] },
  {
    type: "doc-section",
    heading: "Distinct from Accordion",
    body: [
      {
        kind: "text",
        text: '`Accordion`/`AccordionItem` require a `value`-keyed multi-item structure, even for a single region — you\'d have to invent a throwaway `value` just to render one. `Collapsible` is the bare single-region primitive: a lone "Show more" panel or filter drawer with no item list around it.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Real disclosure semantics",
    body: [
      {
        kind: "text",
        text: 'A real `<button>` trigger with `aria-expanded`/`aria-controls`, and the content region is `role="region"` + `aria-labelledby` back to the trigger — the standard disclosure-pattern association. Content is fully removed from the DOM when collapsed (not just visually hidden), matching `Accordion`\'s own convention.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="collapsible"`, `data-rebar-open` (boolean) on the root; `data-rebar-part="trigger" | "content"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: 'No direct single-panel equivalent in AntD — its `Collapse` component always uses the same multi-item `items` array `Accordion` maps to. On migration, a lone `Collapsible` becomes a one-item AntD `Collapse` (or a plain conditional render with a button, if pulling in the whole `Collapse` component for one panel feels heavy).',
      },
    ],
  },
];

export default function CollapsiblePage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Collapsible</Heading>
      <Text color="secondary">
        A single expand/collapse region — the lone-panel counterpart to Accordion, with no
        multi-item value machinery.
      </Text>

      <Collapsible trigger="Show shipping details">
        <Text>Ships within 2-3 business days via standard courier. Free returns within 30 days.</Text>
      </Collapsible>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
