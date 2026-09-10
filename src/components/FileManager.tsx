import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, DragEvent } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { ContextMenu } from "./ContextMenu";
import type { ContextMenuItem } from "./ContextMenu";
import { Dialog } from "./Dialog";
import { Editable } from "./Editable";
import { Empty } from "./Empty";
import { Table } from "./Table";
import type { TableColumn } from "./Table";
import { TreeView } from "./TreeView";
import type { TreeNode } from "./TreeView";

export interface FileManagerNode {
  id: string;
  name: string;
  type: "folder" | "file";
  /** Bytes — files only. */
  size?: number;
  /** Folders only. */
  children?: FileManagerNode[];
}

export interface FileManagerProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  root: FileManagerNode;
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  /** Fired after a real drag-drop (or the "Move to…" context-menu fallback) completes — this
   * component manages no file I/O of its own, same convention as `FileUpload` never performing a
   * real network upload: it hands the caller `nodeIds` + `targetFolderId` and the caller is the
   * one that actually mutates `root` and re-renders. */
  onMove?: (nodeIds: string[], targetFolderId: string) => void;
  onRename?: (nodeId: string, newName: string) => void;
  onDelete?: (nodeIds: string[]) => void;
  "aria-label"?: string;
}

/** `1234567` -> `"1.2 MB"` — same convention as `FileUpload`'s own local helper; no shared utils
 * module exists yet in `packages/core` for this, so it's duplicated rather than introducing one
 * for a single three-line function. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function findNode(node: FileManagerNode, id: string): FileManagerNode | undefined {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return undefined;
}

function buildFolderTreeNode(node: FileManagerNode): TreeNode {
  const folderChildren = node.children?.filter((c) => c.type === "folder").map(buildFolderTreeNode);
  return { value: node.id, label: node.name, children: folderChildren?.length ? folderChildren : undefined };
}

function collectFolderIds(node: FileManagerNode, out: string[]): void {
  out.push(node.id);
  for (const child of node.children ?? []) {
    if (child.type === "folder") collectFolderIds(child, out);
  }
}

/** Folder name -> id, first occurrence wins. Used only to resolve which folder a drag is
 * currently over inside the left tree panel — see the doc comment above `resolveTreeDropTarget`
 * for why this (rather than a real per-node id) is what's available to key off there. */
function collectFolderLabels(node: FileManagerNode, map: Map<string, string>): void {
  if (!map.has(node.name)) map.set(node.name, node.id);
  for (const child of node.children ?? []) {
    if (child.type === "folder") collectFolderLabels(child, map);
  }
}

/**
 * A caller-supplied in-memory folder tree with a two-pane browser UI — no real cloud storage
 * integration, no file I/O: every mutation (`onMove`/`onRename`/`onDelete`) is reported back to
 * the caller, exactly the same "the caller owns the real operation, this component only reports
 * intent" convention `FileUpload` already established for uploads. The caller re-renders with an
 * updated `root` after applying the change (or after it's confirmed/rejected by a real backend).
 *
 * **Composition notes** (see `packages/core/robot.md`'s composition-first guidance):
 * - The left folder-navigation panel composes the real `TreeView` directly — expand/collapse,
 *   keyboard nav (arrow keys), and selection are entirely `TreeView`'s own job, not reimplemented
 *   here. This composition is clean for navigation itself. It is NOT fully clean for one specific
 *   feature: `TreeView` owns its expand/collapse state internally and renders no per-node id in
 *   the DOM (no `data-value`/`data-id`), so a drag hovering over a specific tree node can't be
 *   resolved to a real node id via a prop or a stable attribute. `resolveTreeDropTarget` below
 *   works around this by matching the hovered treeitem's own rendered label text against a
 *   name -> id map built from `root` — a deliberate, documented simplification that assumes
 *   folder names are unique across the whole tree (not just within one parent); a real duplicate
 *   name elsewhere in the tree resolves to whichever one was encountered first. The right-hand
 *   grid/table panel has no such ambiguity, since this component renders those tiles/rows itself
 *   and can put a real id directly on the DOM node it owns.
 * - The right-hand contents panel offers both an icon-grid and a sortable-column table view (see
 *   ref/HEURISTICS.md #33's own forward-looking rule for exactly this: "should default to the
 *   table archetype for the detail view and offer an icon-grid toggle, not the reverse" — hence
 *   `viewMode` defaults to `"table"`). The table view composes the real `Table` component for its
 *   sort/selection/sticky-header behavior. `Table`'s column `render` only controls a single
 *   cell's content, not the row's own DOM element — it exposes no row-level `draggable`/
 *   `onDragStart`/`onDrop` hooks, and adding them would mean editing `Table.tsx` itself (out of
 *   scope: this component only touches its own two files). So native HTML5 drag-and-drop between
 *   folders is fully supported in the **grid** view (every tile is this component's own DOM, drag
 *   handlers and all) but not by dragging a **table** row — in table view "Move to…" (the
 *   `ContextMenu` fallback, right-click or long-press on a row's name) is the primary move
 *   mechanism, not just a fallback. This still satisfies ref/HEURISTICS.md #38 (drag-and-drop
 *   needs a real non-drag fallback) in both views; it just means the table view's fallback is its
 *   *only* move mechanism, which is an honest, working scope boundary rather than a gap.
 * - Multi-select is checkbox-based (a real `Checkbox` per tile/row, plus `Table`'s own built-in
 *   `selectedRowKeys` selection column in table view) rather than click/Shift-click/Ctrl-click.
 *   Chosen over the click-modifier pattern because a checkbox is unambiguous on both mouse and
 *   touch with zero extra code (ref/HEURISTICS.md #48 — a mouse-only interaction needs a real
 *   touch equivalent; a checkbox never has that problem to begin with) and matches `Table`'s own
 *   existing selection convention exactly, so the two views share one selection model instead of
 *   inventing a second one for the grid.
 * - Opening a folder (both views) is a dedicated icon button, not "click anywhere on the
 *   tile/row" — deliberately, to avoid a nested-interactive-target conflict with the same
 *   tile/row's own inline-rename (`Editable`) and multi-select (`Checkbox`) controls living right
 *   next to it.
 * - Renaming reuses the real `Editable` component as-is (no hand-rolled inline-edit state) via its
 *   own established single-click-to-edit convention — the same one `Card`'s `editable` title
 *   already uses — rather than inventing a new double-click-to-rename gesture inconsistent with
 *   the rest of the library. `Editable` has no prop to force it into edit mode from the outside
 *   (its `editing` boolean is fully internal), so the `ContextMenu`'s "Rename" action drives it by
 *   calling `.click()` on Editable's own real trigger `<button>` (found via a per-node ref) —
 *   simulating the exact user gesture Editable already listens for, not reaching into its state.
 */
