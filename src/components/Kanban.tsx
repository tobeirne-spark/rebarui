import { Fragment, useRef, useState } from "react";
import type { DragEvent, ReactNode, TouchEvent } from "react";
import clsx from "clsx";
import { resolveStickyColor, STICKY_PALETTE } from "../stickyColor";
import { useLongPress } from "../useLongPress";
import { Button } from "./Button";
import { Card } from "./Card";
import { ColorPicker } from "./ColorPicker";
import { Dialog } from "./Dialog";
import { Input } from "./Input";
import { Sticky } from "./Sticky";
import { Text } from "./Text";
import { Tooltip } from "./Tooltip";

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  /** Sticky-note background color (`cardVariant="sticky"` only) — a hex value. Unset picks one
   * deterministically from a small pastel palette, keyed off the card's own id. */
  color?: string;
}

export interface KanbanSection {
  id: string;
  /** A label rendered above this section's cards — a divider within the column. Omit for a
   * column with no dividers (the common case: one section, no label). */
  label?: string;
  cardIds: string[];
  /** Caps how many cards this section can hold; a drop past the limit is rejected. */
  limit?: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  sections: KanbanSection[];
  /** Caps the column's total card count across all its sections; a drop past the limit is
   * rejected even if the target section itself has room. */
  limit?: number;
}

export type KanbanSortOrder = "manual" | "title-asc" | "title-desc";

export interface KanbanState {
  columns: KanbanColumn[];
  cards: Record<string, KanbanCard>;
}

/** Passed to `renderCard` for every visible card — everything a caller needs to reproduce (or
 * replace) drag/drop and touch-long-press wiring without reaching into Kanban's own internals. */
export interface KanbanCardRenderContext {
  columnId: string;
  sectionId: string;
  /** Mirrors the board's own `cardVariant === "sticky"` — lets one `renderCard` branch its output
   * per variant without the caller re-deriving it from props. */
  sticky: boolean;
  dragHandlers: {
    draggable: boolean;
    onDragStart: () => void;
    onDragEnd: () => void;
    onDragOver: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
  };
  /** Wire these to the rendered card's own touch handlers for the same long-press-opens-edit
   * parity Kanban's own cards get on touch devices (see the long-press doc comment below) — a
   * `renderCard` that ignores them simply has no touch equivalent for whatever it opens instead. */
  touchHandlers: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchEnd: () => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchCancel: () => void;
  };
}

export interface KanbanProps {
  columns: KanbanColumn[];
  cards: Record<string, KanbanCard>;
  onChange?: (next: KanbanState) => void;
  /** Filters visible cards by title/description/tags (case-insensitive substring) — the count a
   * column/section limit enforces is always the true, unfiltered count, so a filter never makes
   * a full column look like it has room. */
  search?: string;
  /** "sticky" renders each card as a postit — procedurally varied rotation/shadow, a
   * caller-or-auto-assigned color, and (by default, see `stickyDefaultLimit`) a hard 3-per-column
   * cap — the same board underneath, not a separate component. Clicking a sticky (not dragging it)
   * opens an edit form for its title/description/tags/color. */
  cardVariant?: "default" | "sticky";
  /** The cap applied in sticky mode to a column/section that has no explicit `limit` of its own
   * (an explicit `limit` is never altered by this — it's respected exactly, in both variants).
   * Defaults to 3, the realistic "how many postits actually fit" heuristic a sticky board without
   * its own configured limits should still have. Pass `false` when a caller lets its own users
   * configure every column's real limit (including "no cap," i.e. `limit: undefined`) and sticky
   * mode should respect that choice exactly like the default variant does, rather than silently
   * substituting 3 for an intentionally-unlimited column. */
  stickyDefaultLimit?: number | false;
  /** Replaces the built-in `Card`/`Sticky` rendering (and its double-click/click-opens-edit-modal
   * behavior) for every visible card, when set — the caller takes full ownership of the card's
   * face and of whatever click/double-click should do instead, while Kanban still owns column/
   * section layout, drag-and-drop, limits, sort, and search filtering. Omit to keep today's
   * built-in `Card`/`Sticky` rendering unchanged. */
  renderCard?: (card: KanbanCard, ctx: KanbanCardRenderContext) => ReactNode;
  /** Replaces just the column title text in the column header (the limit badge and sort button
   * either side of it are unaffected) — for a caller that needs the title itself to be
   * interactive (e.g. click-to-rename) without rebuilding the whole header. Omit to keep today's
   * plain-text title. */
  renderColumnTitle?: (column: KanbanColumn) => ReactNode;
  /** Called on a long-press instead of opening the built-in edit dialog — the real touch
   * equivalent of `onDoubleClick`, since a touch device never fires a real double-click. Only
   * meaningful alongside `renderCard` (which already takes over double-click for the mouse case);
   * omit to keep the built-in behavior (long-press opens the built-in title/description/tags/color
   * edit dialog, same as always). */
  onCardLongPress?: (card: KanbanCard) => void;
  /** Which columns are collapsed (their body replaced by a tray showing just the card count — see
   * the eye icon in each column header). Omit to let Kanban track this itself, uncommitted,
   * resetting on remount — the default, and the right choice for a purely personal view
   * preference. Pass this (together with `onColumnCollapsedChange`) when a caller wants collapse
   * state to survive a reload or be the same for every viewer — e.g. persisted as real board data
   * — the same controlled/uncontrolled split `cardVariant` already has at the board level, just
   * per-column. */
  collapsedColumnIds?: string[];
  /** Required alongside `collapsedColumnIds` to actually toggle a column — Kanban calls this
   * instead of managing the collapse itself once you're controlling it. */
  onColumnCollapsedChange?: (columnId: string, collapsed: boolean) => void;
  className?: string;
}

