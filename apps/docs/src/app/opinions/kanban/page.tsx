"use client";

import { useState } from "react";
import { Box, Heading, Input, Kanban, Stack, Text } from "rebar-ui";
import type { KanbanCard, KanbanColumn, KanbanState } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const INITIAL_CARDS: Record<string, KanbanCard> = {
  spec: { id: "spec", title: "Write spec", tags: ["docs"] },
  ui: { id: "ui", title: "Build the board UI", description: "Columns, cards, drag reorder" },
  review: { id: "review", title: "Design review" },
  bug: { id: "bug", title: "Fix drag-drop on Firefox", tags: ["bug"] },
  ship: { id: "ship", title: "Ship it" },
};

const INITIAL_COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "To do", sections: [{ id: "todo-main", cardIds: ["spec", "ui"] }] },
  {
    id: "in-progress",
    title: "In progress",
    sections: [
      { id: "in-progress-blocked", label: "Blocked", cardIds: ["bug"], limit: 3 },
      { id: "in-progress-active", label: "Active", cardIds: ["review"] },
    ],
    limit: 4,
  },
  { id: "done", title: "Done", sections: [{ id: "done-main", cardIds: ["ship"], limit: 1 }] },
];

const STICKY_CARDS: Record<string, KanbanCard> = {
  went1: { id: "went1", title: "Fast turnaround on reviews" },
  went2: { id: "went2", title: "Good test coverage" },
  improve1: { id: "improve1", title: "Standup ran long" },
  action1: { id: "action1", title: "Timebox standup to 10 min" },
};

const STICKY_COLUMNS: KanbanColumn[] = [
  { id: "went-well", title: "Went well", sections: [{ id: "went-well-main", cardIds: ["went1", "went2"] }] },
  { id: "improve", title: "To improve", sections: [{ id: "improve-main", cardIds: ["improve1"] }] },
  { id: "actions", title: "Action items", sections: [{ id: "actions-main", cardIds: ["action1"] }] },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Kanban columns={columns} cards={cards} search={search} onChange={setBoard} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Kanban"] ?? [] },
  {
    type: "doc-section",
    heading: "Uncontrolled, like TreeView",
    body: [
      {
        kind: "text",
        text: "`Kanban` owns no state of its own for `columns`/`cards` — every drag, sort, or add-card calls `onChange` with the updated structure, and the caller re-renders with it. The same \"you own the array\" contract as `TreeView`'s `onSelect`, not a new pattern.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Limits and dividers",
    body: [
      {
        kind: "text",
        text: "A column's optional `limit` caps its total card count across all its sections; a section's own `limit` caps just that section. A drop past either limit is rejected outright, not just visually hinted — try dragging a card into the \"Done\" column above, or into \"Blocked\", both already at their limit. A section's optional `label` renders as a horizontal divider within its column, splitting one column into named sub-groups (see \"In progress\" above).",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Sticky variant",
    body: [
      {
        kind: "text",
        text: '`cardVariant="sticky"` mutates the same component into the postit board shown above — a hard 3-per-column cap (an explicit `limit` above 3 is clamped down to it), procedurally varied rotation/shadow per card, and click (not drag) opens an edit form for title/description/tags/color instead of a `card-kanban`-style caller-supplied modal. Try clicking a sticky above, then dragging one — the two are resolved so a drag never also opens the edit form.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Known gap: mouse/touch only",
    body: [
      {
        kind: "text",
        text: "Drag-and-drop uses the native HTML5 Drag and Drop API — no new dependency, but no keyboard-operable equivalent yet either. A documented, honest gap rather than a silently missing one.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="kanban"`; each column/section/card carries `data-rebar-part="column"`/`"section"`/`"card"` respectively.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD has no built-in Kanban/board component; a migration reimplements the board on top of a drag-and-drop library of the consuming team's choice.",
      },
    ],
  },
];

export default function KanbanPage() {
  const [board, setBoard] = useState<KanbanState>({ columns: INITIAL_COLUMNS, cards: INITIAL_CARDS });
  const [search, setSearch] = useState("");
  const [stickyBoard, setStickyBoard] = useState<KanbanState>({ columns: STICKY_COLUMNS, cards: STICKY_CARDS });

  return (
    <Stack gap="lg">
      <Heading level={1}>Kanban</Heading>
      <Text color="secondary">
        A drag-and-drop card board — arbitrary columns, optional dividers within a column, cards
        draggable within/across sections and columns, columns themselves draggable to reorder, and
        optional per-column/per-section card limits.
      </Text>

      <Stack gap="xs">
        <Input
          aria-label="Search demo cards"
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Box
          style={{
            border: "1px solid var(--rebar-color-border, #e0e0e0)",
            borderRadius: 4,
            padding: "var(--rebar-space-lg)",
            overflowX: "auto",
          }}
        >
          <Kanban columns={board.columns} cards={board.cards} search={search} onChange={setBoard} />
        </Box>
      </Stack>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          A retro board using <code>cardVariant=&quot;sticky&quot;</code> — up to 3 stickies per
          column, click a sticky to edit it.
        </Text>
        <Box
          style={{
            border: "1px solid var(--rebar-color-border, #e0e0e0)",
            borderRadius: 4,
            padding: "var(--rebar-space-lg)",
            overflowX: "auto",
          }}
        >
          <Kanban
            columns={stickyBoard.columns}
            cards={stickyBoard.cards}
            cardVariant="sticky"
            onChange={setStickyBoard}
          />
        </Box>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
