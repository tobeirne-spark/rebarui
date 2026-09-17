"use client";

import { useRef, useState } from "react";
import { Button, Heading, Stack, Text, Tour } from "rebar-ui";
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
        code: '<Tour\n  open={open}\n  onOpenChange={setOpen}\n  steps={[\n    { target: () => saveButtonRef.current, title: "Save your work", description: "Click here any time." },\n    { target: () => settingsRef.current, title: "Settings", description: "Configure the workspace." },\n  ]}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Tour"] ?? [] },
  {
    type: "doc-section",
    heading: "target is a real, accepted function-prop exception",
    body: [
      {
        kind: "text",
        text: '`target: () => HTMLElement | null` is a deliberate exception to this project\'s usual "avoid function props" guidance — there\'s no serializable way to say "the third button on the page" otherwise, the same call `BackTop`\'s own `target` prop makes. If `target()` returns `null` (not yet rendered, conditionally hidden), that step\'s callout still renders — centered on screen — rather than crashing.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "The highlighted target wears the same active-border beam as a Kanban drop target",
    body: [
      {
        kind: "text",
        text: '`.rebar-active-border` (the animated conic-gradient beam Kanban and FileUpload use to signal "this is where a drag should land") is a generic flag, not a drag-and-drop-specific style — see its own doc comment in `style.css`. Here it signals "this is the element being explained right now" instead, applied straight to the highlight rect alongside its existing static blue outline.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "A four-sided mask, and scroll is deliberately locked",
    body: [
      {
        kind: "text",
        text: 'The dimmed overlay is four separate rects framing the highlighted element\'s real position — not an SVG mask — so the target underneath stays genuinely clickable if a step needs to demonstrate real interaction, not just point at something. The page\'s own scroll is locked while a tour is open, the same convention Radix already applies to `Dialog` — stated here as an intentional choice, not an oversight.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="tour"`; parts include the overlay, mask, highlight, and callout.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's own `Tour` is a close direct equivalent — `steps`/`open`/`onOpenChange`/`currentStep` map to AntD's `steps`/`open`/`onOpenChange`/`current`, though AntD's step `target` is the same function-returning-an-element shape this component already uses.",
      },
    ],
  },
];

export default function TourPage() {
  const [open, setOpen] = useState(false);
  const startRef = useRef<HTMLButtonElement>(null);
  const finishRef = useRef<HTMLButtonElement>(null);

  return (
    <Stack gap="lg">
      <Heading level={1}>Tour</Heading>
      <Text color="secondary">
        A guided, sequential product walkthrough — a mask over the page with one real element
        highlighted at a time.
      </Text>

      <Stack direction="row" gap="md">
        <Button ref={startRef} onClick={() => setOpen(true)}>
          Start button
        </Button>
        <Button ref={finishRef} variant="secondary">
          Finish button
        </Button>
      </Stack>

      <Tour
        open={open}
        onOpenChange={setOpen}
        steps={[
          { target: () => startRef.current, title: "Start here", description: "This button kicks off the flow." },
          { target: () => finishRef.current, title: "Then finish here", description: "This one wraps things up." },
        ]}
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
