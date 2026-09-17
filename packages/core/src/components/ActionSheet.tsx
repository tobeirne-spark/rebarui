import type { ReactNode } from "react";
import { useState } from "react";
import clsx from "clsx";
import { DrawerPanel } from "./Drawer";

export interface ActionSheetAction {
  label: string;
  onSelect?: () => void;
  destructive?: boolean;
}

export interface ActionSheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title?: ReactNode;
  actions: ActionSheetAction[];
  /** Label for the separate, visually-distinct dismiss button. Defaults to "Cancel". */
  cancelLabel?: string;
}

/**
 * `BottomSheet`-shaped, but its content is a fixed list of actions rather than arbitrary
 * children. Each action renders as a real, full-width, minimum-44px-tall button — destructive
 * ones reuse `Button`'s own `variant="destructive"` visual treatment — plus a separate,
 * visually-separated Cancel button. Selecting any action (or Cancel) closes the sheet, so this
 * component holds its own controlled/uncontrolled open state (the same `isControlled`/
 * `internalOpen`/`currentOpen`/`handleOpenChange` pattern every stateful rebar-ui component uses)
 * and always drives `DrawerPanel` in "controlled" mode underneath it.
 */
export function ActionSheet({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  actions,
  cancelLabel = "Cancel",
}: ActionSheetProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const currentOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const handleSelect = (action: ActionSheetAction) => {
    action.onSelect?.();
    handleOpenChange(false);
  };

  return (
    <DrawerPanel
      open={currentOpen}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={title}
      side="bottom"
      dataComponent="action-sheet"
      dragToDismiss
      handle={<div className="rebar-bottom-sheet-handle" data-rebar-part="handle" aria-hidden="true" />}
    >
      <div className="rebar-action-sheet-list" data-rebar-part="actions">
        {actions.map((action, i) => (
          <button
            key={`${action.label}-${i}`}
            type="button"
            className={clsx(
              "rebar-action-sheet-item",
              action.destructive && "rebar-action-sheet-item-destructive",
            )}
            data-rebar-part="action"
            onClick={() => handleSelect(action)}
          >
            {action.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="rebar-action-sheet-cancel"
        data-rebar-part="cancel"
        onClick={() => handleOpenChange(false)}
      >
        {cancelLabel}
      </button>
    </DrawerPanel>
  );
}
