import { useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { Popover } from "./Popover";
import { TreeView } from "./TreeView";
import type { TreeNode } from "./TreeView";

export interface TreeSelectProps
  extends Omit<ComponentPropsWithoutRef<"button">, "value" | "defaultValue" | "onChange"> {
  /** Same shape as `TreeView`'s own `data` prop — a node's id lives on its `value` field. */
  data: TreeNode[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, label: string) => void;
  placeholder?: string;
}

function findLabel(nodes: TreeNode[], value: string): string | undefined {
  for (const node of nodes) {
    if (node.value === value) return node.label;
    if (node.children?.length) {
      const found = findLabel(node.children, value);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/**
 * A `Select`-style trigger button opening a `Popover` containing the real `TreeView`, for picking
 * one node out of a hierarchical dataset instead of a flat option list — pure composition, no
 * expand/collapse or keyboard-nav logic of its own (that's `TreeView`'s job, same as `DatePicker`
 * owns no date-grid logic and just composes `Calendar`). Picking a node closes the popover, the
 * same "a single choice is a complete choice" convention `DatePicker` already established for
 * exactly this trigger-opens-overlay-picks-one-thing-closes shape.
 */
export function TreeSelect({
  data,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select an item",
  disabled,
  className,
  "aria-label": ariaLabel = "Select an item",
  ...props
}: TreeSelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internalValue;

  const [open, setOpen] = useState(false);

  const handleSelect = (nextValue: string) => {
    const label = findLabel(data, nextValue) ?? nextValue;
    if (!isControlled) setInternalValue(nextValue);
    onValueChange?.(nextValue, label);
    setOpen(false);
  };

  const currentLabel = current ? findLabel(data, current) : undefined;
  const label = currentLabel ?? placeholder;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className={clsx("rebar-date-picker-trigger", className)}
          data-rebar-component="tree-select"
          aria-label={`${ariaLabel}, current value ${currentLabel ?? "none"}`}
          disabled={disabled}
          {...props}
        >
          {label}
        </button>
      }
    >
      <TreeView data={data} selected={current} onSelect={handleSelect} aria-label={ariaLabel} />
    </Popover>
  );
}
