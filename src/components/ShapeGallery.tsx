import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from "react";
import clsx from "clsx";
import { Input } from "./Input";
import { Empty } from "./Empty";
import { Tabs, TabList, Tab, TabPanel } from "./Tabs";

export interface ShapeGalleryItem {
  id: string;
  label: string;
  category: string;
  /** An inline SVG or icon representing the shape/icon itself. */
  preview: ReactNode;
}

// A synthetic tab value no real `item.category` can collide with in practice — categories are
// caller-supplied strings, so this is namespaced defensively rather than assumed unique.
const FAVORITES_TAB = "__rebar_shape_gallery_favorites__";

export interface ShapeGalleryProps
  // `onSelect` collides with the native `onSelect` DOM event (text-selection, not "pick an item")
  // that HTMLAttributes declares on every element — same collision class as `title` on `Card`,
  // see robot.md's checklist item 6. Omit the native one and redeclare our own below.
  extends Omit<ComponentPropsWithoutRef<"div">, "onSelect"> {
  items: ShapeGalleryItem[];
  favoriteIds?: string[];
  defaultFavoriteIds?: string[];
  onFavoriteIdsChange?: (ids: string[]) => void;
  onSelect: (item: ShapeGalleryItem) => void;
  searchPlaceholder?: string;
}

