import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A hierarchical goal/OKR tracker: one Aspiration, several Focus Areas, each holding several Goals — all three levels inline-editable, goals toggle complete with a celebratory confetti burst (TodoItem underneath), and Add/Delete affordances mutate the board locally, the same 'seed local state from the block's own literal data' convention card-kanban uses. Reclassified from a standalone GoalTracker component into this block — the real reusable primitive was the smaller checkable-row control (now TodoItem), not the whole hierarchy; see the Design Heuristics component-vs-block test." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "goal-tracker", aspiration: string, focusAreas: GoalTrackerFocusAreaData[], celebration?: "none" | "small" | "big" }
// GoalTrackerFocusAreaData = { id: string, text: string, goals: GoalTrackerGoalData[] }
// GoalTrackerGoalData = { id: string, text: string, completed: boolean }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the goal-tracker block:" }],
  },
  {
      type: "goal-tracker",
      aspiration: "Become the top board network",
      focusAreas: [
        {
          id: "fa1",
          text: "Grow membership",
          goals: [
            {
              id: "g1",
              text: "Reach 500 members",
              completed: false,
            },
            {
              id: "g2",
              text: "Host 3 events",
              completed: true,
            },
          ],
        },
      ],
    },
];

export default function GoalTrackerPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Goal Tracker</Heading>
      <Text color="secondary">{"A hierarchical goal/OKR tracker: one Aspiration, several Focus Areas, each holding several Goals — all three levels inline-editable, goals toggle complete with a celebratory confetti burst (TodoItem underneath), and Add/Delete affordances mutate the board locally, the same 'seed local state from the block's own literal data' convention card-kanban uses. Reclassified from a standalone GoalTracker component into this block — the real reusable primitive was the smaller checkable-row control (now TodoItem), not the whole hierarchy; see the Design Heuristics component-vs-block test."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
