import { useRef, useState } from "react";
import type { ComponentPropsWithoutRef, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import clsx from "clsx";

export interface SwipeAction {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
}

export interface SwipeActionsProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The row's normal content. */
  children: ReactNode;
  /** Actions revealed by swiping the row left, right-aligned. */
  actions: SwipeAction[];
  disabled?: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * A list row that reveals right-aligned actions (Archive, Delete, ...) by swiping the content
 * left — the Gmail/iOS Mail row pattern. Plain `pointerdown`/`pointermove`/`pointerup` on the row
 * content (no new dependency), same technique `ResizablePanels` uses for its divider drag: past
 * roughly 40% of the actions' total width, release snaps fully open; otherwise it springs back
 * closed via a CSS transition (no real spring physics — out of scope for this project's
 * low-fidelity gesture handling, same discipline `BottomSheet`'s own drag handle already applies).
 *
 * Heuristic #38 (drag-and-drop needs a non-drag fallback): a swipe-only reveal would leave a
 * mouse/keyboard user with zero access to the actions underneath, even though each one renders as
 * a real, keyboard-focusable `<button>`. The real fallback here is a small, always-visible "more
 * actions" kebab button pinned to the row's trailing edge (independent of the swipe transform, so
 * it never moves or disappears) that toggles the exact same open/closed state a completed swipe
 * would — a real, bidirectional (opens AND closes) non-drag path, not just a one-way escape hatch.
 */
export function SwipeActions({ children, actions, disabled, className, ...props }: SwipeActionsProps) {
  const actionsRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [open, setOpen] = useState(false);

  const actionsWidth = () => actionsRef.current?.getBoundingClientRect().width ?? 0;
  const committedOffset = open && !disabled ? -actionsWidth() : 0;
  const displayOffset = dragOffset ?? committedOffset;

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;

    draggingRef.current = true;
    startXRef.current = e.clientX;
    startOffsetRef.current = committedOffset;
    dragOffsetRef.current = committedOffset;
    setIsDragging(true);
    setDragOffset(committedOffset);

    const handleMove = (moveEvent: PointerEvent) => {
      if (!draggingRef.current) return;
      const delta = moveEvent.clientX - startXRef.current;
      const width = actionsWidth();
      const next = clamp(startOffsetRef.current + delta, -width, 0);
      dragOffsetRef.current = next;
      setDragOffset(next);
    };
    const handleUp = () => {
      draggingRef.current = false;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      const width = actionsWidth();
      const openThreshold = -(width * 0.4);
      const shouldOpen = width > 0 && dragOffsetRef.current <= openThreshold;
      setIsDragging(false);
      setDragOffset(null);
      setOpen(shouldOpen);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <div
      className={clsx("rebar-swipe-actions", className)}
      data-rebar-component="swipe-actions"
      {...props}
    >
      <div
        className="rebar-swipe-actions-actions"
        data-rebar-part="actions"
        ref={actionsRef}
        aria-hidden={!open || Boolean(disabled)}
      >
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="rebar-swipe-actions-action"
            data-rebar-part="action"
            data-rebar-destructive={action.destructive || undefined}
            tabIndex={open && !disabled ? 0 : -1}
            disabled={disabled}
            onClick={() => {
              action.onSelect();
              setOpen(false);
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
      <div
        className="rebar-swipe-actions-content"
        data-rebar-part="content"
        onPointerDown={handlePointerDown}
        style={{
          transform: `translateX(${displayOffset}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease",
        }}
      >
        {children}
      </div>
      <button
        type="button"
        className="rebar-swipe-actions-toggle"
        data-rebar-part="toggle"
        aria-label={open ? "Hide actions" : "More actions"}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        ⋮
      </button>
    </div>
  );
}
