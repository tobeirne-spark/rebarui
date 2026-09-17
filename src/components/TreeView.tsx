import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import clsx from "clsx";
import { ChevronDownIcon, ChevronRightIcon } from "./icons";

export interface TreeNode {
  value: string;
  label: string;
  children?: TreeNode[];
}

export interface TreeViewProps {
  data: TreeNode[];
  selected?: string;
  defaultSelected?: string;
  onSelect?: (value: string) => void;
  defaultExpanded?: string[];
  "aria-label"?: string;
  className?: string;
}

interface FlatNode {
  node: TreeNode;
  depth: number;
  parentPath: string;
}

function flatten(nodes: TreeNode[], depth: number, expanded: Set<string>, parentPath: string): FlatNode[] {
  const result: FlatNode[] = [];
  for (const node of nodes) {
    result.push({ node, depth, parentPath });
    if (node.children?.length && expanded.has(node.value)) {
      result.push(...flatten(node.children, depth + 1, expanded, node.value));
    }
  }
  return result;
}

/**
 * A real ARIA tree (`role="tree"`/`role="treeitem"`, `aria-expanded`/`aria-level`/`aria-selected`)
 * over a flattened list of currently-visible nodes — expand/collapse is a data operation on which
 * nodes are visible, not a DOM show/hide, which is what makes arrow-key navigation across a
 * variable-depth tree tractable: Right expands (or moves into the first child if already
 * expanded), Left collapses (or moves to the parent if already collapsed), Up/Down move between
 * visible nodes, Enter/Space selects.
 */
export function TreeView({
  data,
  selected,
  defaultSelected,
  onSelect,
  defaultExpanded = [],
  "aria-label": ariaLabel,
  className,
}: TreeViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(defaultExpanded));
  const [internalSelected, setInternalSelected] = useState(defaultSelected);
  const [focusIndex, setFocusIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isControlled = selected !== undefined;
  const currentSelected = isControlled ? selected : internalSelected;

  const visible = flatten(data, 0, expanded, "");

  // Setting `tabIndex` alone doesn't move real DOM focus — the browser only reacts to a
  // subsequent Tab press, not to a prop change. Arrow-key navigation needs an imperative
  // `.focus()` call on the target node, same render pass, or focus visibly lags a step behind.
  const moveFocusTo = (index: number) => {
    setFocusIndex(index);
    itemRefs.current[index]?.focus();
  };

  const select = (value: string) => {
    if (!isControlled) setInternalSelected(value);
    onSelect?.(value);
  };

  const toggle = (value: string, open: boolean) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (open) next.add(value);
      else next.delete(value);
      return next;
    });
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLDivElement>) => {
    const entry = visible[index];
    if (!entry) return;
    const hasChildren = !!entry.node.children?.length;
    const isOpen = expanded.has(entry.node.value);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocusTo(Math.min(index + 1, visible.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocusTo(Math.max(index - 1, 0));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      if (hasChildren && !isOpen) toggle(entry.node.value, true);
      else if (hasChildren) moveFocusTo(Math.min(index + 1, visible.length - 1));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (hasChildren && isOpen) toggle(entry.node.value, false);
      else {
        const parentIndex = visible.findIndex((v) => v.node.value === entry.parentPath);
        if (parentIndex >= 0) moveFocusTo(parentIndex);
      }
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(entry.node.value);
    }
  };

  return (
    <div
      className={clsx("rebar-tree-view", className)}
      data-rebar-component="tree-view"
      role="tree"
      aria-label={ariaLabel}
    >
      {visible.map((entry, index) => {
        const hasChildren = !!entry.node.children?.length;
        const isOpen = expanded.has(entry.node.value);
        const isSelected = entry.node.value === currentSelected;
        return (
          <div
            key={entry.node.value}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            role="treeitem"
            tabIndex={index === focusIndex ? 0 : -1}
            aria-selected={isSelected}
            aria-expanded={hasChildren ? isOpen : undefined}
            aria-level={entry.depth + 1}
            className="rebar-tree-view-item"
            data-rebar-part="item"
            data-rebar-active={isSelected || undefined}
            style={{ paddingInlineStart: `${entry.depth * 20}px` }}
            onClick={() => {
              setFocusIndex(index);
              select(entry.node.value);
            }}
            onFocus={() => setFocusIndex(index)}
            onKeyDown={(e) => handleKeyDown(index, e)}
          >
            {hasChildren ? (
              <button
                type="button"
                className="rebar-tree-view-toggle"
                aria-label={isOpen ? "Collapse" : "Expand"}
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(entry.node.value, !isOpen);
                }}
              >
                {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </button>
            ) : (
              <span className="rebar-tree-view-toggle-spacer" aria-hidden="true" />
            )}
            {entry.node.label}
          </div>
        );
      })}
    </div>
  );
}
