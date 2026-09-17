"use client";

import { useState } from "react";
import { Button, CommandPalette, Heading, Stack, Text } from "rebar-ui";
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
        code: `<CommandPalette\n  open={open}\n  onOpenChange={setOpen}\n  commands={[\n    { id: "new", label: "New document", group: "File", shortcut: "⌘N", onSelect: () => {} },\n    { id: "open", label: "Open...", group: "File", shortcut: "⌘O", onSelect: () => {} },\n    { id: "theme", label: "Toggle theme", group: "View", onSelect: () => {} },\n  ]}\n/>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["CommandPalette"] ?? [] },
  {
    type: "doc-section",
    heading: "No global keyboard shortcut — by design",
    body: [
      {
        kind: "text",
        text: "This component does not attach a `document`-level Cmd+K listener on mount — which key combo opens it, and on which pages, is an app-level decision, not something a `packages/core` component should silently own. Drive it via `open`/`onOpenChange` the same way every other rebar-ui overlay works, and wire your own keyboard listener at the app level.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: "Built directly on Radix Dialog (focus trap, Esc-to-close, backdrop click) — not on the real `Dialog` component, since `Dialog` always renders a visible title/close-button header, which is exactly the chrome a command palette doesn't want. The search input drives keyboard navigation via `aria-activedescendant` rather than moving real focus between rows (ArrowUp/ArrowDown/Enter), matching `Combobox`'s own pattern.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="command-palette"`; `data-rebar-part="overlay"|"search-input"|"list"|"group-label"|"item"`, with `data-rebar-active` on the currently-highlighted item.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD has no built-in command-palette primitive of its own — a migration typically composes AntD's `Modal` + `AutoComplete`/`Select` by hand, or reaches for a small dedicated library (e.g. `kbar` or `cmdk`).",
      },
    ],
  },
];

export default function CommandPalettePage() {
  const [open, setOpen] = useState(false);

  return (
    <Stack gap="lg">
      <Heading level={1}>CommandPalette</Heading>
      <Text color="secondary">
        A Cmd+K-style searchable, keyboard-navigable command list in a forced-open modal shell.
      </Text>

      <Stack gap="sm">
        <Button onClick={() => setOpen(true)}>Open command palette</Button>
        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          commands={[
            { id: "new", label: "New document", group: "File", shortcut: "⌘N", onSelect: () => {} },
            { id: "open", label: "Open...", group: "File", shortcut: "⌘O", onSelect: () => {} },
            { id: "theme", label: "Toggle theme", group: "View", onSelect: () => {} },
            { id: "settings", label: "Open settings", group: "View", onSelect: () => {} },
          ]}
        />
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