interface ShapeGalleryGridProps {
  items: ShapeGalleryItem[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onSelectItem: (item: ShapeGalleryItem) => void;
  emptyMessage: string;
  "aria-label"?: string;
}

/**
 * A roving-tabindex grid of shape/icon swatches — arrow keys move focus between cells, only the
 * currently-focused cell is in the Tab order (the rest sit at `tabIndex={-1}`), matching the
 * pattern ref/COMPONENT_BACKLOG.md documents as still-missing on `Calendar`'s own day grid.
 * Mounted once per visible tab panel (Radix `Tabs.Content` unmounts inactive panels by default),
 * so its own `focusedIndex` state naturally resets on tab switch; a search-driven change to the
 * same panel's `items` is handled explicitly below since the component itself doesn't remount.
 *
 * Each swatch is a `div[role="button"]`, not a real `<button>`, specifically so it can hold a
 * real nested `<button>` (the favorite toggle) — the HTML content model forbids nesting one real
 * `<button>` inside another, but not inside a div carrying the `button` role. Enter/Space on the
 * swatch itself is handled manually as a result (a real `<button>` gets this for free natively;
 * this element doesn't).
 */
function ShapeGalleryGrid({
  items,
  favoriteIds,
  onToggleFavorite,
  onSelectItem,
  emptyMessage,
  "aria-label": ariaLabel,
}: ShapeGalleryGridProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
    setFocusedIndex((current) => Math.min(current, Math.max(items.length - 1, 0)));
  }, [items.length]);

  // Column count for Up/Down, measured from the real rendered layout rather than assumed from a
  // prop — this grid's CSS uses `repeat(auto-fill, ...)`, so the true column count depends on
  // container width and isn't knowable from props alone. Cells sharing the first cell's own
  // `top` are treated as one row; in a layout-less environment (no real reflow, e.g. jsdom under
  // test) every cell reports the same `top`, so this collapses to "one row of N" — a harmless,
  // documented simplification there, not a bug: a real browser lays the grid out for real.
  function getColumnCount(): number {
    const cells = itemRefs.current.filter((el): el is HTMLDivElement => el !== null);
    const firstCell = cells[0];
    if (!firstCell) return 1;
    const firstTop = firstCell.getBoundingClientRect().top;
    let count = 0;
    for (const cell of cells) {
      if (cell.getBoundingClientRect().top !== firstTop) break;
      count++;
    }
    return count > 0 ? count : 1;
  }

  function moveFocus(nextIndex: number) {
    if (items.length === 0) return;
    const clamped = Math.min(Math.max(nextIndex, 0), items.length - 1);
    setFocusedIndex(clamped);
    itemRefs.current[clamped]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>, index: number, item: ShapeGalleryItem) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        moveFocus(index + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveFocus(index - 1);
        break;
      case "ArrowDown":
        event.preventDefault();
        moveFocus(index + getColumnCount());
        break;
      case "ArrowUp":
        event.preventDefault();
        moveFocus(index - getColumnCount());
        break;
      case "Home":
        event.preventDefault();
        moveFocus(0);
        break;
      case "End":
        event.preventDefault();
        moveFocus(items.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        onSelectItem(item);
        break;
      default:
        break;
    }
  }

  if (items.length === 0) {
    // `Empty`'s own prop interface is closed (no rest-spread passthrough), so `data-rebar-part`
    // goes on a plain wrapper rather than on `Empty` itself, which would be a type error.
    return (
      <div data-rebar-part="empty">
        <Empty description={emptyMessage} className="rebar-shape-gallery-empty" />
      </div>
    );
  }

  return (
    <div className="rebar-shape-gallery-grid" data-rebar-part="grid" role="group" aria-label={ariaLabel}>
      {items.map((item, index) => {
        const isFavorite = favoriteIds.includes(item.id);
        return (
          <div
            key={item.id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            role="button"
            aria-label={item.label}
            tabIndex={index === focusedIndex ? 0 : -1}
            className="rebar-shape-gallery-swatch"
            data-rebar-part="swatch"
            onFocus={() => setFocusedIndex(index)}
            onClick={() => onSelectItem(item)}
            onKeyDown={(event) => handleKeyDown(event, index, item)}
          >
            <span className="rebar-shape-gallery-preview" data-rebar-part="preview" aria-hidden="true">
              {item.preview}
            </span>
            <span className="rebar-shape-gallery-label" data-rebar-part="label">
              {item.label}
            </span>
            <button
              type="button"
              className="rebar-shape-gallery-favorite"
              data-rebar-part="favorite-toggle"
              aria-pressed={isFavorite}
              aria-label={isFavorite ? `Remove ${item.label} from favorites` : `Add ${item.label} to favorites`}
              onClick={(event) => {
                // Without this, the click would bubble up to the swatch's own `onClick` above and
                // fire `onSelect` too — the spec calls for the star to toggle favorite status
                // *without* selecting, same "nested action stops propagation" convention Kanban's
                // own card drop handlers already use.
                event.stopPropagation();
                onToggleFavorite(item.id);
              }}
            >
              <span aria-hidden="true">{isFavorite ? "★" : "☆"}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * A categorized, searchable shape/icon picker — a palette panel for choosing a shape/icon to drop
 * onto a canvas (a diagramming/whiteboard editor's own shape tray, say), organized into real
 * `Tabs`/`TabList`/`Tab`/`TabPanel` category tabs plus a synthetic "Favorites" tab, with a live
 * search box and a starrable-favorites mechanism. Favorites are controlled/uncontrolled the same
 * way every other stateful component in this library is (`favoriteIds`/`defaultFavoriteIds`/
 * `onFavoriteIdsChange`).
 */
export const ShapeGallery = forwardRef<HTMLDivElement, ShapeGalleryProps>(function ShapeGallery(
  {
    items,
    favoriteIds,
    defaultFavoriteIds,
    onFavoriteIdsChange,
    onSelect,
    searchPlaceholder = "Search shapes...",
    className,
    ...props
  },
  ref,
) {
  const [search, setSearch] = useState("");

  const [internalFavoriteIds, setInternalFavoriteIds] = useState<string[]>(defaultFavoriteIds ?? []);
  const isFavoritesControlled = favoriteIds !== undefined;
  const currentFavoriteIds = isFavoritesControlled ? favoriteIds : internalFavoriteIds;

  function setFavoriteIds(next: string[]) {
    if (!isFavoritesControlled) setInternalFavoriteIds(next);
    onFavoriteIdsChange?.(next);
  }

  function toggleFavorite(id: string) {
    const next = currentFavoriteIds.includes(id)
      ? currentFavoriteIds.filter((existing) => existing !== id)
      : [...currentFavoriteIds, id];
    setFavoriteIds(next);
  }

  // Categories in first-seen order — no alphabetical re-sort, so a caller's own intended ordering
  // (most-used category first, say) survives into the tab order.
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const item of items) {
      if (!seen.has(item.category)) {
        seen.add(item.category);
        ordered.push(item.category);
      }
    }
    return ordered;
  }, [items]);

  const normalizedSearch = search.trim().toLowerCase();
  const matchesSearch = (item: ShapeGalleryItem) =>
    normalizedSearch === "" || item.label.toLowerCase().includes(normalizedSearch);

  const favoriteItems = items.filter((item) => currentFavoriteIds.includes(item.id) && matchesSearch(item));

  return (
    <div ref={ref} className={clsx("rebar-shape-gallery", className)} data-rebar-component="shape-gallery" {...props}>
      <Input
        aria-label={searchPlaceholder}
        placeholder={searchPlaceholder}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="rebar-shape-gallery-search"
        data-rebar-part="search-input"
      />
      <Tabs defaultValue={FAVORITES_TAB} className="rebar-shape-gallery-tabs">
        <TabList>
          <Tab value={FAVORITES_TAB}>Favorites</Tab>
          {categories.map((category) => (
            <Tab key={category} value={category}>
              {category}
            </Tab>
          ))}
        </TabList>
        <TabPanel value={FAVORITES_TAB}>
          <ShapeGalleryGrid
            items={favoriteItems}
            favoriteIds={currentFavoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectItem={onSelect}
            aria-label="Favorites"
            emptyMessage={
              normalizedSearch
                ? "No shapes found"
                : "No favorites yet — star a shape to add it here."
            }
          />
        </TabPanel>
        {categories.map((category) => {
          const categoryItems = items.filter((item) => item.category === category && matchesSearch(item));
          return (
            <TabPanel key={category} value={category}>
              <ShapeGalleryGrid
                items={categoryItems}
                favoriteIds={currentFavoriteIds}
                onToggleFavorite={toggleFavorite}
                onSelectItem={onSelect}
                aria-label={category}
                emptyMessage="No shapes found"
              />
            </TabPanel>
          );
        })}
      </Tabs>
    </div>
  );
});
