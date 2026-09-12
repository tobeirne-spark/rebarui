import { useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "./icons";
import { renderBionicChildren, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface SidebarNavItem {
  label: string;
  /** Omit for a group heading with no link of its own — only meaningful alongside `items` (a
   * parent that's purely a collapsible group, not itself a destination). */
  href?: string;
  icon?: ReactNode;
  /** Marks this as the current page — a real `aria-current="page"` plus its own visual state, not
   * something the caller has to compute by comparing hrefs against a route themselves. */
  active?: boolean;
  /** Nested items, rendered as a collapsible sub-list under this one (one level deep — a second
   * nested `items` inside a child is not rendered, the same "one level is enough for the common
   * case" scope call `MindMap`'s own `children` makes). */
  items?: SidebarNavItem[];
  /** A trailing count/status pill (an unread count, a "new" indicator). Hidden while the sidebar
   * is collapsed — there's no room for it next to a bare icon. */
  badge?: ReactNode;
}

/** A plain, non-interactive section label — visually separates a run of flat items without
 * turning them into a collapsible group (unlike an `items`-bearing `SidebarNavItem`, this has no
 * destination and nothing collapses under it). Hidden while collapsed, the same as any other
 * label text. */
export interface SidebarNavHeading {
  type: "heading";
  label: string;
}

/** A plain visual rule between items — for splitting flat sections (e.g. primary nav vs. utility
 * links) that don't need a label at all. Still renders while collapsed, as a bare rule. */
export interface SidebarNavDivider {
  type: "divider";
}

export type SidebarNavEntry = SidebarNavItem | SidebarNavHeading | SidebarNavDivider;

function isHeadingEntry(entry: SidebarNavEntry): entry is SidebarNavHeading {
  return (entry as SidebarNavHeading).type === "heading";
}

function isDividerEntry(entry: SidebarNavEntry): entry is SidebarNavDivider {
  return (entry as SidebarNavDivider).type === "divider";
}

/** A brand mark that swaps automatically with the collapsed state — `full` (typically a wide
 * wordmark/logo) while expanded, `compact` (typically a square 1:1 icon mark) while collapsed.
 * Native swap-on-collapse support, rather than requiring every consumer to hand-write the same
 * `collapsed ? compact : full` ternary themselves via the generic `header` slot. */
export interface SidebarNavLogo {
  /** Shown while the sidebar is expanded — typically a wide wordmark. */
  full: ReactNode;
  /** Shown while the sidebar is collapsed — typically a square 1:1 icon mark. */
  compact: ReactNode;
}

/** A workspace/account switcher row, rendered as one real styled control (icon/avatar + label +
 * optional description + a trailing switch affordance) rather than a bare slot a consumer has to
 * build from scratch — the ready-made "Saleshouse / general team ⇅" pattern several real dashboard
 * sidebars ship. For anything richer (a dropdown menu of other workspaces), wrap the whole thing:
 * pass `onClick` to open your own `Popover`/`Dropdown` anchored to this row. */
export interface SidebarNavWorkspace {
  label: string;
  description?: string;
  icon?: ReactNode;
  onClick?: () => void;
}

/** Built-in search, filtering `items` by label (recursively into nested children) as the user
 * types — no external filtering wiring required. Pass `true` for the default placeholder, or an
 * object to customize it and/or observe the live query (e.g. to sync it into the URL) without
 * taking over the filtering yourself. Hidden entirely while collapsed (a bare `SearchIcon` glyph
 * renders in its place, non-interactive, matching how labels themselves disappear collapsed) —
 * there's no room to type in a ~64px rail. */
export type SidebarNavSearch = boolean | { placeholder?: string; onSearch?: (query: string) => void };

function itemMatchesQuery(item: SidebarNavItem, query: string): boolean {
  if (item.label.toLowerCase().includes(query)) return true;
  return item.items?.some((child) => itemMatchesQuery(child, query)) ?? false;
}

export interface SidebarNavProps extends Omit<ComponentPropsWithoutRef<"nav">, "children"> {
  items: SidebarNavEntry[];
  /** Renders a link — defaults to a plain `<a href>`. Pass your framework's Link (e.g. Next.js's)
   * for client-side routing, the same convention `NavBar`/`@rebar-ui/placement`'s `renderLink`
   * already use. */
  renderLink?: (props: { href: string; children: ReactNode; className?: string }) => ReactNode;
  /** Collapses to icon-only — labels hidden from view (still in the DOM as a native `title`
   * tooltip and the link's own accessible name), reclaiming horizontal space. A common dashboard
   * pattern; off by default. Omit `onCollapsedChange` for this component to manage its own
   * collapsed state via a real toggle button; pass both to control it externally instead. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Hides the built-in collapse/expand toggle button — for a caller driving `collapsed` from its
   * own UI elsewhere (a header button, a keyboard shortcut) instead. Default `false`. */
  hideCollapseToggle?: boolean;
  /** A brand mark that natively swaps between a wide (`full`) and square (`compact`) asset as the
   * sidebar collapses — see `SidebarNavLogo`. Rendered above `header`, in its own bordered row. Use
   * this instead of hand-rolling the same swap inside `header`'s function form. */
  logo?: SidebarNavLogo;
  /** Rendered above the item list, below `logo` — a workspace switcher, a tagline, a profile
   * block, whatever else a given app-shell needs there. A plain slot, not a prescribed
   * sub-component, matching this component's own headless-first convention. Pass a function to
   * render something different once collapsed. */
  header?: ReactNode | ((ctx: { collapsed: boolean }) => ReactNode);
  /** Rendered between the item list and `footer` — a promo/CTA card, a storage/quota widget,
   * anything that isn't itself navigation. Same slot convention as `header`. */
  panel?: ReactNode | ((ctx: { collapsed: boolean }) => ReactNode);
  /** Rendered at the bottom, below `panel` and above the collapse toggle — an account row, a
   * profile summary, a logout button. Same slot convention as `header`. */
  footer?: ReactNode | ((ctx: { collapsed: boolean }) => ReactNode);
  /** `"list"` (default) is one item per row. `"grid"` renders a 2-column grid of icon-over-label
   * tiles instead — the dashboard-tile pattern, distinct from a plain vertical list. Forced back
   * to a single icon-only column while collapsed, regardless of this setting — a 2-column grid of
   * bare icons in a ~64px rail has no room to be useful. */
  variant?: "list" | "grid";
  /** `"inline"` (default) places the icon beside the label. `"below"` stacks the icon above a
   * small label underneath it — a third density tier between a full label and icon-only,
   * commonly used at a narrower "tablet" sidebar width. Ignored (treated as `"below"`) when
   * `variant="grid"`, since a grid tile's own shape already stacks icon over label. */
  labelPlacement?: "inline" | "below";
  /** A ready-made workspace/account switcher row, rendered just below `header`. See
   * `SidebarNavWorkspace`. */
  workspace?: SidebarNavWorkspace;
  /** Built-in, self-filtering search over `items`. See `SidebarNavSearch`. */
  search?: SidebarNavSearch;
  /** How the active item is marked. `"tint"` (default) is a soft background wash plus colored
   * text — the lowest-contrast option. `"bar"` adds a solid accent bar on the leading edge on top
   * of the tint. `"fill"` is a solid, fully-filled background with inverted text — the boldest,
   * highest-contrast option. All three are real shipped CSS, not a "bring your own override"
   * escape hatch — pick per app, don't reimplement. */
  activeStyle?: "tint" | "bar" | "fill";
  /** Where the collapse/expand toggle renders. `"inline"` (default) is a full-width button below
   * the item list, in the document flow. `"edge"` anchors a small circular button to the
   * sidebar's own right border, vertically centered — the floating-chevron pattern some dashboard
   * sidebars use instead of an inline row. */
  collapseTogglePlacement?: "inline" | "edge";
  "aria-label"?: string;
  className?: string;
  /** Force bionic reading on/off for item labels, overriding the ambient data-rebar-bionic
   * setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

/** A collapsed rail with no icon renders a totally blank row — indistinguishable from a broken or
 * unstyled control, easy to mistake for a missing dependency. Falls back to the label's own first
 * letter (the same "monogram" convention `Avatar` already uses for a missing image) whenever the
 * sidebar is collapsed and no real icon was given; renders nothing extra while expanded, since a
 * missing icon there is just a label-only row, not a blank one. */
function renderIconSlot(icon: ReactNode | undefined, label: string, collapsed: boolean) {
  if (icon) {
    return (
      <span className="rebar-sidebar-nav-icon" aria-hidden="true">
        {icon}
      </span>
    );
  }
  if (!collapsed) return null;
  return (
    <span className="rebar-sidebar-nav-icon rebar-sidebar-nav-icon-fallback" aria-hidden="true">
      {label.trim().charAt(0).toUpperCase()}
    </span>
  );
}

function resolveSlot(
  slot: ReactNode | ((ctx: { collapsed: boolean }) => ReactNode) | undefined,
  collapsed: boolean,
): ReactNode {
  return typeof slot === "function" ? slot({ collapsed }) : slot;
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

function itemContainsActive(item: SidebarNavItem): boolean {
  if (item.active) return true;
  return item.items?.some(itemContainsActive) ?? false;
}

/**
 * A traditional vertical left-hand navigation — the Bootstrap-dashboard-style pattern, a real
 * alternative shape to `NavBar`'s horizontal-with-overflow one, for admin/dashboard-shaped apps
 * where the nav genuinely lives down the side rather than across the top. Distinct concerns from
 * `NavBar`: no measure-and-collapse-into-a-popover mechanics (a vertical list doesn't run out of
 * horizontal room the way a horizontal row does), but real support for one level of nested/grouped
 * items and an icon-only collapsed mode, neither of which `NavBar`'s own horizontal shape needs.
 */
export function SidebarNav({
  items,
  renderLink = defaultRenderLink,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  hideCollapseToggle = false,
  logo,
  header,
  panel,
  footer,
  variant = "list",
  labelPlacement = "inline",
  workspace,
  search,
  activeStyle = "tint",
  collapseTogglePlacement = "inline",
  "aria-label": ariaLabel = "Main",
  className,
  bionic,
  bionicOptions,
  ...props
}: SidebarNavProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isCollapsedControlled = collapsed !== undefined;
  const currentCollapsed = isCollapsedControlled ? collapsed : internalCollapsed;

  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    items.forEach((entry, i) => {
      if (!isHeadingEntry(entry) && !isDividerEntry(entry) && entry.items && itemContainsActive(entry)) {
        initial.add(i);
      }
    });
    return initial;
  });

  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;
  const renderLabel = (label: string) => renderBionicChildren(label, bionicEnabled, bionicOptions);

  // A 2-column icon-tile grid always stacks icon over label, the same shape `labelPlacement="below"`
  // produces for a plain list — the two share one layout treatment rather than two.
  const stacked = variant === "grid" || labelPlacement === "below";

  const searchEnabled = !!search;
  const searchOptions = typeof search === "object" ? search : undefined;
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    searchOptions?.onSearch?.(value);
  };

  const toggleCollapsed = () => {
    const next = !currentCollapsed;
    if (!isCollapsedControlled) setInternalCollapsed(next);
    onCollapsedChange?.(next);
  };

  const toggleGroup = (index: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const renderItem = (item: SidebarNavItem, key: string) => {
    const content = (
      <>
        {renderIconSlot(item.icon, item.label, currentCollapsed)}
        {currentCollapsed ? null : <span className="rebar-sidebar-nav-label">{renderLabel(item.label)}</span>}
        {item.badge != null && !currentCollapsed ? (
          <span className="rebar-sidebar-nav-badge" data-rebar-part="badge">
            {item.badge}
          </span>
        ) : null}
      </>
    );
    const linkClassName = clsx("rebar-sidebar-nav-link", stacked && !currentCollapsed && "rebar-sidebar-nav-link-stacked");
    if (!item.href) {
      return (
        <span
          className={clsx(linkClassName, "rebar-sidebar-nav-link-static")}
          title={currentCollapsed ? item.label : undefined}
        >
          {content}
        </span>
      );
    }
    return (
      <span title={currentCollapsed ? item.label : undefined}>
        {renderLink({
          href: item.href,
          className: clsx(
            linkClassName,
            item.active && clsx("rebar-sidebar-nav-link-active", `rebar-sidebar-nav-active-${activeStyle}`),
          ),
          children: (
            <span
              className={clsx("rebar-sidebar-nav-link-inner", stacked && !currentCollapsed && "rebar-sidebar-nav-link-stacked")}
              aria-label={currentCollapsed ? item.label : undefined}
              {...(item.active ? { "aria-current": "page" as const } : {})}
            >
              {content}
            </span>
          ),
        })}
      </span>
    );
  };

  return (
    <nav
      {...props}
      aria-label={ariaLabel}
      className={clsx("rebar-sidebar-nav", className)}
      data-rebar-component="sidebar-nav"
      data-rebar-collapsed={currentCollapsed || undefined}
    >
      {logo ? (
        <div className="rebar-sidebar-nav-logo" data-rebar-part="logo">
          {currentCollapsed ? logo.compact : logo.full}
        </div>
      ) : null}
      {header !== undefined ? (
        <div className="rebar-sidebar-nav-header" data-rebar-part="header">
          {resolveSlot(header, currentCollapsed)}
        </div>
      ) : null}
      {workspace ? (
        <button
          type="button"
          className="rebar-sidebar-nav-workspace"
          data-rebar-part="workspace"
          onClick={workspace.onClick}
          title={currentCollapsed ? workspace.label : undefined}
        >
          {workspace.icon ? (
            <span className="rebar-sidebar-nav-workspace-icon" aria-hidden="true">
              {workspace.icon}
            </span>
          ) : null}
          {currentCollapsed ? null : (
            <>
              <span className="rebar-sidebar-nav-workspace-text">
                <span className="rebar-sidebar-nav-workspace-label">{renderLabel(workspace.label)}</span>
                {workspace.description ? (
                  <span className="rebar-sidebar-nav-workspace-description">{renderLabel(workspace.description)}</span>
                ) : null}
              </span>
              <span className="rebar-sidebar-nav-workspace-switch" aria-hidden="true">
                <ChevronDownIcon className="rebar-sidebar-nav-workspace-switch-up" />
                <ChevronDownIcon className="rebar-sidebar-nav-workspace-switch-down" />
              </span>
            </>
          )}
        </button>
      ) : null}
      {searchEnabled ? (
        currentCollapsed ? (
          <span className="rebar-sidebar-nav-search rebar-sidebar-nav-search-collapsed" data-rebar-part="search" aria-hidden="true">
            <SearchIcon />
          </span>
        ) : (
          <span className="rebar-sidebar-nav-search" data-rebar-part="search">
            <SearchIcon aria-hidden="true" />
            <input
              type="search"
              className="rebar-sidebar-nav-search-input"
              placeholder={searchOptions?.placeholder ?? "Search"}
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              aria-label={searchOptions?.placeholder ?? "Search"}
            />
          </span>
        )
      ) : null}
      <ul
        className={clsx("rebar-sidebar-nav-list", variant === "grid" && !currentCollapsed && "rebar-sidebar-nav-list-grid")}
        data-rebar-part="list"
      >
        {items.map((entry, i) => {
          if (isDividerEntry(entry)) {
            return <li key={`divider-${i}`} className="rebar-sidebar-nav-divider" role="separator" data-rebar-part="divider" />;
          }
          if (isHeadingEntry(entry)) {
            return currentCollapsed ? null : (
              <li key={`heading-${i}`} className="rebar-sidebar-nav-heading" data-rebar-part="heading">
                {renderLabel(entry.label)}
              </li>
            );
          }
          const item = entry;
          if (normalizedQuery && !itemMatchesQuery(item, normalizedQuery)) return null;
          const key = `${item.label}-${i}`;
          const hasChildren = !!item.items && item.items.length > 0;
          const groupExpanded = expandedGroups.has(i) || (!!normalizedQuery && hasChildren);
          const visibleChildren =
            normalizedQuery && item.label.toLowerCase().includes(normalizedQuery)
              ? item.items
              : item.items?.filter((child) => !normalizedQuery || itemMatchesQuery(child, normalizedQuery));
          return (
            <li key={key} className="rebar-sidebar-nav-item" data-rebar-part="item">
              {hasChildren ? (
                <div className="rebar-sidebar-nav-group">
                  <button
                    type="button"
                    className={clsx(
                      "rebar-sidebar-nav-link",
                      "rebar-sidebar-nav-group-toggle",
                      stacked && !currentCollapsed && "rebar-sidebar-nav-link-stacked",
                    )}
                    onClick={() => toggleGroup(i)}
                    aria-expanded={groupExpanded}
                    aria-label={currentCollapsed ? item.label : undefined}
                    title={currentCollapsed ? item.label : undefined}
                  >
                    {renderIconSlot(item.icon, item.label, currentCollapsed)}
                    {currentCollapsed ? null : (
                      <>
                        <span className="rebar-sidebar-nav-label">{renderLabel(item.label)}</span>
                        <ChevronDownIcon
                          className={clsx("rebar-sidebar-nav-chevron", groupExpanded && "rebar-sidebar-nav-chevron-open")}
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </button>
                  {groupExpanded && !currentCollapsed ? (
                    <ul className="rebar-sidebar-nav-sublist" data-rebar-part="sublist">
                      {(visibleChildren ?? []).map((child, j) => (
                        <li key={`${key}-${child.label}-${j}`} className="rebar-sidebar-nav-subitem" data-rebar-part="subitem">
                          {renderItem(child, `${key}-${j}`)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : (
                renderItem(item, key)
              )}
            </li>
          );
        })}
      </ul>
      {panel !== undefined ? (
        <div className="rebar-sidebar-nav-panel" data-rebar-part="panel">
          {resolveSlot(panel, currentCollapsed)}
        </div>
      ) : null}
      {footer !== undefined ? (
        <div className="rebar-sidebar-nav-footer" data-rebar-part="footer">
          {resolveSlot(footer, currentCollapsed)}
        </div>
      ) : null}
      {hideCollapseToggle ? null : (
        <button
          type="button"
          className={clsx(
            "rebar-sidebar-nav-collapse-toggle",
            collapseTogglePlacement === "edge" && "rebar-sidebar-nav-collapse-toggle-edge",
          )}
          onClick={toggleCollapsed}
          aria-label={currentCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-rebar-part="collapse-toggle"
        >
          {currentCollapsed ? <ChevronRightIcon aria-hidden="true" /> : <ChevronLeftIcon aria-hidden="true" />}
          {currentCollapsed || collapseTogglePlacement === "edge" ? null : <span>Collapse</span>}
        </button>
      )}
    </nav>
  );
}
