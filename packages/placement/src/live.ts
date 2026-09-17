/**
 * Per-block-type value/handler types for the live-data binding mechanism (see schema.ts's
 * `source`/`onX` fields on `ai-chat`, `table`, `goal-tracker`, `card-kanban`/`sticky-kanban`,
 * `wizard`, and the three chart blocks). These aren't consumed by this package at runtime —
 * `BlockRenderer`'s own `data`/`handlers` props stay plain string-keyed maps, since a block's
 * `source`/`onX` value is itself just data (a key name), not something this package can enumerate
 * ahead of time. They exist so a consuming app's own `data`/`handlers` object literals get real
 * compile-time checking, e.g.:
 *
 * ```ts
 * const data = { chatMessages: messages } satisfies { chatMessages: AiChatSource };
 * ```
 */
import type { GoalTrackerFocusAreaData, KanbanCardData, KanbanColumnData, TableRow, AiChatMessageData } from "./schema";
import type { WizardValue } from "rebar-ui";

export type AiChatSource = AiChatMessageData[];
export type AiChatSendHandler = (value: string) => void;

export type TableSource = TableRow[];
export type TableRowActionHandler = (rowIndex: number, row: TableRow) => void;
export type TableAddRowHandler = (cells: string[]) => void;

export interface GoalTrackerSource {
  aspiration: string;
  focusAreas: GoalTrackerFocusAreaData[];
}
export type GoalTrackerChangeHandler = (next: GoalTrackerSource) => void;

export interface KanbanBoardSource {
  columns: KanbanColumnData[];
  cards: Record<string, KanbanCardData>;
}
export type KanbanChangeHandler = (next: KanbanBoardSource) => void;

export type WizardSubmitHandler = (values: Record<string, WizardValue>) => void;

/** Values keyed by each field's own `label` (see the `form` block's own `onSubmit` doc comment in
 * `schema.ts` for why label rather than a separate id). Same value shape as `WizardValue` — a form
 * field and a wizard step's field are the same underlying control set. */
export type FormSubmitHandler = (values: Record<string, WizardValue>) => void;

export type ScatterChartSource = { label: string; color?: string; values: number[] }[];
export type LineChartSource = { label: string; color?: string; values: number[]; dashed?: boolean }[];
export type StackedBarChartSource = { label: string; segments: { label: string; value: number; color?: string }[] }[];
