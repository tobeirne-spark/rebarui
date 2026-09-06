import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { useRef, useState } from "react";
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from "react";
import clsx from "clsx";
import { renderBionicChildren, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";

/**
 * One entry in a `MenubarMenu`'s dropdown contents. Deliberately the same shape as `Dropdown`'s
 * own `DropdownItem` (label/onSelect/danger/disabled) — a `Menubar` is a row of `Dropdown`s, not
 * a new item model — plus one addition `Dropdown` doesn't need: `separator`, since a real
 * desktop-app "File" menu groups items (New/Open ... Exit) with visual dividers. When
 * `separator` is true, `label`/`onSelect`/`disabled`/`danger` are ignored.
 */
export interface MenubarItem {
  key: string;
  label?: ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

export interface MenubarMenu {
  /** The top-level trigger text, e.g. "File". */
  label: string;
  items: MenubarItem[];
}

export interface MenubarProps extends ComponentPropsWithoutRef<"div"> {
  items: MenubarMenu[];
  /** Force bionic reading on/off for every trigger and item label, overriding the ambient
   * data-rebar-bionic setting — same per-item convention as `Breadcrumb`/`ContextMenu`. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

/**
 * A horizontal row of top-level menu triggers ("File / Edit / View"), each opening a real
 * `Dropdown`-shaped menu — the classic desktop-app menu bar. Two things this component adds on
 * top of a plain row of `Dropdown`s:
 *
 * 1. **Roving tabindex** between the top-level triggers (standard WAI-ARIA `menubar` pattern):
 *    only one trigger is ever in the natural Tab order (`tabIndex={0}`), the rest are `-1`.
 *    ArrowLeft/ArrowRight move which one that is, imperatively focusing the DOM node rather than
 *    relying on Tab order, exactly like `SegmentedControl`'s own roving tabindex.
 * 2. **Only one menu open at a time, with direct adjacent switching.** All triggers share one
 *    `openIndex` piece of state (not one independent open/closed bool per trigger) — each
 *    `RadixDropdownMenu.Root`'s `open` prop is just `openIndex === index`, so opening one via
 *    `setOpenIndex` automatically closes whichever other one was open, as a side effect of
 *    ordinary controlled-component re-rendering, no explicit "close the others" call needed.
 *    Hovering or arrow-keying to an adjacent trigger while a menu is already open re-runs that
 *    same `setOpenIndex` (see `openAt`), switching directly instead of needing a close-then-open.
 *    Real DOM focus, once a menu is open, follows Radix's own default behavior and lands inside
 *    the open content (its first item) rather than staying on the trigger row — matching real
 *    desktop menu-bar convention (Windows/GTK-style: switching to an adjacent top-level menu opens
 *    straight into its content, ready for further Up/Down item navigation). This isn't a
 *    workaround-free choice: this Radix version's `DropdownMenu.Content` doesn't expose
 *    `onOpenAutoFocus` as a public prop at all (filtered out of its own internal types), so there's
 *    no supported hook to override that default even if a different design were wanted — matching
 *    it is both the achievable and the idiomatic outcome here, not a compromise.
 */
export function Menubar({
  items,
  className,
  "aria-label": ariaLabel = "Menu bar",
  bionic,
  bionicOptions,
  ...props
}: MenubarProps) {
  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;
  // Which trigger is the current roving-tabindex target (Tab lands here).
  const [activeIndex, setActiveIndex] = useState(0);
  // Which menu (if any) is open — a single index, not one bool per trigger, so opening one is
  // always exclusive by construction.
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Mirrors `openIndex`, read from the closing menu's own `onCloseAutoFocus` below — that handler
  // fires (asynchronously, after the closing content unmounts) on *every* close, including one
  // caused by switching directly to an adjacent trigger, not just a "real" close (Escape/outside
  // click/item select). Render always runs before that effect, so this ref is always current by
  // the time it's read.
  const openIndexRef = useRef<number | null>(null);
  openIndexRef.current = openIndex;

  const focusTrigger = (index: number) => {
    setActiveIndex(index);
    triggerRefs.current[index]?.focus();
  };

  /** Makes `index` the roving-tabindex target and, if a menu is already open, opens its menu too. */
  const openAt = (index: number, wasOpen: boolean) => {
    focusTrigger(index);
    if (wasOpen) setOpenIndex(index);
  };

  const moveFocus = (fromIndex: number, direction: 1 | -1) => {
    const count = items.length;
    if (count === 0) return;
    const nextIndex = (fromIndex + direction + count) % count;
    openAt(nextIndex, openIndex !== null);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveFocus(index, 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveFocus(index, -1);
    }
    // Enter/Space/ArrowDown (open) and Escape (close + restore focus, while content is open) are
    // left to RadixDropdownMenu.Trigger/Content's own built-in keyboard handling — see the file
    // comment above `RadixDropdownMenu.Root`'s `onOpenChange` below for why duplicating that logic
    // here would race against Radix's own.
  };

  return (
    <div
      {...props}
      className={clsx("rebar-menubar", className)}
      data-rebar-component="menubar"
      role="menubar"
      aria-label={ariaLabel}
    >
      {items.map((menu, index) => {
        const isOpen = openIndex === index;
        return (
          <RadixDropdownMenu.Root
            key={menu.label + index}
            open={isOpen}
            // Radix's DropdownMenu defaults to `modal`, which `aria-hide`s and focus-traps
            // everything outside the open menu — including this Menubar's *other* triggers,
            // since they live in the same tree. That's exactly wrong for a menubar: switching to
            // an adjacent trigger (by hover or arrow key) while one menu is open is the defining
            // interaction this component adds over a plain row of independent `Dropdown`s.
            modal={false}
            onOpenChange={(next) => {
              // The single source of truth for "which menu is open" — driven by Radix itself
              // (click, Enter/Space/ArrowDown to open; Escape/outside-click/item-select to
              // close), not by a click handler of our own. Handling open/close ourselves *and*
              // via Radix's own trigger keydown would race: Radix's compose-driven keydown
              // handling always runs regardless of `preventDefault()`, so writing "open"/"close"
              // logic in our own `onKeyDown` too would double-fire against Radix's, occasionally
              // toggling back closed. Funneling everything through this one callback avoids that.
              if (next) {
                setActiveIndex(index);
                setOpenIndex(index);
              } else {
                setOpenIndex((current) => (current === index ? null : current));
              }
            }}
          >
            <RadixDropdownMenu.Trigger asChild>
              <button
                type="button"
                ref={(el) => {
                  triggerRefs.current[index] = el;
                }}
                role="menuitem"
                aria-haspopup="true"
                aria-expanded={isOpen}
                tabIndex={activeIndex === index ? 0 : -1}
                className="rebar-menubar-trigger"
                data-rebar-part="trigger"
                onMouseEnter={() => {
                  // Switch directly to an adjacent menu on hover while one is already open —
                  // the classic desktop menu-bar behavior — without needing a click to re-open.
                  if (openIndex !== null && openIndex !== index) {
                    openAt(index, true);
                  }
                }}
                onKeyDown={(event) => handleTriggerKeyDown(event, index)}
              >
                {renderBionicChildren(menu.label, bionicEnabled, bionicOptions)}
              </button>
            </RadixDropdownMenu.Trigger>
            <RadixDropdownMenu.Portal>
              <RadixDropdownMenu.Content
                className="rebar-menubar-content"
                data-rebar-component="menubar"
                data-rebar-part="menu"
                align="start"
                sideOffset={4}
                onKeyDown={(event) => {
                  // Opening a menu moves real focus into its Content (Radix's own default
                  // "focus first item on open" behavior), not the trigger button — so
                  // ArrowLeft/ArrowRight's "switch to the adjacent menu" needs its own handler
                  // here too, not just on the trigger in `handleTriggerKeyDown`.
                  if (event.key === "ArrowRight") {
                    event.preventDefault();
                    moveFocus(index, 1);
                  } else if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    moveFocus(index, -1);
                  }
                }}
                onCloseAutoFocus={(event) => {
                  // Deterministic "Escape closes the menu and returns focus to its trigger" —
                  // don't rely on Radix's own default restore-focus timing (rAF-based, and this
                  // project's own components generally prefer an explicit, test-friendly focus
                  // call over an implicit one — see e.g. Dialog's own focus-return handling).
                  event.preventDefault();
                  // ...but *only* when this is a genuine close (Escape/outside click/item
                  // select), not a direct switch to a different trigger's menu — `openAt` above
                  // already moved focus to that trigger before this content even started
                  // unmounting, and unconditionally refocusing here would yank it right back,
                  // which in turn reads as "focus left" to the *newly* opened menu's own
                  // dismissable-layer and closes that one too.
                  if (openIndexRef.current === null) {
                    focusTrigger(index);
                  }
                }}
              >
                {menu.items.map((item) =>
                  item.separator ? (
                    <RadixDropdownMenu.Separator
                      key={item.key}
                      className="rebar-menubar-separator"
                      data-rebar-part="separator"
                    />
                  ) : (
                    <RadixDropdownMenu.Item
                      key={item.key}
                      disabled={item.disabled}
                      onSelect={item.onSelect}
                      className="rebar-menubar-item"
                      data-rebar-part="item"
                      data-rebar-danger={item.danger || undefined}
                    >
                      {renderBionicChildren(item.label, bionicEnabled, bionicOptions)}
                    </RadixDropdownMenu.Item>
                  ),
                )}
              </RadixDropdownMenu.Content>
            </RadixDropdownMenu.Portal>
          </RadixDropdownMenu.Root>
        );
      })}
    </div>
  );
}
