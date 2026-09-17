"use client";

import { Heading, Menubar, Stack, Text } from "rebar-ui";
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
        code: '<Menubar\n  items={[\n    { label: "File", items: [{ key: "new", label: "New", onSelect: () => {} }] },\n    { label: "Edit", items: [{ key: "cut", label: "Cut", onSelect: () => {} }] },\n  ]}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Menubar"] ?? [] },
  {
    type: "doc-section",
    heading: "A row of Dropdowns, plus roving tabindex and adjacent switching",
    body: [
      {
        kind: "text",
        text: "Each top-level menu uses the same item vocabulary as Dropdown/ContextMenu. What Menubar adds: only one trigger is ever in the natural Tab order (ArrowLeft/ArrowRight move which one that is), only one menu is ever open at a time, and hovering or arrow-keying to an adjacent trigger while a menu is open switches directly to it instead of needing a close-then-open.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="menubar"`, `role="menubar"` on the root; each trigger carries `data-rebar-part="trigger"`, each open menu `data-rebar-part="menu"`, with items/separators matching Dropdown\'s own convention.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD has no direct `Menubar` primitive of its own — its closest analog is a `Menu mode=\"horizontal\"` with nested `SubMenu`s, which a migration would restructure `items` into.",
      },
    ],
  },
];

export default function MenubarPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Menubar</Heading>
      <Text color="secondary">
        A horizontal row of top-level menu triggers — the classic desktop-app File/Edit/View menu
        bar.
      </Text>

      <Menubar
        items={[
          {
            label: "File",
            items: [
              { key: "new", label: "New", onSelect: () => {} },
              { key: "open", label: "Open", onSelect: () => {} },
              { key: "sep-1", separator: true },
              { key: "exit", label: "Exit", disabled: true, onSelect: () => {} },
            ],
          },
          {
            label: "Edit",
            items: [
              { key: "cut", label: "Cut", onSelect: () => {} },
              { key: "copy", label: "Copy", onSelect: () => {} },
            ],
          },
          {
            label: "View",
            items: [{ key: "zoom", label: "Zoom", onSelect: () => {} }],
          },
        ]}
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
