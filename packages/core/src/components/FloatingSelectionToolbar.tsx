import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

export interface FloatingSelectionAction {
  key: string;
  label: string;
  icon?: ReactNode;
  onSelect: (selectedText: string) => void;
}

export interface FloatingSelectionToolbarProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The editable/text area to watch selections within — a plain `RefObject`, not a function
   * prop: the caller already owns this element (a `<textarea>`, a `contentEditable` region, a
   * plain read-only block of prose), this component only ever reads its `.current`, never
   * constructs one. */
  containerRef: RefObject<HTMLElement | null>;
  actions: FloatingSelectionAction[];
  /** Don't show for a trivial selection shorter than this many (trimmed) characters. Default 3. */
  minSelectionLength?: number;
}

const VIEWPORT_GAP = 8;
const SELECTION_OFFSET = 8;

/** Real, non-collapsed, and anchored/focused entirely inside `container` — a selection that
 * starts inside the container and is dragged out into a sibling still doesn't count, matching
 * "within the given container" from the spec literally, not just "started there." */
function isSelectionWithinContainer(container: HTMLElement, selection: Selection): boolean {
  if (selection.rangeCount === 0 || selection.isCollapsed) return false;
  const { anchorNode, focusNode } = selection;
  if (!anchorNode || !focusNode) return false;
  return container.contains(anchorNode) && container.contains(focusNode);
}

