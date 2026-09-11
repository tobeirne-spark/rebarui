import { useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";
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
}

export interface SidebarNavProps extends Omit<ComponentPropsWithoutRef<"nav">, "children"> {
  items: SidebarNavItem[];
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
  "aria-label"?: string;
  className?: string;
  /** Force bionic reading on/off for item labels, overriding the ambient data-rebar-bionic
   * setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
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
  "aria-label": ariaLabel = "Main",
  className,
  bionic,
  bionicOptions,
  ...props
}: SidebarNavProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isCollapsedControlled = collapsed !== undefined;
  const currentCollapsed = isCollapsedControlled ? collapsed : internalCollapsed;

  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(
    () => new Set(items.map((item, i) => (item.items && itemContainsActive(item) ? i : -1)).filter((i) => i >= 0)),
  );

  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;
  const renderLabel = (label: string) => renderBionicChildren(label, bionicEnabled, bionicOptions);

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
        {item.icon ? (
          <span className="rebar-sidebar-nav-icon" aria-hidden="true">
            {item.icon}
          </span>
        ) : null}
        {currentCollapsed ? null : <span className="rebar-sidebar-nav-label">{renderLabel(item.label)}</span>}
      </>
    );
    if (!item.href) {
      return (
        <span className="rebar-sidebar-nav-link rebar-sidebar-nav-link-static" title={currentCollapsed ? item.label : undefined}>
          {content}
        </span>
      );
    }
    return (
      <span title={currentCollapsed ? item.label : undefined}>
        {renderLink({
          href: item.href,
          className: clsx("rebar-sidebar-nav-link", item.active && "rebar-sidebar-nav-link-active"),
          children: (
            <span
              className="rebar-sidebar-nav-link-inner"
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
      <ul className="rebar-sidebar-nav-list" data-rebar-part="list">
        {items.map((item, i) => {
          const key = `${item.label}-${i}`;
          const hasChildren = !!item.items && item.items.length > 0;
          const groupExpanded = expandedGroups.has(i);
          return (
            <li key={key} className="rebar-sidebar-nav-item" data-rebar-part="item">
              {hasChildren ? (
                <div className="rebar-sidebar-nav-group">
                  <button
                    type="button"
                    className="rebar-sidebar-nav-link rebar-sidebar-nav-group-toggle"
                    onClick={() => toggleGroup(i)}
                    aria-expanded={groupExpanded}
                    aria-label={currentCollapsed ? item.label : undefined}
                    title={currentCollapsed ? item.label : undefined}
                  >
                    {item.icon ? (
                      <span className="rebar-sidebar-nav-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                    ) : null}
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
                      {item.items!.map((child, j) => (
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
      {hideCollapseToggle ? null : (
        <button
          type="button"
          className="rebar-sidebar-nav-collapse-toggle"
          onClick={toggleCollapsed}
          aria-label={currentCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-rebar-part="collapse-toggle"
        >
          {currentCollapsed ? <ChevronRightIcon aria-hidden="true" /> : <ChevronLeftIcon aria-hidden="true" />}
          {currentCollapsed ? null : <span>Collapse</span>}
        </button>
      )}
    </nav>
  );
}
