import { forwardRef, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { Popover } from "./Popover";
import { ChevronDownIcon } from "./icons";

export interface SplitButtonItem {
  label: string;
  onSelect?: () => void;
}

export interface SplitButtonProps extends Omit<ComponentPropsWithoutRef<"div">, "onClick"> {
  label: string;
  /** The primary action, fired by clicking the main button (never by opening the menu). */
  onClick?: () => void;
  items: SplitButtonItem[];
  /** Passed through to both the primary and caret Button. */
  variant?: "primary" | "secondary";
  /** Passed through to both the primary and caret Button — matches Button's own size values. */
  size?: "sm" | "md" | "lg";
}

/**
 * A primary Button with an attached caret Button opening a Popover of secondary actions,
 * rendered as one visually joined unit. Pure composition of the real Button + Popover — no
 * reimplemented menu/positioning logic.
 *
 * Touch-optimization: both buttons independently meet 44x44 — Button's own default sizing
 * already gives every size a min-height >= 32px with "md" (this component's default) at 44px;
 * the caret button's icon-only content wouldn't otherwise guarantee a 44px *width* the way a
 * labeled button's own text does, so `.rebar-split-button-trigger` adds an explicit min-width.
 */
export const SplitButton = forwardRef<HTMLDivElement, SplitButtonProps>(function SplitButton(
  { label, onClick, items, variant = "primary", size = "md", className, ...props },
  ref,
) {
  const [open, setOpen] = useState(false);

  return (
    <div
      ref={ref}
      className={clsx("rebar-split-button", className)}
      data-rebar-component="split-button"
      {...props}
    >
      <Button
        variant={variant}
        size={size}
        onClick={onClick}
        className="rebar-split-button-primary"
        data-rebar-part="primary"
      >
        {label}
      </Button>
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger={
          <Button
            variant={variant}
            size={size}
            aria-label={`More ${label} actions`}
            className="rebar-split-button-trigger"
            data-rebar-part="trigger"
          >
            <span aria-hidden="true">
              <ChevronDownIcon />
            </span>
          </Button>
        }
      >
        <div className="rebar-split-button-menu" data-rebar-part="menu">
          {items.map((item, index) => (
            <Button
              key={`${item.label}-${index}`}
              variant="tertiary"
              size="sm"
              className="rebar-split-button-item"
              data-rebar-part="item"
              onClick={() => {
                setOpen(false);
                item.onSelect?.();
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </Popover>
    </div>
  );
});
