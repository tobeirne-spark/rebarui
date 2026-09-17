"use client";

import { Heading, ShapeGallery, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const ITEMS = [
  { id: "rect", label: "Rectangle", category: "Basic", preview: <svg viewBox="0 0 24 24" width={24} height={24}><rect x="3" y="6" width="18" height="12" fill="none" stroke="currentColor" strokeWidth="2" /></svg> },
  { id: "circle", label: "Circle", category: "Basic", preview: <svg viewBox="0 0 24 24" width={24} height={24}><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /></svg> },
  { id: "diamond", label: "Diamond", category: "Flowchart", preview: <svg viewBox="0 0 24 24" width={24} height={24}><path d="M12 2 L22 12 L12 22 L2 12 Z" fill="none" stroke="currentColor" strokeWidth="2" /></svg> },
  { id: "arrow", label: "Arrow", category: "Flowchart", preview: <svg viewBox="0 0 24 24" width={24} height={24}><path d="M3 12h16m-6-6l6 6l-6 6" fill="none" stroke="currentColor" strokeWidth="2" /></svg> },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      { kind: "code", code: '<ShapeGallery items={items} onSelect={(item) => addToCanvas(item)} />' },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["ShapeGallery"] ?? [] },
  {
    type: "doc-section",
    heading: "Real tabs, real keyboard grid navigation",
    body: [
      {
        kind: "text",
        text: "Composes the real Tabs/TabList/Tab/TabPanel components for category switching, plus a synthetic Favorites tab. Swatches form a roving-tabindex grid — arrow keys move focus between cells, Enter/Space selects.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="shape-gallery"`; parts include `swatch`, `preview`, `label`, and `favorite-toggle`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — compose AntD's own `Tabs` + a plain grid of clickable cards directly.",
      },
    ],
  },
];

export default function ShapeGalleryPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>ShapeGallery</Heading>
      <Text color="secondary">
        A categorized, searchable shape/icon gallery with favoriting — a palette panel for picking
        a shape to drop onto a canvas.
      </Text>

      <ShapeGallery items={ITEMS} onSelect={() => {}} />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
