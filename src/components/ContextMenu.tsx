import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
  ComponentPropsWithoutRef,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  TouchEvent as ReactTouchEvent,
} from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { useLongPress } from "../useLongPress";
import { renderBionicChildren, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";

/**
 * A single actionable entry. Deliberately the same shape as `Dropdown`'s own `DropdownItem`
 * (`key`/`label`/`onSelect`/`danger`/`disabled`) — this component is a different *trigger and
 * positioning* pattern (right-click-at-cursor vs. click-on-trigger-element), not a different item
 * vocabulary, so a caller migrating a menu from one to the other shouldn't have to reshape data.
 */
export interface ContextMenuAction {
  key: string;
  label: ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/** A visual divider between groups of actions. `Dropdown` has no separator convention yet (it's
 * never needed one), but a right-click menu commonly groups actions (e.g. edit actions vs. a
 * trailing destructive one) — added here rather than left unrepresentable. */
export interface ContextMenuSeparator {
  key: string;
  separator: true;
}

export type ContextMenuItem = ContextMenuAction | ContextMenuSeparator;

export interface ContextMenuProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The area that should show the menu on right-click (or long-press on touch) — wrapped, not
   * cloned, so it can be arbitrary content (text, an element, a fragment's worth of children). */
  children: ReactNode;
  items: ContextMenuItem[];
  /**
   * Whether the menu is open. Supports the standard controlled/uncontrolled pattern (Framework
   * Rule: every stateful component does) for the boolean open/closed state itself. What is
   * deliberately NOT controllable is *where* it opens: that's always the real cursor/touch
   * position captured at the moment of the triggering event, since there's no serializable
   * coordinate a caller would realistically pass by hand. If a caller drives `open` to `true`
   * externally (no live pointer event to anchor to), position falls back to the wrapped trigger
   * element's own top-left corner — see the `rawPosition` effect below.
   */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** How long a touch-and-hold must last before it counts as the touch equivalent of a
   * right-click. Forwarded to `useLongPress`; defaults to its own default (500ms). */
  longPressDelay?: number;
  /** Force bionic reading on/off for every item's label, overriding the ambient
   * data-rebar-bionic setting — same convention as `Breadcrumb`'s per-item handling. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

const VIEWPORT_GAP = 8;

function isSeparator(item: ContextMenuItem): item is ContextMenuSeparator {
  return "separator" in item && item.separator === true;
}

/**
 * A right-click-triggered menu positioned at the cursor (or, on touch, at a long-press point) —
 * distinct from `Dropdown`, which is click-triggered and positioned relative to its own trigger
 * element via Radix's Popper anchoring. That relative-anchor model is exactly wrong here: a
 * context menu's anchor point is a bare `(x, y)` with no element behind it, not a trigger element
 * Radix can measure a rect from. Rather than fake one (a zero-size, cursor-positioned "virtual
 * trigger" element handed to `@radix-ui/react-dropdown-menu`), this is a small, self-contained
 * implementation: a `position: fixed` portal, closed on the classic dismissal set (select, click
 * outside, Escape, scroll), with its own real roving focus for arrow-key navigation — because a
 * fake anchor trick would also make positioning untestable under jsdom, where every element's
 * `getBoundingClientRect()` reads as zero regardless of where a virtual anchor claims to be.
 *
 * Touch fallback (heuristic #48 — every mouse-only interaction needs a real touch equivalent):
 * there's no existing "long-press means right-click" convention yet in this codebase specifically
 * for context menus, but `useLongPress` (already used for `Kanban`'s double-click-to-edit) is the
 * closest existing precedent for "gesture that has no direct touch equivalent" — a touch-and-hold
 * on the wrapped area opens this same menu, positioned at the touch point instead of a cursor.
 * Chosen over, say, a trailing "more actions" affordance button (`SwipeActions`' own fallback)
 * because a context menu is inherently anchored to an arbitrary point *within* content (a table
 * row, a canvas node) rather than to one fixed control — long-press preserves that "menu appears
 * where you pressed" semantic on touch the way right-click does with a mouse.
 *
 * Every item is a real `<button>` at least 44px tall (touch-optimization gate item (a)) with
 * `tabIndex={-1}` — deliberately outside normal Tab order, focused only programmatically, since a
 * native OS context menu is arrow-key-navigable, not Tab-navigable; Enter/Space activate the
 * focused item via the button's own native click behavior, no extra key handling needed for those.
 */
export function ContextMenu({
  children,
  items,
  open,
  defaultOpen,
  onOpenChange,
  longPressDelay,
  bionic,
  bionicOptions,
  className,
  ...rest
}: ContextMenuProps) {
  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;
  const isOpenControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const currentOpen = isOpenControlled ? open : internalOpen;
  const setOpenState = (next: boolean) => {
    if (!isOpenControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const lastTouchPosRef = useRef<{ x: number; y: number } | null>(null);

  // Raw cursor/touch coordinates captured at the moment the menu was asked to open.
  const [rawPosition, setRawPosition] = useState<{ x: number; y: number } | null>(null);
  // The same position, clamped against the real rendered menu size once it's mounted and
  // measured — unlike `Tour`'s callout (which has to guess a footprint before anything is on
  // screen to measure), this menu is real DOM content already in the tree by the time we clamp.
  const [clampedPosition, setClampedPosition] = useState<{ x: number; y: number } | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const openAt = (x: number, y: number) => {
    lastFocusedElementRef.current = (document.activeElement as HTMLElement) ?? null;
    setRawPosition({ x, y });
    setOpenState(true);
  };

  const close = () => setOpenState(false);

  // Fallback anchor for a purely externally-driven `open={true}` with no live pointer event.
  useEffect(() => {
    if (currentOpen && rawPosition === null) {
      const rect = wrapperRef.current?.getBoundingClientRect();
      setRawPosition({ x: rect?.left ?? 0, y: rect?.top ?? 0 });
    }
  }, [currentOpen, rawPosition]);

  // Reset on close so the next open (real or fallback) starts fresh.
  useEffect(() => {
    if (!currentOpen) {
      setRawPosition(null);
      setClampedPosition(null);
      if (lastFocusedElementRef.current) {
        lastFocusedElementRef.current.focus?.();
        lastFocusedElementRef.current = null;
      }
    }
  }, [currentOpen]);

  // Clamp so the menu never renders off-screen: measure its own real rendered size and pull the
  // requested position back inside the viewport, same general idea as `Tour`'s
  // `pickPlacement`/`calloutStyle`, simplified since we only need "never off the near edge or the
  // far edge," not a choice between four sides.
  useLayoutEffect(() => {
    if (!currentOpen || !rawPosition) return;
    const el = menuRef.current;
    const width = el?.offsetWidth ?? 0;
    const height = el?.offsetHeight ?? 0;
    const maxX = Math.max(window.innerWidth - width - VIEWPORT_GAP, VIEWPORT_GAP);
    const maxY = Math.max(window.innerHeight - height - VIEWPORT_GAP, VIEWPORT_GAP);
    setClampedPosition({
      x: Math.min(Math.max(rawPosition.x, VIEWPORT_GAP), maxX),
      y: Math.min(Math.max(rawPosition.y, VIEWPORT_GAP), maxY),
    });
  }, [currentOpen, rawPosition]);

  // Real focus management: move actual DOM focus into the menu the moment it opens.
  useEffect(() => {
    if (!currentOpen) return;
    const firstEnabledIndex = items.findIndex((item) => !isSeparator(item) && !item.disabled);
    if (firstEnabledIndex !== -1) {
      itemRefs.current[firstEnabledIndex]?.focus();
    }
  }, [currentOpen]); // eslint-disable-line react-hooks/exhaustive-deps -- only re-run on open/close

  // The classic context-menu dismissal set: click outside, Escape, scroll.
  useEffect(() => {
    if (!currentOpen) return;
    const handleOutsideMouseDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        close();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    const handleScroll = () => close();
    document.addEventListener("mousedown", handleOutsideMouseDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleOutsideMouseDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [currentOpen]); // eslint-disable-line react-hooks/exhaustive-deps -- `close` is stable enough (reads latest state via closure over currentOpen's setter)

  const handleContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    openAt(event.clientX, event.clientY);
  };

  const longPress = useLongPress({
    delay: longPressDelay,
    onLongPress: () => {
      if (lastTouchPosRef.current) {
        openAt(lastTouchPosRef.current.x, lastTouchPosRef.current.y);
      }
    },
  });

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (touch) {
      lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };
    }
    longPress.onTouchStart(event);
  };

  const handleItemSelect = (item: ContextMenuAction) => {
    if (item.disabled) return;
    close();
    item.onSelect?.();
  };

  const enabledIndices = () =>
    items.reduce<number[]>((acc, item, index) => {
      if (!isSeparator(item) && !item.disabled) acc.push(index);
      return acc;
    }, []);

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const enabled = enabledIndices();
    if (enabled.length === 0) return;
    const activeIndex = itemRefs.current.findIndex((el) => el === document.activeElement);
    const currentPos = enabled.indexOf(activeIndex);

    const focusPos = (pos: number) => {
      const idx = enabled[((pos % enabled.length) + enabled.length) % enabled.length];
      if (idx !== undefined) itemRefs.current[idx]?.focus();
    };

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusPos(currentPos === -1 ? 0 : currentPos + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusPos(currentPos === -1 ? enabled.length - 1 : currentPos - 1);
        break;
      case "Home":
        event.preventDefault();
        focusPos(0);
        break;
      case "End":
        event.preventDefault();
        focusPos(enabled.length - 1);
        break;
      default:
        break;
    }
  };

  const position = clampedPosition ?? rawPosition;
  itemRefs.current = [];

  return (
    <>
      <div
        {...rest}
        ref={wrapperRef}
        className={clsx("rebar-context-menu", className)}
        data-rebar-component="context-menu"
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={longPress.onTouchEnd}
        onTouchMove={longPress.onTouchMove}
        onTouchCancel={longPress.onTouchCancel}
      >
        {children}
      </div>
      {currentOpen && mounted && position
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-orientation="vertical"
              className="rebar-context-menu-content"
              data-rebar-part="menu"
              style={{ position: "fixed", top: position.y, left: position.x }}
              onKeyDown={handleMenuKeyDown}
            >
              {items.map((item, index) =>
                isSeparator(item) ? (
                  <div
                    key={item.key}
                    role="separator"
                    className="rebar-context-menu-separator"
                    data-rebar-part="separator"
                  />
                ) : (
                  <button
                    key={item.key}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    disabled={item.disabled}
                    className="rebar-context-menu-item"
                    data-rebar-part="item"
                    data-rebar-danger={item.danger || undefined}
                    onClick={() => handleItemSelect(item)}
                  >
                    {renderBionicChildren(item.label, bionicEnabled, bionicOptions)}
                  </button>
                ),
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