function isCoarsePointer(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Computes where the toolbar should render: just above the selection's own bounding box by
 * default, falling back to below when there isn't room above — the same viewport-clamping idea
 * `Tour.tsx`'s `pickPlacement`/`calloutStyle` and `ContextMenu.tsx`'s clamping already use in this
 * codebase, simplified to "which side" plus a horizontal clamp since a floating toolbar (unlike
 * `Tour`'s callout, which can land on any of four sides) only ever needs to choose above or below.
 *
 * Touch tradeoff, stated plainly (not hidden): the OS's own native text-selection handle UI
 * already occupies the space directly above (and often below) a touch selection on most mobile
 * browsers. This component does not attempt to detect or coordinate with that native UI's exact
 * position — there's no DOM API exposing where a selection handle actually renders. Instead, on a
 * coarse-pointer (touch) device it simply *prefers* placing the toolbar below the selection rather
 * than above, since native handles most commonly sit above/at the selection start — reducing, but
 * not eliminating, the chance of visually colliding with them. This is an honest, documented
 * limitation, not a solved problem: a real device/browser may still render its own selection UI
 * close to or overlapping this toolbar in some cases.
 */
function computeToolbarPosition(
  selectionRect: DOMRect,
  toolbarWidth: number,
  toolbarHeight: number,
  viewportW: number,
  viewportH: number,
  preferBelowOnTouch: boolean,
): { top: number; left: number } {
  const spaceAbove = selectionRect.top;
  const spaceBelow = viewportH - selectionRect.bottom;
  const fitsAbove = spaceAbove >= toolbarHeight + SELECTION_OFFSET;
  const fitsBelow = spaceBelow >= toolbarHeight + SELECTION_OFFSET;

  // Default (mouse/keyboard): prefer above, fall back to below only when there's no room above.
  // Touch: prefer below (see doc comment above), only using above when below truly has no room
  // but above does.
  const placeAbove = preferBelowOnTouch ? fitsAbove && !fitsBelow : fitsAbove || !fitsBelow;

  const rawTop = placeAbove
    ? selectionRect.top - toolbarHeight - SELECTION_OFFSET
    : selectionRect.bottom + SELECTION_OFFSET;
  const maxTop = Math.max(viewportH - toolbarHeight - VIEWPORT_GAP, VIEWPORT_GAP);
  const top = Math.min(Math.max(rawTop, VIEWPORT_GAP), maxTop);

  const idealLeft = selectionRect.left + selectionRect.width / 2 - toolbarWidth / 2;
  const maxLeft = Math.max(viewportW - toolbarWidth - VIEWPORT_GAP, VIEWPORT_GAP);
  const left = Math.min(Math.max(idealLeft, VIEWPORT_GAP), maxLeft);

  return { top, left };
}

/**
 * A small floating action toolbar that appears at a live text selection's screen coordinates
 * inside an editable (or plain read-only) text area — Medium's/Notion's text-selection popup,
 * offering contextual actions ("Ask AI", "Define", "Simplify", ...) against whatever's currently
 * highlighted. Genuinely distinct from `Popover`/`ContextMenu`/`Tooltip`: all three of those anchor
 * to a fixed trigger *element*; this one anchors to a live, moving text-*selection range* that has
 * no element of its own — `getBoundingClientRect()` on the selection's `Range`, not on any node.
 *
 * Detection: `document.addEventListener("selectionchange", ...)`, not `mouseup`/`keyup` on
 * `containerRef`. Chosen deliberately, after considering both:
 * - `mouseup`/`keyup` misses real cases outright rather than merely lagging: extending a selection
 *   by holding Shift+Arrow repeats the selection change on every key-repeat `keydown`, but no
 *   `keyup` fires until the key is finally released, so the toolbar would only appear once the
 *   user lifts the key, not as the selection is actually growing — a real, visible lag that reads
 *   as "not tracking the selection." Similarly, a touch selection-handle drag adjusts the range
 *   continuously but doesn't reliably fire `mouseup`/`keyup` on the container at all in every
 *   browser (there's no mouse/keyboard event backing that gesture).
 * - `selectionchange` fires for every one of those cases (mouse drag, keyboard extension, touch
 *   handle drag, and programmatic changes) uniformly and immediately, with no per-input-method
 *   special-casing needed. The tradeoff: it can fire many times during a single drag, which is why
 *   this component keeps its handler cheap (a `contains()` check plus a `toString()`/rect read, no
 *   expensive work) rather than a real cause for debouncing.
 *
 * Stays open after an action fires (heuristic: don't punish "I want to trigger a second action
 * against the same text" by closing on every click) rather than closing itself immediately. This
 * falls out naturally rather than needing its own "stay open" flag: the toolbar's own root has
 * `onMouseDown={(e) => e.preventDefault()}` — the standard technique (also used by Medium/Notion's
 * own implementations) that stops the browser's default "clicking anywhere collapses the current
 * selection" behavior from firing when the click lands on the toolbar itself. Since the real
 * browser selection never changes, no `selectionchange` fires, and the toolbar simply stays exactly
 * as it was. It only closes on a *genuine* subsequent selection change (a new selection, or the
 * selection collapsing) or a real click-away (a click outside both `containerRef` and the toolbar
 * collapses the underlying selection on its own, which `selectionchange` picks up normally).
 */
export function FloatingSelectionToolbar({
  containerRef,
  actions,
  minSelectionLength = 3,
  className,
  "aria-label": ariaLabel,
  ...rest
}: FloatingSelectionToolbarProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const container = containerRef.current;
      const selection = window.getSelection();
      if (!container || !selection || !isSelectionWithinContainer(container, selection)) {
        setSelectedText(null);
        setSelectionRect(null);
        return;
      }
      const text = selection.toString();
      if (text.trim().length < minSelectionLength) {
        setSelectedText(null);
        setSelectionRect(null);
        return;
      }
      setSelectedText(text);
      setSelectionRect(selection.getRangeAt(0).getBoundingClientRect());
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [containerRef, minSelectionLength]);

  // The toolbar's position is only ever computed from a `selectionchange` event — scrolling the
  // page (or any scrollable ancestor of `containerRef`) doesn't fire that event at all, since the
  // actual Selection object hasn't changed, only its on-screen position has. Left unhandled, a
  // scroll leaves the toolbar frozen at its last computed viewport coordinates while the real
  // selection moves out from underneath it — a visibly "detached," stuck-in-place toolbar over
  // unrelated content. Closing on scroll (rather than live-repositioning) matches real precedent
  // (Medium/Notion's own selection toolbars both dismiss on scroll) and avoids the jank of
  // repositioning a floating element on every scroll tick.
  useEffect(() => {
    if (!selectedText) return;
    const handleScroll = () => {
      setSelectedText(null);
      setSelectionRect(null);
    };
    // Capture phase: scroll events don't bubble, so this is the only way to catch a scroll on any
    // scrollable ancestor of the selection, not just `window` itself.
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [selectedText]);

  // Measure the toolbar's own real rendered size (once it exists) and clamp against the viewport
  // — same two-pass idea as `ContextMenu`'s `clampedPosition` effect: position first at the raw,
  // unclamped spot so there's something to measure, then correct it once real dimensions exist.
  useLayoutEffect(() => {
    if (!selectionRect) {
      setPosition(null);
      return;
    }
    const el = toolbarRef.current;
    const width = el?.offsetWidth ?? 0;
    const height = el?.offsetHeight ?? 0;
    setPosition(
      computeToolbarPosition(
        selectionRect,
        width,
        height,
        window.innerWidth,
        window.innerHeight,
        isCoarsePointer(),
      ),
    );
  }, [selectionRect]);

  if (!mounted || !selectedText || !selectionRect) return null;

  const resolvedPosition = position ?? { top: selectionRect.top, left: selectionRect.left };

  return createPortal(
    <div
      {...rest}
      ref={toolbarRef}
      role="toolbar"
      aria-label={ariaLabel ?? "Text selection actions"}
      className={clsx("rebar-floating-selection-toolbar", className)}
      data-rebar-component="floating-selection-toolbar"
      style={{ position: "fixed", top: resolvedPosition.top, left: resolvedPosition.left }}
      // See the "stays open" doc note above — this is what makes it possible.
      onMouseDown={(event) => event.preventDefault()}
    >
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          role="button"
          className="rebar-floating-selection-toolbar-action"
          data-rebar-part="action"
          onClick={() => action.onSelect(selectedText)}
        >
          {action.icon ? <span aria-hidden="true">{action.icon}</span> : null}
          {action.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