// Plain inline SVG (no icon-library dependency, same convention as the sort button's own "⇅"/
// "A→Z" text glyphs above) -- an eye-slash, toggling a column between its normal body and the
// collapsed tray below.
function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// A small tray/container glyph shown in a collapsed column's body, next to its card count --
// same plain-inline-SVG convention as EyeOffIcon above.
function TrayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 9h8M8 13h8" />
      <path d="M8 17c1.2 1 2.4 1.5 4 1.5s2.8-.5 4-1.5" />
    </svg>
  );
}

const STICKY_CAP_DEFAULT = 3;
// How far (px) a touch must move before it counts as a drag rather than a tap or a long-press.
const TOUCH_DRAG_THRESHOLD = 10;

function effectiveLimit(limit: number | undefined, sticky: boolean, stickyDefaultLimit: number | false): number | undefined {
  if (!sticky || stickyDefaultLimit === false) return limit;
  return limit === undefined ? stickyDefaultLimit : Math.min(limit, stickyDefaultLimit);
}

function columnCount(column: KanbanColumn): number {
  return column.sections.reduce((sum, s) => sum + s.cardIds.length, 0);
}

function matchesSearch(card: KanbanCard, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  if (card.title.toLowerCase().includes(needle)) return true;
  if (card.description?.toLowerCase().includes(needle)) return true;
  return card.tags?.some((t) => t.toLowerCase().includes(needle)) ?? false;
}

function sortCardIds(cardIds: string[], cards: Record<string, KanbanCard>, sort: KanbanSortOrder): string[] {
  if (sort === "manual") return cardIds;
  const sorted = [...cardIds].sort((a, b) => (cards[a]?.title ?? "").localeCompare(cards[b]?.title ?? ""));
  return sort === "title-desc" ? sorted.reverse() : sorted;
}

interface DragCard {
  cardId: string;
  fromColumnId: string;
  fromSectionId: string;
}

/** Removes a card id from wherever it currently lives across every column/section. */
function removeCard(columns: KanbanColumn[], cardId: string): KanbanColumn[] {
  return columns.map((col) => ({
    ...col,
    sections: col.sections.map((s) => ({ ...s, cardIds: s.cardIds.filter((id) => id !== cardId) })),
  }));
}

function insertCard(
  columns: KanbanColumn[],
  columnId: string,
  sectionId: string,
  cardId: string,
  beforeCardId: string | undefined,
): KanbanColumn[] {
  return columns.map((col) => {
    if (col.id !== columnId) return col;
    return {
      ...col,
      sections: col.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const rest = s.cardIds.filter((id) => id !== cardId);
        const index = beforeCardId ? rest.indexOf(beforeCardId) : -1;
        const cardIds = index === -1 ? [...rest, cardId] : [...rest.slice(0, index), cardId, ...rest.slice(index)];
        return { ...s, cardIds };
      }),
    };
  });
}

