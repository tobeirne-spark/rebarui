import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from "react";
import { Fragment, useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";

export interface ConstructSearchResult {
  /** Display name, e.g. "Kanban" or "Goal Tracker". */
  name: string;
  /** Optional grouping label rendered above its own run of results, e.g. a tier ("Opinions"). */
  group?: string;
  href: string;
}

export interface ConstructSearchProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "results"> {
  results: ConstructSearchResult[];
  /** Renders a link — defaults to a plain `<a href>`. Pass your framework's Link (e.g. Next.js's)
   * for client-side routing, same convention as `NavBar`/`@rebar-ui/placement`'s `renderLink`. */
  renderLink?: (props: { href: string; children: ReactNode; className?: string; onClick?: () => void }) => ReactNode;
  placeholder?: string;
  /** Caps how many results render per keystroke, applied to the filtered set before grouping.
   * Defaults to 8 — a nav-bar dropdown, not a full results page. */
  maxResults?: number;
  "aria-label"?: string;
}

const defaultRenderLink = ({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <a href={href} className={className} onClick={onClick}>
    {children}
  </a>
);

interface FlatEntry {
  result: ConstructSearchResult;
  /** Stable position across every group, in render order — what keyboard nav and
   * aria-activedescendant actually index into (not the raw, ungrouped `filtered` order). */
  index: number;
}

/**
 * A progressive, type-ahead search over every named construct (component or block) across every
 * tier/library — meant to sit inline in a `site-header`, not behind a forced-open modal like
 * `CommandPalette`. Results are real navigable links (via `renderLink`), not `onSelect` callbacks,
 * since picking one means going to that construct's reference page, not running an action.
 *
 * Filtering reuses `Combobox`/`CommandPalette`'s exact substring/case-insensitive matching (trim,
 * lowercase, `includes`) for consistency — see ref/HEURISTICS.md #4 (consistency and standards).
 * The dropdown only opens once the query is non-empty; this is a search box, not a full browsable
 * index of every construct (that's what each tier's own sidebar is for).
 */
export function ConstructSearch({
  results,
  renderLink = defaultRenderLink,
  placeholder = "Search constructs...",
  maxResults = 8,
  className,
  "aria-label": ariaLabel = "Search constructs",
  ...rest
}: ConstructSearchProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return results.filter((r) => r.name.toLowerCase().includes(q)).slice(0, maxResults);
  }, [results, query, maxResults]);

  // Group by `group`, preserving first-appearance order of each group and original relative order
  // within a group; each result gets a stable flat index across group boundaries — same shape as
  // CommandPalette's own grouping.
  const groups = useMemo(() => {
    const map = new Map<string | undefined, FlatEntry[]>();
    let index = 0;
    for (const result of filtered) {
      const key = result.group;
      const bucket = map.get(key) ?? [];
      bucket.push({ result, index: index++ });
      map.set(key, bucket);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const flatItems = useMemo(() => groups.flatMap(([, entries]) => entries), [groups]);

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleChange = (value: string) => {
    setQuery(value);
    setOpen(value.trim().length > 0);
    setActiveIndex(-1);
  };

  const handleSelect = () => {
    setQuery("");
    close();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || flatItems.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % flatItems.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
    } else if (event.key === "Enter") {
      if (activeIndex >= 0) {
        event.preventDefault();
        optionRefs.current[activeIndex]?.querySelector<HTMLElement>("a,button")?.click();
      }
    } else if (event.key === "Escape") {
      close();
      inputRef.current?.blur();
    }
  };

  return (
    <div
      {...rest}
      className={clsx("rebar-construct-search", className)}
      data-rebar-component="construct-search"
    >
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        className="rebar-construct-search-input"
        data-rebar-part="input"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(query.trim().length > 0)}
        // A plain blur would close the dropdown before a mouse click on a result inside it
        // registers — every option below cancels its own mousedown so this blur only fires for a
        // click genuinely outside the component (same trick Combobox.tsx's list uses).
        onBlur={close}
        onKeyDown={handleKeyDown}
      />
      {open && (filtered.length > 0 || query.trim().length > 0) ? (
        <ul id={listId} role="listbox" className="rebar-construct-search-list" data-rebar-part="list">
          {flatItems.length === 0 ? (
            <li role="presentation" className="rebar-construct-search-empty" data-rebar-part="empty">
              No matching constructs
            </li>
          ) : (
            groups.map(([group, entries]) => (
              <Fragment key={group ?? "__ungrouped"}>
                {group ? (
                  <li role="presentation">
                    <div className="rebar-construct-search-group-label" data-rebar-part="group-label">
                      {group}
                    </div>
                  </li>
                ) : null}
                {entries.map(({ result, index }) => (
                  <li
                    key={`${result.href}-${index}`}
                    id={`${listId}-${index}`}
                    ref={(el) => {
                      optionRefs.current[index] = el;
                    }}
                    role="option"
                    aria-selected={index === activeIndex}
                    className="rebar-construct-search-option"
                    data-rebar-part="option"
                    data-rebar-active={index === activeIndex || undefined}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {renderLink({
                      href: result.href,
                      children: result.name,
                      className: "rebar-construct-search-option-link",
                      onClick: handleSelect,
                    })}
                  </li>
                ))}
              </Fragment>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
