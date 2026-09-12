import { useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import { Empty } from "./Empty";
import { Skeleton } from "./Skeleton";

export interface InfiniteScrollGridProps<T> extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The caller owns all data fetching/state — this component performs no networking of its own,
   * it only ever renders whatever's already in `items` and asks for more via `onLoadMore`. */
  items: T[];
  renderItem: (item: T) => ReactNode;
  /** A stable, unique string per item — same convention as `Table`'s `rowKey`/`Kanban`'s card ids. */
  keyExtractor: (item: T) => string;
  hasMore: boolean;
  /** True while a fetch for the next page is in flight. Drives both the skeleton row and the
   * intersection guard below (a load already in flight never fires a second `onLoadMore`). */
  isLoading: boolean;
  /** Fires when the sentinel becomes visible and `hasMore && !isLoading` — see this component's
   * own file comment above the intersection-observer effect for the exact re-fire guard. */
  onLoadMore: () => void;
  /** Grid column count. Default responsive: 3 columns, stepping down to 2 at `--rebar-breakpoint-lg`
   * (1024px) and 1 at `--rebar-breakpoint-sm` (640px) — same literal breakpoints `SectionNav`
   * already uses. An explicit value still steps down the same way at those widths (see the CSS
   * reported alongside this component), so a caller-chosen fixed count doesn't reproduce
   * `Masonry`'s own "fixed column count on mobile" gap (ref/COMPONENT_BACKLOG.md). */
  columns?: number;
  /** How many `Skeleton` placeholders to show while `isLoading`. Defaults to `columns` (or 3). */
  skeletonCount?: number;
  /** Shown via the real `Empty` component when `items` is empty and not loading. */
  emptyMessage?: string;
}

/**
 * An infinite-scroll card grid — the caller owns all data/fetch state (`items`, `hasMore`,
 * `isLoading`); this component only renders what it's given and asks for more via `onLoadMore`
 * once a sentinel near the bottom of the grid becomes visible. Distinct from `Pagination`
 * (page-number based, no scroll detection) and `Table`/`DataGrid` (no infinite-loading concept at
 * all) — see robot.md's component catalog.
 *
 * Uses a real `IntersectionObserver` on a 1px sentinel appended after the last item/skeleton, not
 * a `scroll` listener with manual scrollTop/scrollHeight math — the correct, modern primitive for
 * "has the user scrolled near the end," and one that keeps working correctly if the grid's own
 * container (rather than the window) is what scrolls.
 *
 * Re-fire guard, the trickiest part of this component: `IntersectionObserver` only invokes its
 * callback when the intersection state actually *changes* (crossing the threshold), not on every
 * frame the sentinel stays visible — so naively calling `onLoadMore` from inside the callback
 * would already avoid firing on every scroll tick, but NOT avoid a burst if the sentinel is still
 * intersecting once a fetch resolves and appends more items (a real risk on a tall viewport with a
 * small page size, where the newly-appended content still doesn't push the sentinel off-screen).
 * A `firedRef` records "already asked for the next page, waiting for a reset" and blocks a second
 * call; it's cleared two ways, matching the two reset conditions actually asked for:
 *   1. The sentinel genuinely leaves view (`isIntersecting` flips to `false`) — the normal case,
 *      since appended content usually does push the sentinel down and off-screen, and scrolling
 *      back down re-enters it.
 *   2. `items`/`hasMore` change — handles the tall-viewport case above, where the sentinel never
 *      actually left view: once new items land the guard clears immediately, and if the sentinel
 *      is *still* intersecting at that moment (tracked in `isIntersectingRef`, updated on every
 *      real observer callback) it retries right away instead of waiting for a scroll event that
 *      will never come.
 * Merely `isLoading` resolving on its own (e.g. a failed fetch, `items`/`hasMore` unchanged) does
 * NOT clear the guard by itself — only a real leave/re-enter or an actual data change does — so a
 * failed load doesn't spin into an immediate retry loop while the sentinel is still in view.
 */
export function InfiniteScrollGrid<T>({
  items,
  renderItem,
  keyExtractor,
  hasMore,
  isLoading,
  onLoadMore,
  columns = 3,
  skeletonCount,
  emptyMessage = "No results.",
  className,
  style,
  ...props
}: InfiniteScrollGridProps<T>) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);
  const isIntersectingRef = useRef(false);

  // Always-current refs so the observer's own callback (created once per sentinel mount, see the
  // effect below) never closes over a stale `hasMore`/`isLoading`/`onLoadMore` from the render
  // that first attached it.
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  const tryFireRef = useRef(() => {});
  tryFireRef.current = () => {
    if (firedRef.current) return;
    if (!hasMoreRef.current || isLoadingRef.current) return;
    firedRef.current = true;
    onLoadMoreRef.current();
  };

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      isIntersectingRef.current = entry.isIntersecting;
      if (entry.isIntersecting) {
        tryFireRef.current();
      } else {
        // Left the bottom area entirely — clear the guard so scrolling back down can fire again.
        firedRef.current = false;
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
    // Re-attach whenever the sentinel itself mounts/unmounts (only happens as `hasMore` toggles,
    // since the sentinel isn't rendered at all once there's nothing more to load).
  }, [hasMore]);

  useEffect(() => {
    // A real data change (or `hasMore` flipping) is always a legitimate new opportunity to load
    // more, independent of whether the sentinel ever actually left view — see the file comment.
    firedRef.current = false;
    if (isIntersectingRef.current) {
      tryFireRef.current();
    }
  }, [items, hasMore]);

  const resolvedSkeletonCount = skeletonCount ?? columns;
  const isEmpty = items.length === 0 && !isLoading;

  const gridStyle = {
    "--rebar-infinite-scroll-grid-columns": String(columns),
    ...style,
  } as CSSProperties;

  return (
    <div
      className={clsx("rebar-infinite-scroll-grid-wrapper", className)}
      data-rebar-component="infinite-scroll-grid"
      {...props}
    >
      {isEmpty ? (
        <Empty description={emptyMessage} />
      ) : (
        <div className="rebar-infinite-scroll-grid" data-rebar-part="grid" style={gridStyle}>
          {items.map((item) => (
            <div className="rebar-infinite-scroll-grid-item" data-rebar-part="item" key={keyExtractor(item)}>
              {renderItem(item)}
            </div>
          ))}
          {isLoading
            ? Array.from({ length: resolvedSkeletonCount }, (_, i) => (
                <div
                  className="rebar-infinite-scroll-grid-skeleton"
                  data-rebar-part="skeleton"
                  key={`skeleton-${i}`}
                >
                  <Skeleton variant="rect" height={160} />
                  <Skeleton variant="text" lines={2} />
                </div>
              ))
            : null}
          {hasMore ? (
            <div
              ref={sentinelRef}
              className="rebar-infinite-scroll-grid-sentinel"
              data-rebar-part="sentinel"
              aria-hidden="true"
            />
          ) : null}
        </div>
      )}
      {!hasMore && !isLoading && items.length > 0 ? (
        <div className="rebar-infinite-scroll-grid-end-caption" data-rebar-part="end-caption">
          You&rsquo;ve reached the end.
        </div>
      ) : null}
    </div>
  );
}