/**
 * A drag-and-drop card board — arbitrary columns, each split into one or more sections by an
 * optional horizontal divider, cards draggable within/across sections and columns, columns
 * themselves draggable to reorder. Per-column and per-section card limits reject a drop past
 * them (not just visually hint it). Native HTML5 drag-and-drop, no new dependency — the one
 * honest, documented gap this trades for that: no keyboard-operable equivalent for reordering
 * yet, mouse/touch drag only.
 *
 * Uncontrolled: this component owns no state of its own for `columns`/`cards` (every drag/add
 * mutates the props you passed in via `onChange`, the same "you own the array" pattern as
 * `TreeView`'s `onSelect`) — the caller re-renders with the updated structure, same as any other
 * derived-state list component in this library.
 */
export function Kanban({
  columns,
  cards,
  onChange,
  search = "",
  cardVariant = "default",
  stickyDefaultLimit = STICKY_CAP_DEFAULT,
  renderCard,
  renderColumnTitle,
  onCardLongPress,
  collapsedColumnIds,
  onColumnCollapsedChange,
  className,
}: KanbanProps) {
  const sticky = cardVariant === "sticky";
  const [dragCard, setDragCard] = useState<DragCard | null>(null);
  const [dragColumnId, setDragColumnId] = useState<string | null>(null);
  const [sortOrders, setSortOrders] = useState<Record<string, KanbanSortOrder>>({});
  // Uncontrolled by default: purely a view preference (which columns are hidden behind their
  // tray), not part of the board's real data, never goes through `onChange`, resets on remount,
  // same as sortOrders above. A caller that wants this persisted/shared passes
  // collapsedColumnIds + onColumnCollapsedChange instead (see KanbanProps) -- isControlled below
  // just decides which of the two toggleColumnCollapsed actually uses.
  const [internalCollapsedColumns, setInternalCollapsedColumns] = useState<Record<string, boolean>>({});
  const isCollapseControlled = collapsedColumnIds !== undefined;
  const collapsedColumns = isCollapseControlled
    ? Object.fromEntries(collapsedColumnIds!.map((id) => [id, true]))
    : internalCollapsedColumns;
  const toggleColumnCollapsed = (columnId: string) => {
    if (isCollapseControlled) {
      onColumnCollapsedChange?.(columnId, !collapsedColumns[columnId]);
    } else {
      setInternalCollapsedColumns((prev) => ({ ...prev, [columnId]: !prev[columnId] }));
    }
  };
  const [addingTo, setAddingTo] = useState<{ columnId: string; sectionId: string } | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [draftCard, setDraftCard] = useState<KanbanCard | null>(null);
  // Which section (if any) is currently a *reachable* drop target for the card being dragged —
  // see ref/HEURISTICS.md's drop-zone-expansion rule: a valid target grows and lights up
  // (activeBorder) as soon as a compatible drag nears it, rather than staying the same small hit
  // area the whole time. Never set for a section that would reject the drop (already at its
  // limit) — expanding a target that's about to refuse the drop would be actively misleading.
  const [dragOverSection, setDragOverSection] = useState<{ columnId: string; sectionId: string } | null>(null);
  // A dragged sticky still fires a plain `click` on release in some browsers/engines even though
  // the drag already handled the interaction — this flag, set the moment a drag starts and cleared
  // just after it ends, is what stops that trailing click from also opening the edit modal.
  const dragOccurredRef = useRef(false);

  const emit = (columnsNext: KanbanColumn[], cardsNext: Record<string, KanbanCard> = cards) => {
    onChange?.({ columns: columnsNext, cards: cardsNext });
  };

  // Takes the drag source explicitly rather than always reading `dragCard` state internally --
  // touch dragging needs to call this in the *same* event handler invocation that just called
  // `setDragCard(...)`, before that state update has actually flushed to a re-render, so reading
  // the state here would still see the pre-drag (null) value. The mouse call sites already have
  // the source available in state by the time they call this (drag start and every check after it
  // happen in separate event/render cycles), so passing `dragCard` explicitly there is equivalent
  // to the old always-read-state behavior, not a change for them.
  const canAcceptDrop = (source: DragCard | null, targetColumnId: string, targetSectionId: string): boolean => {
    if (!source) return false;
    const targetColumn = columns.find((c) => c.id === targetColumnId);
    const targetSection = targetColumn?.sections.find((s) => s.id === targetSectionId);
    if (!targetColumn || !targetSection) return false;
    if (source.fromColumnId === targetColumnId && source.fromSectionId === targetSectionId) return true;
    const sectionLimit = effectiveLimit(targetSection.limit, sticky, stickyDefaultLimit);
    const columnLimit = effectiveLimit(targetColumn.limit, sticky, stickyDefaultLimit);
    if (sectionLimit !== undefined && targetSection.cardIds.length >= sectionLimit) return false;
    if (columnLimit !== undefined && columnCount(targetColumn) >= columnLimit) return false;
    return true;
  };

  const handleCardDrop = (targetColumnId: string, targetSectionId: string, beforeCardId?: string) => {
    if (!dragCard) return;
    setDragOverSection(null);
    if (!canAcceptDrop(dragCard, targetColumnId, targetSectionId)) return;

    const withoutCard = removeCard(columns, dragCard.cardId);
    const next = insertCard(withoutCard, targetColumnId, targetSectionId, dragCard.cardId, beforeCardId);
    emit(next);
    setDragCard(null);
  };

  const handleColumnDrop = (targetColumnId: string) => {
    if (!dragColumnId || dragColumnId === targetColumnId) return;
    const fromIndex = columns.findIndex((c) => c.id === dragColumnId);
    const toIndex = columns.findIndex((c) => c.id === targetColumnId);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...columns];
    const [moved] = next.splice(fromIndex, 1);
    if (moved) next.splice(toIndex, 0, moved);
    emit(next);
    setDragColumnId(null);
  };

  const cycleSort = (columnId: string) => {
    setSortOrders((prev) => {
      const current = prev[columnId] ?? "manual";
      const order: KanbanSortOrder = current === "manual" ? "title-asc" : current === "title-asc" ? "title-desc" : "manual";
      return { ...prev, [columnId]: order };
    });
  };

  const confirmAdd = () => {
    if (!addingTo || !draftTitle.trim()) return;
    // The "+ Add card" button's own `disabled` is a visual hint only, bypassable via the title
    // input's Enter key (a separate code path) -- this is the one real, authoritative capacity
    // check for the add-card flow, same two limits `canAcceptDrop` already enforces for drag-drop.
    const targetColumn = columns.find((c) => c.id === addingTo.columnId);
    const targetSection = targetColumn?.sections.find((s) => s.id === addingTo.sectionId);
    if (!targetColumn || !targetSection) return;
    const sectionLimit = effectiveLimit(targetSection.limit, sticky, stickyDefaultLimit);
    const columnLimit = effectiveLimit(targetColumn.limit, sticky, stickyDefaultLimit);
    if (sectionLimit !== undefined && targetSection.cardIds.length >= sectionLimit) return;
    if (columnLimit !== undefined && columnCount(targetColumn) >= columnLimit) return;
    const id = `card-${Math.random().toString(36).slice(2, 10)}`;
    const nextCards = { ...cards, [id]: { id, title: draftTitle.trim() } };
    const nextColumns = insertCard(columns, addingTo.columnId, addingTo.sectionId, id, undefined);
    emit(nextColumns, nextCards);
    setAddingTo(null);
    setDraftTitle("");
  };

  const openEdit = (card: KanbanCard) => {
    setEditingCardId(card.id);
    setDraftCard(card);
  };

  const closeEdit = () => {
    setEditingCardId(null);
    setDraftCard(null);
  };

  const confirmEdit = () => {
    if (!draftCard) return;
    emit(columns, { ...cards, [draftCard.id]: draftCard });
    closeEdit();
  };

  // A default-variant card opens its edit modal on double-click — but a touch device never
  // fires a real dblclick, so this shared long-press timer (one hook call for the whole board,
  // per the rules of hooks — which card fired it is tracked via the ref below, set on each
  // card's own touchstart) is the real equivalent, not a desktop-only affordance. See
  // ref/HEURISTICS.md's touch-optimization rule and `useLongPress`'s own doc comment.
  const longPressCardRef = useRef<KanbanCard | null>(null);
  const longPress = useLongPress({
    onLongPress: () => {
      if (!longPressCardRef.current) return;
      if (onCardLongPress) onCardLongPress(longPressCardRef.current);
      else openEdit(longPressCardRef.current);
    },
  });

  // Real touch drag-and-drop -- native HTML5 drag-and-drop (the dragHandlers above) simply never
  // fires from a finger on any mobile browser, so touch needs its own parallel implementation
  // rather than relying on it. Deliberately reuses the *same* dragCard/dragColumnId/dragOverSection
  // state the mouse path already sets, so canAcceptDrop/handleCardDrop/handleColumnDrop and the
  // existing drop-target highlight CSS all work unchanged for either input method -- only how that
  // state gets set differs. A move past TOUCH_DRAG_THRESHOLD is what tells a drag apart from a tap
  // or a long-press (useLongPress's own onTouchMove already cancels its timer on any movement at
  // all, so calling it unconditionally here keeps that "moving means this wasn't a press" guarantee
  // even below the drag threshold).
  const touchDragRef = useRef<{
    kind: "card" | "column";
    cardId?: string;
    columnId?: string;
    startX: number;
    startY: number;
    dragging: boolean;
    ghostEl: HTMLElement | null;
    sourceRect: DOMRect | null;
    lastColumnHit: string | null;
  } | null>(null);

  const createTouchGhost = (target: HTMLElement): HTMLElement => {
    const rect = target.getBoundingClientRect();
    const ghost = target.cloneNode(true) as HTMLElement;
    ghost.style.position = "fixed";
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.margin = "0";
    ghost.style.pointerEvents = "none";
    ghost.style.opacity = "0.85";
    ghost.style.zIndex = "9999";
    ghost.setAttribute("aria-hidden", "true");
    document.body.appendChild(ghost);
    return ghost;
  };

  return (
    <div className={clsx("rebar-kanban", className)} data-rebar-component="kanban">
      {columns.map((column) => {
        const sortOrder = sortOrders[column.id] ?? "manual";
        const total = columnCount(column);
        const columnLimit = effectiveLimit(column.limit, sticky, stickyDefaultLimit);
        return (
          <div
            key={column.id}
            className="rebar-kanban-column"
            data-rebar-part="column"
            // Touch drag hit-testing (elementFromPoint + closest) reads this back; mouse drag uses
            // the native dragover/drop events on this same element instead and never needs it.
            data-column-id={column.id}
            // True when a column already holds more cards than its own configured `limit` -- set
            // (say) before the limit was lowered, or before it existed. This never happens through
            // this component's own drag/add paths (both reject a drop/add past the limit already);
            // it's purely informational for a caller whose own UI lets a limit be edited after the
            // fact, so a caller can style the overflow instead of silently hiding it or force-
            // moving cards the caller has no real destination for.
            data-rebar-over-limit={columnLimit !== undefined && total > columnLimit ? "true" : undefined}
            onDragOver={(e: DragEvent) => {
              if (dragColumnId) e.preventDefault();
            }}
            onDrop={() => handleColumnDrop(column.id)}
          >
            <div
              className="rebar-kanban-column-header"
              data-rebar-part="column-header"
              draggable
              onDragStart={() => setDragColumnId(column.id)}
              onDragEnd={() => setDragColumnId(null)}
              onTouchStart={(e: TouchEvent) => {
                const touch = e.touches[0];
                if (!touch) return;
                touchDragRef.current = {
                  kind: "column",
                  columnId: column.id,
                  startX: touch.clientX,
                  startY: touch.clientY,
                  dragging: false,
                  ghostEl: null,
                  sourceRect: null,
                  lastColumnHit: null,
                };
              }}
              onTouchMove={(e: TouchEvent) => {
                const state = touchDragRef.current;
                const touch = e.touches[0];
                if (!state || !touch || state.kind !== "column" || state.columnId !== column.id) return;
                const dx = touch.clientX - state.startX;
                const dy = touch.clientY - state.startY;
                if (!state.dragging) {
                  if (Math.hypot(dx, dy) < TOUCH_DRAG_THRESHOLD) return;
                  state.dragging = true;
                  setDragColumnId(column.id);
                  const target = e.currentTarget as HTMLElement;
                  state.sourceRect = target.getBoundingClientRect();
                  state.ghostEl = createTouchGhost(target);
                }
                e.preventDefault();
                if (state.ghostEl && state.sourceRect) {
                  state.ghostEl.style.left = `${state.sourceRect.left + dx}px`;
                  state.ghostEl.style.top = `${state.sourceRect.top + dy}px`;
                }
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                const columnEl = el?.closest<HTMLElement>('[data-rebar-part="column"]');
                state.lastColumnHit = columnEl?.dataset.columnId ?? null;
              }}
              onTouchEnd={() => {
                const state = touchDragRef.current;
                if (state?.dragging && state.kind === "column") {
                  if (state.lastColumnHit) handleColumnDrop(state.lastColumnHit);
                  state.ghostEl?.remove();
                  setDragColumnId(null);
                }
                touchDragRef.current = null;
              }}
              onTouchCancel={() => {
                touchDragRef.current?.ghostEl?.remove();
                setDragColumnId(null);
                touchDragRef.current = null;
              }}
            >
              {renderColumnTitle ? (
                renderColumnTitle(column)
              ) : (
                <Text style={{ fontWeight: "var(--rebar-font-weight-semibold, 600)" }}>{column.title}</Text>
              )}
              <div className="rebar-kanban-column-header-actions">
                {columnLimit !== undefined ? (
                  <Text size="xs" color="secondary" data-rebar-part="column-limit">
                    {total}/{columnLimit}
                  </Text>
                ) : null}
                <button
                  type="button"
                  className="rebar-kanban-collapse-button"
                  data-rebar-part="collapse-button"
                  aria-label={collapsedColumns[column.id] ? `Show ${column.title} cards` : `Hide ${column.title} cards`}
                  aria-pressed={Boolean(collapsedColumns[column.id])}
                  onClick={() => toggleColumnCollapsed(column.id)}
                >
                  <EyeOffIcon />
                </button>
                <button
                  type="button"
                  className="rebar-kanban-sort-button"
                  data-rebar-part="sort-button"
                  aria-label={`Sort ${column.title}`}
                  onClick={() => cycleSort(column.id)}
                >
                  {sortOrder === "title-asc" ? "A→Z" : sortOrder === "title-desc" ? "Z→A" : "⇅"}
                </button>
              </div>
            </div>
            {column.sections.map((section) => {
              const collapsed = Boolean(collapsedColumns[column.id]);
              const sectionLimit = effectiveLimit(section.limit, sticky, stickyDefaultLimit);
              const searchActive = search.trim().length > 0;
              const matchingIds = sortCardIds(section.cardIds, cards, sortOrder).filter((id) => {
                const card = cards[id];
                return card ? matchesSearch(card, search) : false;
              });
              // A collapsed column stays empty except for its tray -- unless a search is actually
              // narrowing the board down, in which case whichever of its own cards match surface
              // as "ghost" cards (styled via .rebar-kanban-section-cards-collapsed below) so a
              // search doesn't silently look like it missed something that's just hidden. Clearing
              // the search, or narrowing it to no longer match, goes straight back to tray-only.
              const visibleIds = collapsed ? (searchActive ? matchingIds : []) : matchingIds;
              return (
                <div key={section.id} className="rebar-kanban-section" data-rebar-part="section">
                  {section.label && !collapsed ? (
                    <Text
                      size="xs"
                      color="secondary"
                      className="rebar-kanban-section-label"
                      data-rebar-part="section-label"
                    >
                      {section.label}
                      {sectionLimit !== undefined ? ` (${section.cardIds.length}/${sectionLimit})` : ""}
                    </Text>
                  ) : null}
                  {(() => {
                    const isDragOverThis =
                      dragOverSection?.columnId === column.id && dragOverSection.sectionId === section.id;
                    return (
                      <div
                        className={clsx(
                          "rebar-kanban-section-cards",
                          collapsed && "rebar-kanban-section-cards-collapsed",
                          isDragOverThis && "rebar-kanban-section-cards-active rebar-active-border",
                        )}
                        data-rebar-part="section-cards"
                        data-column-id={column.id}
                        data-section-id={section.id}
                        onDragEnter={(_e: DragEvent) => {
                          if (!dragCard) return;
                          if (canAcceptDrop(dragCard, column.id, section.id)) setDragOverSection({ columnId: column.id, sectionId: section.id });
                        }}
                        onDragOver={(e: DragEvent) => {
                          if (dragCard) e.preventDefault();
                        }}
                        onDragLeave={(e: DragEvent) => {
                          // dragenter/dragleave fire for every child crossed, not just the
                          // container's own boundary — only clear once the pointer has actually
                          // left this element's subtree (checked via relatedTarget), so hovering
                          // between cards inside the same section doesn't flicker the expansion.
                          const next = e.relatedTarget as Node | null;
                          if (!next || !e.currentTarget.contains(next)) setDragOverSection(null);
                        }}
                        onDrop={(e: DragEvent) => {
                          e.stopPropagation();
                          handleCardDrop(column.id, section.id);
                        }}
                      >
                        {collapsed ? (
                          <div className="rebar-kanban-collapsed-tray" data-rebar-part="collapsed-tray">
                            <Tooltip content="This column's contents are hidden. Click the eye icon to show them again.">
                              <span className="rebar-kanban-collapsed-tray-label">
                                <TrayIcon />
                                <Text size="sm" color="secondary">
                                  {section.cardIds.length} card{section.cardIds.length === 1 ? "" : "s"}
                                </Text>
                              </span>
                            </Tooltip>
                          </div>
                        ) : null}
                        {visibleIds.map((cardId) => {
                          const card = cards[cardId];
                          if (!card) return null;
                          const dragHandlers = {
                            draggable: true,
                            onDragStart: () => {
                              dragOccurredRef.current = true;
                              setDragCard({ cardId, fromColumnId: column.id, fromSectionId: section.id });
                            },
                            onDragEnd: () => {
                              setDragCard(null);
                              setDragOverSection(null);
                              setTimeout(() => {
                                dragOccurredRef.current = false;
                              }, 0);
                            },
                            onDragOver: (e: DragEvent) => {
                              if (dragCard) e.preventDefault();
                            },
                            onDrop: (e: DragEvent) => {
                              e.stopPropagation();
                              handleCardDrop(column.id, section.id, cardId);
                            },
                          };
                          const touchHandlers = {
                            onTouchStart: (e: TouchEvent) => {
                              longPressCardRef.current = card;
                              longPress.onTouchStart(e);
                              const touch = e.touches[0];
                              if (!touch) return;
                              touchDragRef.current = {
                                kind: "card",
                                cardId,
                                startX: touch.clientX,
                                startY: touch.clientY,
                                dragging: false,
                                ghostEl: null,
                                sourceRect: null,
                                lastColumnHit: null,
                              };
                            },
                            onTouchMove: (e: TouchEvent) => {
                              // Any movement at all means this wasn't a press — cancelling the
                              // long-press timer unconditionally here (not just past the drag
                              // threshold below) is what keeps a long-press from firing mid-drag.
                              longPress.onTouchMove();
                              const state = touchDragRef.current;
                              const touch = e.touches[0];
                              if (!state || !touch || state.kind !== "card" || state.cardId !== cardId) return;
                              const dx = touch.clientX - state.startX;
                              const dy = touch.clientY - state.startY;
                              if (!state.dragging) {
                                if (Math.hypot(dx, dy) < TOUCH_DRAG_THRESHOLD) return;
                                state.dragging = true;
                                dragOccurredRef.current = true;
                                setDragCard({ cardId, fromColumnId: column.id, fromSectionId: section.id });
                                const target = e.currentTarget as HTMLElement;
                                state.sourceRect = target.getBoundingClientRect();
                                state.ghostEl = createTouchGhost(target);
                              }
                              e.preventDefault();
                              if (state.ghostEl && state.sourceRect) {
                                state.ghostEl.style.left = `${state.sourceRect.left + dx}px`;
                                state.ghostEl.style.top = `${state.sourceRect.top + dy}px`;
                              }
                              const el = document.elementFromPoint(touch.clientX, touch.clientY);
                              const sectionEl = el?.closest<HTMLElement>('[data-rebar-part="section-cards"]');
                              const hitColumnId = sectionEl?.dataset.columnId;
                              const hitSectionId = sectionEl?.dataset.sectionId;
                              const dragSource = { cardId, fromColumnId: column.id, fromSectionId: section.id };
                              if (hitColumnId && hitSectionId && canAcceptDrop(dragSource, hitColumnId, hitSectionId)) {
                                setDragOverSection({ columnId: hitColumnId, sectionId: hitSectionId });
                              } else {
                                setDragOverSection(null);
                              }
                            },
                            onTouchEnd: () => {
                              longPress.onTouchEnd();
                              const state = touchDragRef.current;
                              if (state?.dragging && state.kind === "card") {
                                if (dragOverSection) handleCardDrop(dragOverSection.columnId, dragOverSection.sectionId);
                                else {
                                  setDragCard(null);
                                  setDragOverSection(null);
                                }
                                state.ghostEl?.remove();
                                setTimeout(() => {
                                  dragOccurredRef.current = false;
                                }, 0);
                              }
                              touchDragRef.current = null;
                            },
                            onTouchCancel: () => {
                              longPress.onTouchCancel();
                              const state = touchDragRef.current;
                              state?.ghostEl?.remove();
                              if (state?.dragging) {
                                setDragCard(null);
                                setDragOverSection(null);
                                setTimeout(() => {
                                  dragOccurredRef.current = false;
                                }, 0);
                              }
                              touchDragRef.current = null;
                            },
                          };

                          if (renderCard) {
                            return (
                              <Fragment key={cardId}>
                                {renderCard(card, {
                                  columnId: column.id,
                                  sectionId: section.id,
                                  sticky,
                                  dragHandlers,
                                  touchHandlers,
                                })}
                              </Fragment>
                            );
                          }

                          if (!sticky) {
                            return (
                              <Card
                                key={cardId}
                                data-rebar-part="card"
                                title={card.title}
                                editable
                                onTitleChange={(value) => emit(columns, { ...cards, [cardId]: { ...card, title: value } })}
                                labels={card.tags?.map((tag) => ({ label: tag }))}
                                {...dragHandlers}
                                onDoubleClick={() => openEdit(card)}
                                {...touchHandlers}
                              >
                                {card.description}
                              </Card>
                            );
                          }

                          return (
                            <Sticky
                              key={cardId}
                              data-rebar-part="card"
                              title={card.title}
                              tags={card.tags}
                              color={card.color}
                              seed={card.id}
                              {...dragHandlers}
                              onClick={() => {
                                if (dragOccurredRef.current) return;
                                openEdit(card);
                              }}
                            >
                              {card.description}
                            </Sticky>
                          );
                        })}
                      </div>
                    );
                  })()}
                  {collapsed ? null : addingTo?.columnId === column.id && addingTo.sectionId === section.id ? (
                    <div className="rebar-kanban-add-form" data-rebar-part="add-form">
                      <Input
                        aria-label="New card title"
                        value={draftTitle}
                        autoFocus
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmAdd();
                          if (e.key === "Escape") {
                            setAddingTo(null);
                            setDraftTitle("");
                          }
                        }}
                      />
                      <div className="rebar-kanban-add-form-actions">
                        <Button variant="primary" size="sm" onClick={confirmAdd}>
                          Add
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setAddingTo(null);
                            setDraftTitle("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="rebar-kanban-add-button"
                      data-rebar-part="add-card-button"
                      disabled={
                        (sectionLimit !== undefined && section.cardIds.length >= sectionLimit) ||
                        (columnLimit !== undefined && total >= columnLimit)
                      }
                      onClick={() => {
                        setAddingTo({ columnId: column.id, sectionId: section.id });
                        setDraftTitle("");
                      }}
                    >
                      + Add card
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
      {editingCardId && draftCard ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) closeEdit();
          }}
          title={sticky ? "Edit sticky" : "Edit card"}
          footer={
            <Button variant="primary" onClick={confirmEdit}>
              Save
            </Button>
          }
        >
          <div className="rebar-kanban-edit-form">
            <Input
              aria-label="Title"
              value={draftCard.title}
              onChange={(e) => setDraftCard({ ...draftCard, title: e.target.value })}
            />
            <textarea
              aria-label="Description"
              className="rebar-input"
              rows={3}
              value={draftCard.description ?? ""}
              onChange={(e) => setDraftCard({ ...draftCard, description: e.target.value })}
            />
            <Input
              aria-label="Tags (comma-separated)"
              placeholder="Tags, comma-separated"
              value={draftCard.tags?.join(", ") ?? ""}
              onChange={(e) =>
                setDraftCard({
                  ...draftCard,
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
            {sticky ? (
              <ColorPicker
                aria-label="Sticky color"
                value={resolveStickyColor(draftCard.id, draftCard.color)}
                presets={STICKY_PALETTE}
                onChange={(color) => setDraftCard({ ...draftCard, color })}
              />
            ) : null}
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
