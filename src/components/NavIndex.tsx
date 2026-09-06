import { useMemo, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { MultiSelect } from "./MultiSelect";
import { Tag } from "./Tag";
import type { TagTone } from "./Tag";

export interface NavIndexItem {
  label: string;
  href: string;
  /** Groups this item under a filter chip (e.g. "web" / "mobile" / "diagram"). Omit for an item that should always show, unaffected by search or category filtering — see the "overview" note below. */
  category?: string;
  /**
   * Lifecycle status ("Planned", "Deprecated", "Beta") shown as a real `Tag` pill next to the
   * label — never inline parenthetical text (e.g. "Avatar (planned)"). See ref/HEURISTICS.md #41:
   * a status is metadata about the item, not part of its name, and reads as noise once it's
   * concatenated into the label string itself — a pill keeps it scannable and lets the label stay
   * the actual name.
   */
  status?: string;
  statusTone?: TagTone;
}

export interface NavIndexProps extends Omit<ComponentPropsWithoutRef<"nav">, "className"> {
  items: NavIndexItem[];
  /** Display label per category key, e.g. { web: "Web", mobile: "Mobile" }. */
  categoryLabels?: Record<string, string>;
  /** Display label per distinct `status` value, for the independent status filter dimension —
   * see ref/HEURISTICS.md #42 (category and status are two separate filter dimensions, each
   * scaled to its own number of values). Only shown once items collectively use 2+ distinct
   * status values (including "no status set", labeled via `unstatusedLabel`). */
  statusLabels?: Record<string, string>;
  /** Label for the status-filter chip covering items with no `status` set — the default/"good"
   * case heuristic #41 already says shouldn't render its own tag, but which #42 still treats as
   * one real, filterable state once another item has a different one. */
  unstatusedLabel?: string;
  searchPlaceholder?: string;
  /** Renders a link — defaults to a plain `<a href>`. Pass your framework's Link (e.g. Next.js's) for client-side routing, same convention as `NavBar`'s `renderLink` and `@rebar-ui/placement`'s. */
  renderLink?: (props: { href: string; children: ReactNode; className?: string }) => ReactNode;
  className?: string;
}

const defaultRenderLink = ({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) => (
  <a href={href} className={className}>
    {children}
  </a>
);

/** Below this item count, search/category chrome is hidden even if categories exist — see ref/HEURISTICS.md #11 (IA as pyramid): a short list doesn't need a filter, and showing one anyway is chrome with nothing to justify it. */
const FILTER_UI_THRESHOLD = 12;

/**
 * A vertical index of links — search box, optional category chips, the filtered list — built as
 * one real component instead of once-off page code, after exactly that duplication happened:
 * apps/docs hand-rolled this same search+filter+list shape independently for its `/components`
 * and `/docs` sidebars. Two behaviors worth calling out because they were real bugs the first time
 * around:
 *
 * 1. Un-categorized items (no `category` field) always render above the filterable list, in bold,
 *    untouched by search or category filtering. This is deliberately NOT the same thing as the
 *    "All" category chip below it, even though the two can look similar worded ("All components"
 *    next to an "All" chip) — the chip only clears a filter *in place*, it never navigates; an
 *    un-categorized item is a real link (e.g. "back to the section's own index page"). Conflating
 *    the two reads as duplicate UI doing the same job — keep them visually and structurally
 *    distinct rather than styling them the same way.
 * 2. Category and status are each a real `MultiSelect` — closed checklist dropdowns, not a
 *    hand-rolled row of styled `<button>`s reimplementing a component this library already ships.
 *    Not a `SegmentedControl` toggle: both dimensions can carry more values than a single-select
 *    toggle handles gracefully (a long label like "No reference page" next to several others
 *    overflows a row of buttons rather than wrapping), and — the more important reason — a reader
 *    may genuinely want *more than one* value visible at once (both "Planned" and "No reference
 *    page" items, say), which a single-select toggle can't express at all. See ref/HEURISTICS.md
 *    #42: a filter dimension's control matches how many values it has, in three tiers now, not
 *    two — a small fixed few (2-3) is a toggle; a larger but still-scannable known set, where more
 *    than one value may need selecting, is `MultiSelect`; a genuinely large, open-ended set is
 *    `Combobox`'s `multiple` mode.
 */
const UNSTATUSED = "";

export function NavIndex({
  items,
  categoryLabels,
  statusLabels,
  unstatusedLabel = "Other",
  searchPlaceholder = "Search…",
  renderLink = defaultRenderLink,
  "aria-label": ariaLabel = "Page index",
  className,
  ...props
}: NavIndexProps) {
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);

  const overviewItems = useMemo(() => items.filter((item) => !item.category), [items]);
  const filterableItems = useMemo(() => items.filter((item) => item.category), [items]);

  const categories = useMemo(
    () => Array.from(new Set(filterableItems.map((item) => item.category!))),
    [filterableItems],
  );
  const statuses = useMemo(
    () => Array.from(new Set(filterableItems.map((item) => item.status ?? UNSTATUSED))),
    [filterableItems],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return filterableItems.filter((item) => {
      if (activeCategories.length > 0 && !activeCategories.includes(item.category!)) return false;
      if (activeStatuses.length > 0 && !activeStatuses.includes(item.status ?? UNSTATUSED)) return false;
      if (q && !item.label.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [filterableItems, query, activeCategories, activeStatuses]);

  const showFilterUI = items.length > FILTER_UI_THRESHOLD;

  return (
    <nav
      aria-label={ariaLabel}
      className={clsx("rebar-nav-index", className)}
      data-rebar-component="nav-index"
      {...props}
    >
      <div className="rebar-nav-index-controls" data-rebar-part="controls">
        {showFilterUI ? (
          <input
            type="search"
            className="rebar-input rebar-nav-index-search"
            data-rebar-part="search"
            data-rebar-size="sm"
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        ) : null}
        {showFilterUI && categories.length > 1 ? (
          <MultiSelect
            aria-label="Filter by category"
            data-rebar-part="category-filter"
            placeholder="All categories"
            values={activeCategories}
            onValuesChange={setActiveCategories}
            options={categories.map((category) => ({
              value: category,
              label: categoryLabels?.[category] ?? category,
            }))}
          />
        ) : null}
        {showFilterUI && statuses.length > 1 ? (
          <MultiSelect
            aria-label="Filter by status"
            data-rebar-part="status-filter"
            placeholder="All statuses"
            values={activeStatuses}
            onValuesChange={setActiveStatuses}
            options={statuses.map((status) => ({
              value: status,
              label: status === UNSTATUSED ? unstatusedLabel : (statusLabels?.[status] ?? status),
            }))}
          />
        ) : null}
      </div>
      <ul className="rebar-nav-index-list" data-rebar-part="overview-list">
        {overviewItems.map((item, i) => (
          <li key={`${item.label}-${i}`} data-rebar-part="overview-item">
            {renderLink({
              href: item.href,
              className: "rebar-nav-index-link rebar-nav-index-link-overview",
              children: item.label,
            })}
          </li>
        ))}
      </ul>
      <ul className="rebar-nav-index-list" data-rebar-part="item-list">
        {filtered.map((item, i) => (
          <li
            key={`${item.label}-${i}`}
            className="rebar-nav-index-item-row"
            data-rebar-part="item"
          >
            {renderLink({
              href: item.href,
              className: "rebar-nav-index-link",
              children: item.label,
            })}
            {item.status ? (
              <Tag tone={item.statusTone ?? "warning"} className="rebar-nav-index-status">
                {item.status}
              </Tag>
            ) : null}
          </li>
        ))}
        {showFilterUI && filtered.length === 0 ? (
          <li className="rebar-nav-index-empty" data-rebar-part="empty">
            No matches.
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
