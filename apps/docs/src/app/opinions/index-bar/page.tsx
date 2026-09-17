"use client";

import { Avatar, Heading, IndexBar, Stack, Text } from "rebar-ui";
import type { IndexBarGroup } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

interface Contact {
  name: string;
  role: string;
}

const NAMES: [string, string][] = [
  ["Ada Lovelace", "Mathematician"],
  ["Alan Turing", "Computer scientist"],
  ["Barbara Liskov", "Computer scientist"],
  ["Betty Holberton", "Programmer"],
  ["Charles Babbage", "Inventor"],
  ["Donald Knuth", "Computer scientist"],
  ["Edsger Dijkstra", "Computer scientist"],
  ["Frances Allen", "Computer scientist"],
  ["Grace Hopper", "Rear admiral"],
  ["Hedy Lamarr", "Inventor"],
  ["Ida Rhodes", "Mathematician"],
  ["Katherine Johnson", "Mathematician"],
  ["Margaret Hamilton", "Computer scientist"],
  ["Radia Perlman", "Computer scientist"],
  ["Shafi Goldwasser", "Cryptographer"],
  ["Tim Berners-Lee", "Inventor"],
];

const GROUPS: IndexBarGroup<Contact>[] = Array.from(
  NAMES.reduce((byLetter, [name, role]) => {
    const letter = name[0]!.toUpperCase();
    const list = byLetter.get(letter) ?? [];
    list.push({ name, role });
    byLetter.set(letter, list);
    return byLetter;
  }, new Map<string, Contact[]>()),
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, items]) => ({ key, items }));

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<IndexBar groups={groups} renderItem={(contact) => <ContactRow contact={contact} />} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["IndexBar"] ?? [] },
  {
    type: "doc-section",
    heading: "A continuous drag rail, not 26 precise taps",
    body: [
      {
        kind: "text",
        text: 'With one letter per group, no single rail button can realistically meet a real 44×44 touch target on its own (ref/HEURISTICS.md #19) — the standard resolution this component family uses industry-wide (iOS Contacts, antd-mobile\'s own `IndexBar`) is to treat the *whole rail* as one continuous touch surface: press down anywhere on it and drag, and the component tracks which letter your finger is over and jumps the list live. A floating bubble shows the current letter so a finger covering the rail doesn\'t lose track of where it is (ref/HEURISTICS.md #1). A plain click on one letter, with no drag, still works too, and every letter stays keyboard-focusable.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="index-bar"` on the root; parts: `list`, `group`, `group-header`, `item`, `rail`, `rail-letter` (each carrying `data-index-key`, and `data-rebar-active` while it\'s the one currently being dragged over), `bubble`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — this pattern is specific to antd-mobile (`IndexBar`), not the desktop `antd` package this project's codemod targets. Migrating means either pulling in `antd-mobile` directly for a mobile build, or dropping the jump-rail entirely in favor of a plain scrollable list with a search box for a desktop one.",
      },
    ],
  },
];

function ContactRow({ contact }: { contact: Contact }) {
  return (
    <Stack direction="row" gap="sm" align="center" style={{ padding: "8px 4px" }}>
      <Avatar fallback={contact.name} placeholder />
      <Stack gap="xs">
        <Text style={{ fontWeight: "var(--rebar-font-weight-semibold)" }}>{contact.name}</Text>
        <Text color="secondary" size="sm">
          {contact.role}
        </Text>
      </Stack>
    </Stack>
  );
}

export default function IndexBarPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>IndexBar</Heading>
      <Text color="secondary">
        An alphabetical jump-list for a long grouped collection — group a contact list, a
        directory, or a glossary by first letter and let the side rail scrub straight to any
        group, either by tapping a letter or dragging down the rail continuously.
      </Text>

      <LivePreview>
        <div style={{ maxWidth: 320 }}>
          <IndexBar groups={GROUPS} renderItem={(contact) => <ContactRow contact={contact} />} />
        </div>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
