import { useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { Checkbox } from "./Checkbox";

export interface TransferItem {
  key: string;
  label: string;
}

export interface TransferProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onChange"> {
  /** The full universe of items available to move between the two lists. */
  items: TransferItem[];
  /** Keys currently in the right/"target" list (controlled). */
  value?: string[];
  /** Keys initially in the right/"target" list (uncontrolled). Default `[]`. */
  defaultValue?: string[];
  onValueChange?: (keys: string[]) => void;
  sourceTitle?: string;
  targetTitle?: string;
  className?: string;
}

/**
 * A dual-list widget for moving items between two lists ("Available" / "Selected" by default).
 * Controlled/uncontrolled via `value`/`defaultValue`/`onValueChange`, the same pattern every other
 * stateful component in this library follows — the component's own state is just which keys are
 * currently *checked* in each panel (not yet moved); `value`/`defaultValue` itself is the source of
 * truth for which side an item lives on.
 */
export function Transfer({
  items,
  value,
  defaultValue = [],
  onValueChange,
  sourceTitle = "Available",
  targetTitle = "Selected",
  className,
  ...props
}: TransferProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const targetKeys = isControlled ? value : internalValue;
  const targetKeySet = new Set(targetKeys);

  const setTargetKeys = (next: string[]) => {
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  // Which items are currently *checked* (about to be moved), tracked separately per side — not
  // the same thing as which side an item lives on (`targetKeys`/`value`).
  const [checkedSource, setCheckedSource] = useState<Set<string>>(new Set());
  const [checkedTarget, setCheckedTarget] = useState<Set<string>>(new Set());

  const sourceItems = items.filter((item) => !targetKeySet.has(item.key));
  const targetItems = items.filter((item) => targetKeySet.has(item.key));

  const toggleChecked = (checked: Set<string>, setChecked: (next: Set<string>) => void, key: string) => {
    const next = new Set(checked);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setChecked(next);
  };

  const moveToTarget = () => {
    if (checkedSource.size === 0) return;
    const next = [...targetKeys, ...sourceItems.filter((item) => checkedSource.has(item.key)).map((item) => item.key)];
    setTargetKeys(next);
    setCheckedSource(new Set());
  };

  const moveToSource = () => {
    if (checkedTarget.size === 0) return;
    const next = targetKeys.filter((key) => !checkedTarget.has(key));
    setTargetKeys(next);
    setCheckedTarget(new Set());
  };

  return (
    <div className={clsx("rebar-transfer", className)} data-rebar-component="transfer" {...props}>
      <TransferPanel
        title={sourceTitle}
        part="source-panel"
        items={sourceItems}
        checked={checkedSource}
        onToggle={(key) => toggleChecked(checkedSource, setCheckedSource, key)}
      />
      <div className="rebar-transfer-actions" data-rebar-part="actions">
        <button
          type="button"
          className="rebar-transfer-action-button"
          data-rebar-part="move-to-target"
          aria-label={`Move checked items to ${targetTitle}`}
          disabled={checkedSource.size === 0}
          onClick={moveToTarget}
        >
          →
        </button>
        <button
          type="button"
          className="rebar-transfer-action-button"
          data-rebar-part="move-to-source"
          aria-label={`Move checked items to ${sourceTitle}`}
          disabled={checkedTarget.size === 0}
          onClick={moveToSource}
        >
          ←
        </button>
      </div>
      <TransferPanel
        title={targetTitle}
        part="target-panel"
        items={targetItems}
        checked={checkedTarget}
        onToggle={(key) => toggleChecked(checkedTarget, setCheckedTarget, key)}
      />
    </div>
  );
}

interface TransferPanelProps {
  title: string;
  part: string;
  items: TransferItem[];
  checked: Set<string>;
  onToggle: (key: string) => void;
}

function TransferPanel({ title, part, items, checked, onToggle }: TransferPanelProps) {
  return (
    <div className="rebar-transfer-panel" data-rebar-part={part}>
      <div className="rebar-transfer-panel-header" data-rebar-part="panel-header">
        {title} ({items.length})
      </div>
      <div className="rebar-transfer-panel-list" data-rebar-part="panel-list">
        {items.length === 0 ? (
          <div className="rebar-transfer-panel-empty" data-rebar-part="panel-empty">
            No items
          </div>
        ) : (
          items.map((item) => (
            <div key={item.key} className="rebar-transfer-panel-row" data-rebar-part="panel-row">
              <Checkbox checked={checked.has(item.key)} onCheckedChange={() => onToggle(item.key)}>
                {item.label}
              </Checkbox>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
