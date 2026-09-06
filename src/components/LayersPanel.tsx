import { useRef, useState } from "react";
import type { ComponentPropsWithoutRef, DragEvent, KeyboardEvent } from "react";
import clsx from "clsx";
import { Editable } from "./Editable";
import { Empty } from "./Empty";

export interface LayerNode {
  id: string;
  name: string;
  locked?: boolean;
  hidden?: boolean;
  /** Present (even as `[]`) marks this node a *group* — a plain layer never has this field. An
   * empty group still renders its expand chevron (disabled, nothing to reveal yet) and is still a
   * valid drag target for an "inside" drop, since a caller can populate it from empty. */
  children?: LayerNode[];
}

export type LayerDropPosition = "before" | "after" | "inside";

export interface LayersPanelProps extends ComponentPropsWithoutRef<"div"> {
  layers: LayerNode[];
  onRename?: (id: string, name: string) => void;
  onToggleLocked?: (id: string, locked: boolean) => void;
  onToggleHidden?: (id: string, hidden: boolean) => void;
  onReorder?: (draggedId: string, targetId: string, position: LayerDropPosition) => void;
  selectedId?: string;
  defaultSelectedId?: string;
  onSelectedIdChange?: (id: string) => void;
  /** Which group ids start expanded — uncontrolled, same as `TreeView`'s own `defaultExpanded`. */
  defaultExpanded?: string[];
}

interface FlatLayer {
  node: LayerNode;
  depth: number;
  parentId: string | null;
  /** Every id sharing this node's own parent, in order — enough to compute "is this the first/
   * last sibling" and "what's the previous/next sibling's id" for the keyboard move-up/down
   * fallback, without re-walking the tree on every keypress. */
  siblingIds: string[];
}

function flattenLayers(
  nodes: LayerNode[],
  depth: number,
  parentId: string | null,
  expanded: Set<string>,
): FlatLayer[] {
  const siblingIds = nodes.map((n) => n.id);
  const result: FlatLayer[] = [];
  for (const node of nodes) {
    result.push({ node, depth, parentId, siblingIds });
    if (Array.isArray(node.children) && node.children.length > 0 && expanded.has(node.id)) {
      result.push(...flattenLayers(node.children, depth + 1, node.id, expanded));
    }
  }
  return result;
}

/** A drop hovered over the top quarter of a row means "before it," the bottom quarter means
 * "after it," and (only for a group row) the middle half means "inside it" — the same three-way
 * split a file-tree drag-reorder needs to support both flat reordering and indent/outdent via
 * drag. A non-group row only ever splits 50/50 before/after, since it can't accept an "inside"
 * drop. jsdom's `getBoundingClientRect` reports an all-zero rect (a known limitation, same one
 * `FileUpload`'s own drag tests work around), so a zero-height rect falls back to the row's exact
 * midpoint rather than dividing by zero. */
function computeDropPosition(event: DragEvent<HTMLElement>, isGroup: boolean): LayerDropPosition {
  const rect = event.currentTarget.getBoundingClientRect();
  const ratio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
  if (isGroup && ratio > 0.25 && ratio < 0.75) return "inside";
  return ratio <= 0.5 ? "before" : "after";
}

function ExpandIcon({ open }: { open: boolean }) {
  return <>{open ? "▾" : "▸"}</>;
}