export function FileManager({
  root,
  selectedIds,
  defaultSelectedIds = [],
  onSelectedIdsChange,
  onMove,
  onRename,
  onDelete,
  className,
  "aria-label": ariaLabel = "File manager",
  ...rest
}: FileManagerProps) {
  const [currentFolderId, setCurrentFolderId] = useState(root.id);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(defaultSelectedIds);
  const [dragIds, setDragIds] = useState<string[] | null>(null);
  const [dragOverGridId, setDragOverGridId] = useState<string | null>(null);
  const [moveDialogIds, setMoveDialogIds] = useState<string[] | null>(null);

  const isSelectionControlled = selectedIds !== undefined;
  const currentSelectedIds = isSelectionControlled ? selectedIds : internalSelectedIds;
  const setSelectedIds = (next: string[]) => {
    if (!isSelectionControlled) setInternalSelectedIds(next);
    onSelectedIdsChange?.(next);
  };

  const nameRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const treeWrapperRef = useRef<HTMLDivElement>(null);
  const treeDropTargetElRef = useRef<HTMLElement | null>(null);

  const folderTreeData = useMemo(() => [buildFolderTreeNode(root)], [root]);
  const allFolderIds = useMemo(() => {
    const out: string[] = [];
    collectFolderIds(root, out);
    return out;
  }, [root]);
  const folderLabelToId = useMemo(() => {
    const map = new Map<string, string>();
    collectFolderLabels(root, map);
    return map;
  }, [root]);

  // If `root` changes out from under the currently-open folder (e.g. it was deleted by the
  // caller), fall back to the tree's own root rather than rendering a dead end.
  useEffect(() => {
    if (!findNode(root, currentFolderId)) setCurrentFolderId(root.id);
  }, [root, currentFolderId]);

  const currentFolder = findNode(root, currentFolderId) ?? root;
  const children = currentFolder.children ?? [];

  const navigateTo = (id: string) => {
    const node = findNode(root, id);
    if (node?.type === "folder") setCurrentFolderId(id);
  };

  const toggleSelected = (id: string) => {
    const next = currentSelectedIds.includes(id)
      ? currentSelectedIds.filter((x) => x !== id)
      : [...currentSelectedIds, id];
    setSelectedIds(next);
  };

  const startRename = (id: string) => {
    const wrapper = nameRefs.current[id];
    const button = wrapper?.querySelector("button") as HTMLButtonElement | null;
    button?.click();
  };

  const buildContextMenuItems = (node: FileManagerNode): ContextMenuItem[] => {
    const targetIds = currentSelectedIds.includes(node.id) ? currentSelectedIds : [node.id];
    const items: ContextMenuItem[] = [];
    if (targetIds.length === 1) {
      items.push({ key: "rename", label: "Rename", onSelect: () => startRename(node.id) });
    }
    items.push({ key: "move", label: "Move to…", onSelect: () => setMoveDialogIds(targetIds) });
    items.push({ key: "sep", separator: true });
    items.push({
      key: "delete",
      label: "Delete",
      danger: true,
      onSelect: () => onDelete?.(targetIds),
    });
    return items;
  };

  // --- Grid-view drag-and-drop (this component's own DOM — see the class doc comment above for
  // why table-view rows don't get the same treatment). ---
  const handleDragStart = (id: string) => {
    setDragIds(currentSelectedIds.includes(id) ? currentSelectedIds : [id]);
  };
  const handleDragEnd = () => {
    setDragIds(null);
    setDragOverGridId(null);
    clearTreeDropTarget();
  };
  const handleGridDragEnter = (event: DragEvent, targetId: string) => {
    if (!dragIds || dragIds.includes(targetId)) return;
    event.preventDefault();
    setDragOverGridId(targetId);
  };
  const handleGridDragOver = (event: DragEvent) => {
    if (dragIds) event.preventDefault();
  };
  // Same relatedTarget-based "did we really leave" check as Kanban's section-cards and
  // FileUpload's dropzone, so hovering child content inside a tile doesn't flicker the border.
  const handleGridDragLeave = (event: DragEvent, targetId: string) => {
    const next = event.relatedTarget as Node | null;
    if (!next || !event.currentTarget.contains(next)) {
      setDragOverGridId((current) => (current === targetId ? null : current));
    }
  };
  const handleGridDrop = (event: DragEvent, targetId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverGridId(null);
    if (dragIds && !dragIds.includes(targetId)) {
      onMove?.(dragIds, targetId);
    }
    setDragIds(null);
  };

  // --- Tree-panel drop target — see the class doc comment's composition note for why this
  // resolves the hovered node via label-text matching + imperative classList toggling rather than
  // React state/props (TreeView renders and owns that DOM node, not this component). ---
  function resolveTreeDropTarget(event: DragEvent): { id: string; el: HTMLElement } | null {
    const el = (event.target as HTMLElement | null)?.closest('[role="treeitem"]') as HTMLElement | null;
    if (!el) return null;
    const label = el.textContent?.trim() ?? "";
    const id = folderLabelToId.get(label);
    return id ? { id, el } : null;
  }
  function clearTreeDropTarget() {
    treeDropTargetElRef.current?.classList.remove(
      "rebar-active-border",
      "rebar-file-manager-tree-drop-target",
    );
    treeDropTargetElRef.current = null;
  }
  const handleTreeDragEnter = (event: DragEvent) => {
    if (!dragIds) return;
    const target = resolveTreeDropTarget(event);
    if (!target || dragIds.includes(target.id)) return;
    event.preventDefault();
    if (treeDropTargetElRef.current !== target.el) {
      clearTreeDropTarget();
      target.el.classList.add("rebar-active-border", "rebar-file-manager-tree-drop-target");
      treeDropTargetElRef.current = target.el;
    }
  };
  const handleTreeDragOver = (event: DragEvent) => {
    if (dragIds) event.preventDefault();
  };
  const handleTreeDragLeave = (event: DragEvent) => {
    const next = event.relatedTarget as Node | null;
    if (treeWrapperRef.current && (!next || !treeWrapperRef.current.contains(next))) {
      clearTreeDropTarget();
    }
  };
  const handleTreeDrop = (event: DragEvent) => {
    event.preventDefault();
    const target = resolveTreeDropTarget(event);
    clearTreeDropTarget();
    if (target && dragIds && !dragIds.includes(target.id)) {
      onMove?.(dragIds, target.id);
    }
    setDragIds(null);
  };

  const renderNameArea = (node: FileManagerNode) => (
    <>
      <button
        type="button"
        className="rebar-file-manager-icon-button"
        data-rebar-part="open"
        aria-label={node.type === "folder" ? `Open ${node.name}` : node.name}
        disabled={node.type !== "folder"}
        onClick={() => navigateTo(node.id)}
      >
        <span aria-hidden="true">{node.type === "folder" ? "📁" : "📄"}</span>
      </button>
      <ContextMenu items={buildContextMenuItems(node)}>
        <div
          className="rebar-file-manager-tile-name"
          ref={(el) => {
            nameRefs.current[node.id] = el;
          }}
        >
          <Editable
            aria-label={node.name}
            defaultValue={node.name}
            onSubmit={(value) => onRename?.(node.id, value)}
          />
        </div>
      </ContextMenu>
    </>
  );

  const renderTile = (node: FileManagerNode) => {
    const selected = currentSelectedIds.includes(node.id);
    const isDropTarget = node.type === "folder" && dragOverGridId === node.id;
    return (
      <div
        key={node.id}
        className={clsx(
          "rebar-file-manager-tile",
          selected && "rebar-file-manager-tile-selected",
          isDropTarget && "rebar-file-manager-tile-drop-target rebar-active-border",
        )}
        data-rebar-part="item"
        data-rebar-node-type={node.type}
        data-rebar-active={isDropTarget || undefined}
        draggable
        onDragStart={() => handleDragStart(node.id)}
        onDragEnd={handleDragEnd}
        onDragEnter={node.type === "folder" ? (e: DragEvent) => handleGridDragEnter(e, node.id) : undefined}
        onDragOver={node.type === "folder" ? handleGridDragOver : undefined}
        onDragLeave={node.type === "folder" ? (e: DragEvent) => handleGridDragLeave(e, node.id) : undefined}
        onDrop={node.type === "folder" ? (e: DragEvent) => handleGridDrop(e, node.id) : undefined}
      >
        <Checkbox
          aria-label={`Select ${node.name}`}
          checked={selected}
          onCheckedChange={() => toggleSelected(node.id)}
        />
        {renderNameArea(node)}
        {node.type === "file" && node.size !== undefined ? (
          <span className="rebar-file-manager-tile-size" data-rebar-part="size">
            {formatBytes(node.size)}
          </span>
        ) : null}
      </div>
    );
  };

  const tableColumns: TableColumn<FileManagerNode>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (_value, row) => (
        <div className="rebar-file-manager-name-cell" data-rebar-part="item" data-rebar-node-type={row.type}>
          {renderNameArea(row)}
        </div>
      ),
    },
    {
      key: "size",
      header: "Size",
      sortable: true,
      accessor: (row) => row.size ?? -1,
      render: (_value, row) =>
        row.type === "file" && row.size !== undefined ? formatBytes(row.size) : "—",
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (_value, row) => (row.type === "folder" ? "Folder" : "File"),
    },
  ];

  return (
    <div
      {...rest}
      className={clsx("rebar-file-manager", className)}
      data-rebar-component="file-manager"
      aria-label={ariaLabel}
    >
      <div
        ref={treeWrapperRef}
        className="rebar-file-manager-tree"
        data-rebar-part="tree"
        onDragEnter={handleTreeDragEnter}
        onDragOver={handleTreeDragOver}
        onDragLeave={handleTreeDragLeave}
        onDrop={handleTreeDrop}
      >
        <TreeView
          data={folderTreeData}
          selected={currentFolderId}
          onSelect={navigateTo}
          defaultExpanded={allFolderIds}
          aria-label="Folders"
        />
      </div>
      <div className="rebar-file-manager-main" data-rebar-part="main">
        <div className="rebar-file-manager-toolbar" data-rebar-part="toolbar">
          <span className="rebar-file-manager-current-folder" data-rebar-part="current-folder">
            {currentFolder.name}
          </span>
          <div className="rebar-file-manager-toolbar-actions">
            {currentSelectedIds.length > 0 ? (
              <Button variant="destructive" size="sm" onClick={() => onDelete?.(currentSelectedIds)}>
                Delete ({currentSelectedIds.length})
              </Button>
            ) : null}
            <button
              type="button"
              className="rebar-file-manager-view-button"
              data-rebar-part="view-grid-button"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
            >
              Grid
            </button>
            <button
              type="button"
              className="rebar-file-manager-view-button"
              data-rebar-part="view-table-button"
              aria-label="Table view"
              aria-pressed={viewMode === "table"}
              onClick={() => setViewMode("table")}
            >
              Table
            </button>
          </div>
        </div>
        {children.length === 0 ? (
          <Empty description="This folder is empty" />
        ) : viewMode === "grid" ? (
          <div className="rebar-file-manager-grid" data-rebar-part="grid">
            {children.map(renderTile)}
          </div>
        ) : (
          <div className="rebar-file-manager-table-wrapper" data-rebar-part="grid" data-rebar-view="table">
            <Table
              columns={tableColumns}
              data={children}
              rowKey="id"
              selectedRowKeys={currentSelectedIds}
              onSelectedRowKeysChange={setSelectedIds}
              aria-label={`Contents of ${currentFolder.name}`}
            />
          </div>
        )}
      </div>
      {moveDialogIds ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setMoveDialogIds(null);
          }}
          title="Move to…"
        >
          <TreeView
            data={folderTreeData}
            defaultExpanded={allFolderIds}
            aria-label="Choose a destination folder"
            onSelect={(folderId) => {
              onMove?.(moveDialogIds, folderId);
              setMoveDialogIds(null);
            }}
          />
        </Dialog>
      ) : null}
    </div>
  );
}
