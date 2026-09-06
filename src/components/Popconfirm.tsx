import { useState } from "react";
import type { ReactElement } from "react";
import { Popover } from "./Popover";
import { Button } from "./Button";
import { Stack } from "./Stack";
import { Text } from "./Text";

export interface PopconfirmProps {
  trigger: ReactElement;
  /** The confirm question, e.g. "Delete this item?" */
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button with `Button`'s own `variant="destructive"`, matching
   * `ActionSheet`'s existing precedent for a destructive-styled confirm action. */
  destructive?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * An inline "are you sure?" confirmation attached to a trigger — lighter-weight than a full
 * `Dialog` for a single yes/no action. Pure composition: the real `Popover` owns positioning and
 * open state (matching its own controlled/uncontrolled `open`/`onOpenChange` shape exactly, since
 * that's the only state this component itself has), and the real `Button` renders Confirm/Cancel —
 * no reimplemented overlay or button logic. Confirm calls `onConfirm` then closes the popover;
 * Cancel calls `onCancel` (if provided) then closes it without ever calling `onConfirm`.
 */
export function Popconfirm({
  trigger,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = "Yes",
  cancelLabel = "No",
  destructive = false,
  open,
  onOpenChange,
}: PopconfirmProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const handleConfirm = () => {
    onConfirm();
    handleOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    handleOpenChange(false);
  };

  return (
    <Popover open={currentOpen} onOpenChange={handleOpenChange} trigger={trigger}>
      <Stack gap="sm" data-rebar-component="popconfirm">
        <Text as="strong" size="sm" data-rebar-part="title">
          {title}
        </Text>
        {description ? (
          <Text size="xs" color="secondary" data-rebar-part="description">
            {description}
          </Text>
        ) : null}
        <Stack direction="row" gap="sm" justify="end" data-rebar-part="actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            data-rebar-part="cancel"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "primary"}
            onClick={handleConfirm}
            data-rebar-part="confirm"
          >
            {confirmLabel}
          </Button>
        </Stack>
      </Stack>
    </Popover>
  );
}
