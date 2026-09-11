import type { ReactNode } from "react";
import clsx from "clsx";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { Dropdown } from "./Dropdown";
import type { DropdownItem } from "./Dropdown";
import { CopyIcon, DeleteIcon, DownloadIcon, MoreIcon, MoveIcon } from "./icons";

export interface LightboxProps {
  src: string;
  alt: string;
  /** Defaults to rendering the image itself, at a normal thumbnail size, as the trigger —
   * clicking it opens the fullscreen preview. */
  trigger?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  /** Shows a copy-to-clipboard action button in the fullscreen footer, only when supplied — no
   * flag prop, the callback's presence *is* the flag (matching `FileManager`'s own
   * caller-supplied-callback convention rather than a separate boolean + callback pair). */
  onCopy?: () => void;
  /** Shows a delete action button, only when supplied. */
  onDelete?: () => void;
  /** Shows a move action button, only when supplied. */
  onMove?: () => void;
  /** Shows a download action button, only when supplied. */
  onDownload?: () => void;
  /** Shows a "more actions" overflow button opening a real `Dropdown` of caller-supplied items —
   * for actions that don't warrant their own dedicated icon button. */
  moreActions?: DropdownItem[];
}

/**
 * Click an image (or any trigger) to open a fullscreen preview overlay. Built directly on the
 * real Dialog component's `fullscreen` flag — no reimplemented modal/focus-trap logic here, and
 * Dialog's own close button is the only close button (no second one added).
 *
 * Pinch-zoom/pan is deliberately out of scope, for the same reason BottomSheet's drag handle
 * skipped real drag-to-dismiss physics: gesture physics (momentum, rubber-banding, multi-touch
 * scale/rotate) is a separate, harder problem than the "fullscreen preview + close" shape this
 * component covers.
 */
export function Lightbox({
  src,
  alt,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  className,
  onCopy,
  onDelete,
  onMove,
  onDownload,
  moreActions,
}: LightboxProps) {
  const defaultTrigger = (
    <button
      type="button"
      className="rebar-lightbox-trigger"
      data-rebar-part="trigger"
      aria-label={`Open full image: ${alt}`}
    >
      <img src={src} alt={alt} className="rebar-lightbox-thumbnail" data-rebar-part="thumbnail" />
    </button>
  );

  const hasActions = onCopy || onDelete || onMove || onDownload || (moreActions && moreActions.length > 0);

  return (
    <span className={clsx("rebar-lightbox", className)} data-rebar-component="lightbox">
      <Dialog
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        trigger={trigger ?? defaultTrigger}
        title={alt}
        fullscreen
        className="rebar-lightbox-dialog"
        footer={
          hasActions ? (
            <div className="rebar-lightbox-actions" data-rebar-part="actions">
              {onCopy ? (
                <Button variant="secondary" size="sm" onClick={onCopy} aria-label="Copy image">
                  <CopyIcon size="1.25em" />
                </Button>
              ) : null}
              {onDownload ? (
                <Button variant="secondary" size="sm" onClick={onDownload} aria-label="Download image">
                  <DownloadIcon size="1.25em" />
                </Button>
              ) : null}
              {onMove ? (
                <Button variant="secondary" size="sm" onClick={onMove} aria-label="Move image">
                  <MoveIcon size="1.25em" />
                </Button>
              ) : null}
              {onDelete ? (
                <Button variant="destructive" size="sm" onClick={onDelete} aria-label="Delete image">
                  <DeleteIcon size="1.25em" />
                </Button>
              ) : null}
              {moreActions && moreActions.length > 0 ? (
                <Dropdown
                  items={moreActions}
                  trigger={
                    <Button variant="secondary" size="sm" aria-label="More actions">
                      <MoreIcon size="1.25em" />
                    </Button>
                  }
                />
              ) : null}
            </div>
          ) : undefined
        }
      >
        <img src={src} alt={alt} className="rebar-lightbox-image" data-rebar-part="image" />
      </Dialog>
    </span>
  );
}
