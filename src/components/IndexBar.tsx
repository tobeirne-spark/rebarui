import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import clsx from "clsx";

export interface IndexBarGroup<T> {
  /** The jump-rail's own label for this group — typically a single letter ("A", "B", ...). Also
   * used as this group's own section-header text when `renderGroupHeader` isn't supplied. */
  key: string;
  items: T[];
}

export interface IndexBarProps<T> {
  groups: IndexBarGroup<T>[];
  renderItem: (item: T, groupKey: string, index: number) => ReactNode;
  /** Defaults to the group's own `key` rendered as plain text — override for something richer
   * (a count, an icon) than a bare letter. */
  renderGroupHeader?: (groupKey: string) => ReactNode;
  /** Height of the scrollable list area, in px. Default `400`. */
  height?: number;
  "aria-label"?: string;
  className?: string;
}

/**
 * An alphabetical-jump sidebar for a long grouped list — the antd-mobile `IndexBar` pattern (real-
 * world precedent: iOS Contacts). The real interaction is a continuous drag down the letter rail,
 * not precise tapping of each individual letter: with ~26 groups, no single letter can realistically
 * meet a real 44×44 touch target on its own (ref/HEURISTICS.md #19) — the deliberate, standard
 * resolution this whole component family uses industry-wide is treating the *rail itself* as one
 * large touch surface, tracking the pointer's Y position across it rather than requiring an exact
 * tap on a specific tiny letter. A floating bubble shows the currently-touched letter in real time
 * (ref/HEURISTICS.md #1, visibility of system status) so a user dragging blind (finger covering the
 * rail) still knows where they are. A plain click/tap on one letter (no drag) still works too, and
 * every letter stays keyboard-focusable and Enter-activatable — the drag gesture is an enhancement
 * over a real discrete affordance, not a replacement for one.
 */
export function IndexBar<T>({
  groups,
  renderItem,
  renderGroupHeader,
  height = 400,
  "aria-label": ariaLabel = "Jump to letter",
  className,
}: IndexBarProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const scrollToGroup = (key: string) => {
    const container = scrollRef.current;
    const header = headerRefs.current[key];
    if (!container || !header) return;
    container.scrollTop = header.offsetTop - container.offsetTop;
  };

  const keyAtPoint = (x: number, y: number): string | null => {
    if (typeof document.elementFromPoint !== "function") return null;
    const el = document.elementFromPoint(x, y);
    const button = el?.closest("[data-index-key]") as HTMLElement | null;
    return button?.dataset.indexKey ?? null;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const key = keyAtPoint(event.clientX, event.clientY);
    if (key) {
      setActiveKey(key);
      scrollToGroup(key);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.buttons === 0) return;
    const key = keyAtPoint(event.clientX, event.clientY);
    if (key && key !== activeKey) {
      setActiveKey(key);
      scrollToGroup(key);
    }
  };

  const handlePointerUp = () => setActiveKey(null);

  return (
    <div className={clsx("rebar-index-bar", className)} data-rebar-component="index-bar">
      <div
        ref={scrollRef}
        className="rebar-index-bar-list"
        data-rebar-part="list"
        style={{ height, overflowY: "auto" }}
        aria-label={ariaLabel}
      >
        {groups.map((group) => (
          <div key={group.key} data-rebar-part="group">
            <div
              ref={(el) => {
                headerRefs.current[group.key] = el;
              }}
              className="rebar-index-bar-group-header"
              data-rebar-part="group-header"
            >
              {renderGroupHeader ? renderGroupHeader(group.key) : group.key}
            </div>
            {group.items.map((item, i) => (
              <div key={i} data-rebar-part="item">
                {renderItem(item, group.key, i)}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div
        className="rebar-index-bar-rail"
        data-rebar-part="rail"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {groups.map((group) => (
          <button
            key={group.key}
            type="button"
            className="rebar-index-bar-rail-letter"
            data-rebar-part="rail-letter"
            data-index-key={group.key}
            data-rebar-active={activeKey === group.key || undefined}
            onClick={() => scrollToGroup(group.key)}
          >
            {group.key}
          </button>
        ))}
      </div>
      {activeKey ? (
        <div className="rebar-index-bar-bubble" data-rebar-part="bubble" aria-hidden="true">
          {activeKey}
        </div>
      ) : null}
    </div>
  );
}
