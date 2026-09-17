import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A drag-and-drop card board — title, optional shared-with avatars, a Share action, a search box, and an optional Board settings button (opens a real Dialog around your own nested blocks), all above the real Kanban component (packages/core): arbitrary columns, optional dividers within a column, cards draggable within/across sections and columns, columns themselves draggable to reorder, and per-column/per-section card limits that reject a drop past them. Native HTML5 drag-and-drop — no new dependency, but no keyboard-operable equivalent yet either, a documented gap." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "card-kanban", title: string, sharedWith?: { name: string, avatarSrc?: string }[], shareUrl?: string, columns: KanbanColumnData[], cards: Record<string, KanbanCardData>, searchPlaceholder?: string, settingsBlocks?: Block[] }
// KanbanColumnData = { id: string, title: string, sections: KanbanSectionData[], limit?: number }
// KanbanSectionData = { id: string, label?: string, cardIds: string[], limit?: number }
// KanbanCardData = { id: string, title: string, description?: string, tags?: string[] }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the card-kanban block:" }],
  },
  {
      type: "card-kanban",
      title: "Sprint board",
      sharedWith: [
        {
          name: "Priya Shah",
        },
        {
          name: "Jae Kim",
        },
      ],
      columns: [
        {
          id: "todo",
          title: "To do",
          sections: [
            {
              id: "todo-main",
              cardIds: [
                "spec",
              ],
            },
          ],
        },
        {
          id: "done",
          title: "Done",
          sections: [
            {
              id: "done-main",
              cardIds: [
                "ship",
              ],
              limit: 1,
            },
          ],
        },
      ],
      cards: {
        spec: {
          id: "spec",
          title: "Write spec",
          tags: [
            "docs",
          ],
        },
        ship: {
          id: "ship",
          title: "Ship it",
        },
      },
    },
];

export default function CardKanbanPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Card Kanban</Heading>
      <Text color="secondary">{"A drag-and-drop card board — title, optional shared-with avatars, a Share action, a search box, and an optional Board settings button (opens a real Dialog around your own nested blocks), all above the real Kanban component (packages/core): arbitrary columns, optional dividers within a column, cards draggable within/across sections and columns, columns themselves draggable to reorder, and per-column/per-section card limits that reject a drop past them. Native HTML5 drag-and-drop — no new dependency, but no keyboard-operable equivalent yet either, a documented gap."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
