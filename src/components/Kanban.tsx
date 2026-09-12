import { useRef, useState } from "react";
import type { DragEvent } from "react";
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

export interface KanbanProps {
  columns: KanbanColumn[];
  cards: Record<string, KanbanCard>;
  onChange?: (next: KanbanState) => void;
  /** Filters visible cards by title/description/tags (case-insensitive substring) — the count a
   * column/section limit enforces is always the true, unfiltered count, so a filter never makes
   * a full column look like it has room. */
  search?: string;
  /** "sticky" renders each card as a postit — procedurally varied rotation/shadow, a
   * caller-or-auto-assigned color, and a hard 3-per-column cap (a `limit` above 3 is clamped down
   * to it; unset defaults to it) — the same board underneath, not a separate component. Clicking
   * a sticky (not dragging it) opens an edit form for its title/description/tags/color. */
  cardVariant?: "default" | "sticky";
  className?: string;
}

const STICKY_CAP = 3;

function effectiveLimit(limit: number | undefined, sticky: boolean): number | undefined {
  if (!sticky) return limit;
  return limit === undefined ? STICKY_CAP : Math.min(limit, STICKY_CAP);
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
export function Kanban({ columns, cards, onChange, search = "", cardVariant = "default", className }: KanbanProps) {
  const sticky = cardVariant === "sticky";
  const [dragCard, setDragCard] = useState<DragCard | null>(null);
  const [dragColumnId, setDragColumnId] = useState<string | null>(null);
  const [sortOrders, setSortOrders] = useState<Record<string, KanbanSortOrder>>({});
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

  const canAcceptDrop = (targetColumnId: string, targetSectionId: string): boolean => {
    if (!dragCard) return false;
    const targetColumn = columns.find((c) => c.id === targetColumnId);
    const targetSection = targetColumn?.sections.find((s) => s.id === targetSectionId);
    if (!targetColumn || !targetSection) return false;
    if (dragCard.fromColumnId === targetColumnId && dragCard.fromSectionId === targetSectionId) return true;
    const sectionLimit = effectiveLimit(targetSection.limit, sticky);
    const columnLimit = effectiveLimit(targetColumn.limit, sticky);
    if (sectionLimit !== undefined && targetSection.cardIds.length >= sectionLimit) return false;
    if (columnLimit !== undefined && columnCount(targetColumn) >= columnLimit) return false;
    return true;
  };

  const handleCardDrop = (targetColumnId: string, targetSectionId: string, beforeCardId?: string) => {
    if (!dragCard) return;
    setDragOverSection(null);
    if (!canAcceptDrop(targetColumnId, targetSectionId)) return;

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
      if (longPressCardRef.current) openEdit(longPressCardRef.current);
    },
  });

  return (
    <div className={clsx("rebar-kanban", className)} data-rebar-component="kanban">
      {columns.map((column) => {
        const sortOrder = sortOrders[column.id] ?? "manual";
        const total = columnCount(column);
        const columnLimit = effectiveLimit(column.limit, sticky);
        return (
          <div
            key={column.id}
            className="rebar-kanban-column"
            data-rebar-part="column"
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
            >
              <Text style={{ fontWeight: "var(--rebar-font-weight-semibold, 600)" }}>{column.title}</Text>
              <div className="rebar-kanban-column-header-actions">
                {columnLimit !== undefined ? (
                  <Text size="xs" color="secondary" data-rebar-part="column-limit">
                    {total}/{columnLimit}
                  </Text>
                ) : null}
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
              const sectionLimit = effectiveLimit(section.limit, sticky);
              const visibleIds = sortCardIds(section.cardIds, cards, sortOrder).filter((id) => {
                const card = cards[id];
                return card ? matchesSearch(card, search) : false;
              });
              return (
                <div key={section.id} className="rebar-kanban-section" data-rebar-part="section">
                  {section.label ? (
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
                          isDragOverThis && "rebar-kanban-section-cards-active rebar-active-border",
                        )}
                        data-rebar-part="section-cards"
                        onDragEnter={(_e: DragEvent) => {
                          if (!dragCard) return;
                          if (canAcceptDrop(column.id, section.id)) setDragOverSection({ columnId: column.id, sectionId: section.id });
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
                                onTouchStart={(e) => {
                                  longPressCardRef.current = card;
                                  longPress.onTouchStart(e);
                                }}
                                onTouchEnd={longPress.onTouchEnd}
                                onTouchMove={longPress.onTouchMove}
                                onTouchCancel={longPress.onTouchCancel}
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
                  {addingTo?.columnId === column.id && addingTo.sectionId === section.id ? (
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
                      disabled={sectionLimit !== undefined && section.cardIds.length >= sectionLimit}
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