// Small inline vector icons matching `Empty`'s own vector-fallback style (currentColor strokes,
// strokeWidth 1.5, strokeLinecap round) rather than a raster/emoji glyph — consistent with this
// project's low-fidelity, theme-aware icon convention.
function LockIcon({ locked }: { locked: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="5" y="11" width="14" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {locked ? (
        <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        <path
          d="M8 11V8a4 4 0 0 1 7.5-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {hidden ? <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /> : null}
    </svg>
  );
}

interface DragOverState {
  id: string;
  position: LayerDropPosition;
}

/**
 * A Figma/Photoshop-style layers panel — a nested, collapsible list of layers/groups with
 * per-row lock/hide toggles, inline rename, and drag-to-reorder (including into/out of a group).
 *
 * Deliberately a **standalone implementation, not a composition of `TreeView`**: the two share the
 * same underlying shape (an ARIA `tree`/`treeitem` structure over a flattened, depth-aware list of
 * currently-visible nodes) and this file's `flattenLayers` is a close sibling of `TreeView`'s own
 * `flatten`, but `TreeView` has no row-content extension point — its `treeitem` markup (label text,
 * expand button, selection) is hardcoded, with no slot for the lock/hide buttons, an `Editable`
 * name, or drag handlers this component needs on every row. Composing `TreeView` would mean either
 * forking its render function anyway (no gain over a standalone file) or bolting drag-and-drop and
 * extra buttons on from *outside* the component across a prop interface `TreeView` doesn't have —
 * more contortion than just building the row this component actually needs. The real reuse instead
 * happens at the *pattern* level (flatten-to-visible-list, roving tabindex, ArrowUp/Down/Left/Right
 * navigation) and at the *component* level for the two pieces that do have real, drop-in extension
 * points: `Editable` for rename, `Empty` for the empty state.
 *
 * Uncontrolled for the tree structure itself, the same "you own the array" contract as `TreeView`'s
 * `onSelect` and `Kanban`'s `onChange`: this component never mutates `layers` — `onRename`/
 * `onToggleLocked`/`onToggleHidden`/`onReorder` all report *what changed*, and the caller re-renders
 * with updated `layers` data. `selectedId` alone follows the real controlled/uncontrolled pair
 * convention (`selectedId`/`defaultSelectedId`/`onSelectedIdChange`).
 *
 * Drag-and-drop is native HTML5 drag-and-drop (no new dependency), following this project's
 * established drop-zone convention: the row currently being dragged over gets `.rebar-active-border`
 * (the shared "this is the active target" beam), with a `relatedTarget`-based dragleave check (the
 * same one `Kanban`'s section drop target and `FileUpload`'s dropzone use) so hovering over a
 * child element inside the row never flickers the highlight. Per heuristic #38, drag is never the
 * *only* way to reorder: every row also renders real, independently keyboard-focusable "Move up"/
 * "Move down" buttons (not a hidden modifier-key gesture) that call `onReorder` directly against
 * this node's real siblings — a full non-drag fallback, not just a documented gap.
 */
export function LayersPanel({
  layers,
  onRename,
  onToggleLocked,
  onToggleHidden,
  onReorder,
  selectedId,
  defaultSelectedId,
  onSelectedIdChange,
  defaultExpanded = [],
  className,
  ...rest
}: LayersPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(defaultExpanded));
  const [internalSelectedId, setInternalSelectedId] = useState(defaultSelectedId);
  const [focusIndex, setFocusIndex] = useState(0);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<DragOverState | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const isControlled = selectedId !== undefined;
  const currentSelectedId = isControlled ? selectedId : internalSelectedId;

  const select = (id: string) => {
    if (!isControlled) setInternalSelectedId(id);
    onSelectedIdChange?.(id);
  };

  const toggleExpanded = (id: string, open: boolean) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  if (layers.length === 0) {
    return (
      <div className={clsx("rebar-layers-panel", className)} data-rebar-component="layers-panel" {...rest}>
        <Empty description="No layers" />
      </div>
    );
  }

  const visible = flattenLayers(layers, 0, null, expanded);

  const moveFocusTo = (index: number) => {
    setFocusIndex(index);
    itemRefs.current[index]?.focus();
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLDivElement>) => {
    // This handler lives on the row (the `role="treeitem"` div), but every nested interactive
    // element (Move up/down, lock/hide toggles, the rename field) is a real descendant of that
    // same div — a keydown on one of those still bubbles up here. Without this guard, pressing
    // Enter/Space while a nested button is focused got `preventDefault()`'d by this handler before
    // the button's own native "activate on Enter" default action could run, silently breaking
    // keyboard activation on every button inside a row (caught by the Move-up/down fallback test
    // this was written to make keyboard-operable in the first place).
    if (event.target !== event.currentTarget) return;
    const entry = visible[index];
    if (!entry) return;
    const isGroup = Array.isArray(entry.node.children);
    const hasVisibleChildren = isGroup && (entry.node.children?.length ?? 0) > 0;
    const isOpen = expanded.has(entry.node.id);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocusTo(Math.min(index + 1, visible.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocusTo(Math.max(index - 1, 0));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      if (hasVisibleChildren && !isOpen) toggleExpanded(entry.node.id, true);
      else if (hasVisibleChildren) moveFocusTo(Math.min(index + 1, visible.length - 1));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (hasVisibleChildren && isOpen) toggleExpanded(entry.node.id, false);
      else {
        const parentIndex = visible.findIndex((v) => v.node.id === entry.parentId);
        if (parentIndex >= 0) moveFocusTo(parentIndex);
      }
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(entry.node.id);
    }
  };

  // The real non-drag keyboard fallback for reordering (heuristic #38): moves a node past its
  // immediate previous/next sibling within the *same parent* — a plain, always-available "Move
  // up"/"Move down" button per row, not a hidden arrow-key-plus-modifier gesture layered on top of
  // the same arrow keys already used for tree navigation above.
  const moveSibling = (entry: FlatLayer, direction: -1 | 1) => {
    const { node, siblingIds } = entry;
    const index = siblingIds.indexOf(node.id);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= siblingIds.length) return;
    const targetId = siblingIds[targetIndex];
    if (!targetId) return;
    onReorder?.(node.id, targetId, direction === -1 ? "before" : "after");
  };

  return (
    <div className={clsx("rebar-layers-panel", className)} data-rebar-component="layers-panel" role="tree" {...rest}>
      {visible.map((entry, index) => {
        const { node, depth } = entry;
        const isGroup = Array.isArray(node.children);
        const hasVisibleChildren = isGroup && (node.children?.length ?? 0) > 0;
        const isOpen = expanded.has(node.id);
        const isSelected = node.id === currentSelectedId;
        const isDragOverThis = dragOver?.id === node.id;
        const siblingIndex = entry.siblingIds.indexOf(node.id);
        const isFirstSibling = siblingIndex <= 0;
        const isLastSibling = siblingIndex === entry.siblingIds.length - 1;

        return (
          <div
            key={node.id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            role="treeitem"
            tabIndex={index === focusIndex ? 0 : -1}
            aria-selected={isSelected}
            aria-expanded={hasVisibleChildren ? isOpen : undefined}
            aria-level={depth + 1}
            className={clsx(
              "rebar-layers-panel-row",
              isDragOverThis && "rebar-layers-panel-row-drag-over rebar-active-border",
            )}
            data-rebar-part={isGroup ? "group" : "layer"}
            data-rebar-active={isSelected || undefined}
            data-rebar-drop-position={isDragOverThis ? dragOver.position : undefined}
            style={{ paddingInlineStart: `${depth * 20}px` }}
            draggable
            onDragStart={(e: DragEvent<HTMLDivElement>) => {
              e.stopPropagation();
              setDraggedId(node.id);
            }}
            onDragEnd={() => {
              setDraggedId(null);
              setDragOver(null);
            }}
            onDragEnter={(e: DragEvent<HTMLDivElement>) => {
              if (!draggedId || draggedId === node.id) return;
              e.preventDefault();
              setDragOver({ id: node.id, position: computeDropPosition(e, isGroup) });
            }}
            onDragOver={(e: DragEvent<HTMLDivElement>) => {
              if (!draggedId || draggedId === node.id) return;
              e.preventDefault();
              setDragOver({ id: node.id, position: computeDropPosition(e, isGroup) });
            }}
            onDragLeave={(e: DragEvent<HTMLDivElement>) => {
              // dragenter/dragleave fire for every child element crossed, not just the row's own
              // boundary — only clear once the pointer has genuinely left this row's subtree
              // (checked via relatedTarget), the same "did we really leave" guard `Kanban`'s own
              // section drop target and `FileUpload`'s dropzone use.
              const next = e.relatedTarget as Node | null;
              if (!next || !e.currentTarget.contains(next)) {
                setDragOver((prev) => (prev?.id === node.id ? null : prev));
              }
            }}
            onDrop={(e: DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              e.stopPropagation();
              if (draggedId && draggedId !== node.id) {
                const position = dragOver?.id === node.id ? dragOver.position : computeDropPosition(e, isGroup);
                onReorder?.(draggedId, node.id, position);
              }
              setDraggedId(null);
              setDragOver(null);
            }}
            onClick={() => {
              setFocusIndex(index);
              select(node.id);
            }}
            onFocus={() => setFocusIndex(index)}
            onKeyDown={(e) => handleKeyDown(index, e)}
          >
            {isGroup ? (
              <button
                type="button"
                className="rebar-layers-panel-expand-toggle"
                data-rebar-part="expand-toggle"
                aria-label={isOpen ? `Collapse ${node.name}` : `Expand ${node.name}`}
                disabled={!hasVisibleChildren}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(node.id, !isOpen);
                }}
              >
                <ExpandIcon open={isOpen} />
              </button>
            ) : (
              <span className="rebar-layers-panel-expand-spacer" aria-hidden="true" />
            )}

            <Editable
              value={node.name}
              onChange={(name) => onRename?.(node.id, name)}
              aria-label={node.name}
              className="rebar-layers-panel-name"
            />

            <div className="rebar-layers-panel-row-actions" data-rebar-part="row-actions">
              <button
                type="button"
                className="rebar-layers-panel-reorder-button"
                data-rebar-part="move-up"
                aria-label={`Move ${node.name} up`}
                disabled={isFirstSibling}
                onClick={(e) => {
                  e.stopPropagation();
                  moveSibling(entry, -1);
                }}
              >
                ▲
              </button>
              <button
                type="button"
                className="rebar-layers-panel-reorder-button"
                data-rebar-part="move-down"
                aria-label={`Move ${node.name} down`}
                disabled={isLastSibling}
                onClick={(e) => {
                  e.stopPropagation();
                  moveSibling(entry, 1);
                }}
              >
                ▼
              </button>
              <button
                type="button"
                className="rebar-layers-panel-toggle-button"
                data-rebar-part="lock-toggle"
                aria-pressed={!!node.locked}
                aria-label={node.locked ? `Unlock ${node.name}` : `Lock ${node.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLocked?.(node.id, !node.locked);
                }}
              >
                <LockIcon locked={!!node.locked} />
              </button>
              <button
                type="button"
                className="rebar-layers-panel-toggle-button"
                data-rebar-part="hide-toggle"
                aria-pressed={!!node.hidden}
                aria-label={node.hidden ? `Show ${node.name}` : `Hide ${node.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHidden?.(node.id, !node.hidden);
                }}
              >
                <EyeIcon hidden={!!node.hidden} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
