import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "The exact same board and chrome as card-kanban — same schema shape, same title/shared-with/Share/search/Board-settings header — with one difference: Kanban's cardVariant=\"sticky\" instead of the default. Postit-style cards (procedurally varied rotation/shadow, a caller-or-auto-assigned color) capped at 3 per column; click (not drag) opens an edit form for a sticky's title/description/tags/color, resolved against the same drag so a drop never also opens it. A mutation of the same primitive, not a second component." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "sticky-kanban", title: string, sharedWith?: { name: string, avatarSrc?: string }[], shareUrl?: string, columns: KanbanColumnData[], cards: Record<string, KanbanCardData>, searchPlaceholder?: string, settingsBlocks?: Block[] }
// same KanbanColumnData/KanbanSectionData/KanbanCardData shapes as card-kanban, above` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the sticky-kanban block:" }],
  },
  {
      type: "sticky-kanban",
      title: "Retro board",
      columns: [
        {
          id: "went-well",
          title: "Went well",
          sections: [
            {
              id: "went-well-main",
              cardIds: [
                "went1",
              ],
            },
          ],
        },
        {
          id: "improve",
          title: "To improve",
          sections: [
            {
              id: "improve-main",
              cardIds: [
                "improve1",
              ],
            },
          ],
        },
      ],
      cards: {
        went1: {
          id: "went1",
          title: "Fast turnaround on reviews",
        },
        improve1: {
          id: "improve1",
          title: "Standup ran long",
        },
      },
    },
];

export default function StickyKanbanPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Sticky Kanban</Heading>
      <Text color="secondary">{"The exact same board and chrome as card-kanban — same schema shape, same title/shared-with/Share/search/Board-settings header — with one difference: Kanban's cardVariant=\"sticky\" instead of the default. Postit-style cards (procedurally varied rotation/shadow, a caller-or-auto-assigned color) capped at 3 per column; click (not drag) opens an edit form for a sticky's title/description/tags/color, resolved against the same drag so a drop never also opens it. A mutation of the same primitive, not a second component."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
