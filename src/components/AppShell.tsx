import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { Stack } from "./Stack";
import { Box } from "./Box";
import { SidebarNav } from "./SidebarNav";
import { NavBar } from "./NavBar";
import { MobileTabBar } from "./MobileTabBar";
import { SidePanel } from "./SidePanel";
import type { SidebarNavProps } from "./SidebarNav";
import type { NavBarProps } from "./NavBar";
import type { MobileTabBarProps } from "./MobileTabBar";
import type { SidePanelProps } from "./SidePanel";

/**
 * A full-viewport application shell that handles the common dashboard/docs-site layout pattern
 * correctly — the class of bug where a sidebar doesn't extend to the bottom of the viewport because
 * CSS percentage-based heights don't resolve without an explicit parent height.
 *
 * **Why this exists:** CSS `height: 100%` on a child only works when the parent has an explicit
 * `height` (not just `minHeight`). This component encapsulates that constraint so consumers don't
 * have to reason about it themselves. The outer container uses `height: 100vh` (not `minHeight`),
 * ensuring all children with `height: 100%` resolve correctly.
 *
 * **Seven variants**, each composing the real components you'd otherwise wire up by hand:
 * - `"sidebar"` (default) — `SidebarNav` (left) + content. The traditional dashboard pattern.
 * - `"top-nav"` — `NavBar` (top) + content. The docs-site/marketing pattern.
 * - `"top-nav-sidebar"` — `NavBar` (top), with `SidebarNav` (left) + content below it — a global
 *   bar for search/account plus a section sidebar, the GitHub/Linear-style complex-dashboard shape
 *   `"sidebar"` and `"top-nav"` can't represent alone since they're each only one nav element.
 * - `"three-pane"` — a forced-collapsed icon-only `railSidebar` (a workspace switcher) + a normal
 *   `sidebar` (a channel/item list) + content — the Slack/Discord/VS Code shape.
 * - `"mobile"` — an optional top bar + content + `MobileTabBar` pinned to the bottom.
 * - `"tablet"` — the same layout as `"sidebar"`, with `sidebar` defaulting to
 *   `defaultCollapsed: true` (an icon-only rail that expands on demand — Material Design's
 *   "navigation rail" pattern) unless the caller's own `sidebar` prop already sets it.
 * - `rightPanel` — not a `variant` value, since a right-docked detail panel (the Slack "thread"
 *   pattern — see `SidePanel`) is commonly combined *with* any of the above, not a replacement for
 *   one. Pass it alongside any variant to add it.
 *
 * **When NOT to use:** embedded widgets that don't own the full viewport, or pages that scroll
 * naturally (use a plain `<Stack>` or `<Box>` instead).
 */
export interface AppShellProps extends ComponentPropsWithoutRef<"div"> {
  /** Left sidebar navigation — the traditional dashboard pattern (`variant="sidebar"`/`"tablet"`),
   * or the secondary item-list pane in `variant="three-pane"`. Pass the same props you'd pass to
   * `<SidebarNav>` directly; this component renders it for you with the correct height
   * inheritance. */
  sidebar?: SidebarNavProps;
  /** Top navigation bar (`variant="top-nav"`/`"top-nav-sidebar"`), or an optional top bar above
   * `variant="mobile"`'s content. Pass the same props you'd pass to `<NavBar>` directly. */
  topNav?: NavBarProps;
  /** The forced-collapsed icon-only rail in `variant="three-pane"` (a workspace/app switcher) —
   * `collapsed`/`hideCollapseToggle` are always forced `true` regardless of what's passed here,
   * since a rail that could expand would just be a second `sidebar`. */
  railSidebar?: SidebarNavProps;
  /** The bottom tab bar in `variant="mobile"`. Required for that variant — see `MobileTabBar`. */
  tabBar?: MobileTabBarProps;
  /** A right-docked, non-modal detail panel (see `SidePanel` — the Slack "thread" pattern: beside
   * the content, not over it) — combinable with any `variant`, not a variant of its own. Omitted
   * on `variant="mobile"`, where there's no room for a persistent side panel. */
  rightPanel?: SidePanelProps;
  /** The main content area. This is your page content: routes, views, whatever the app shell is
   * wrapping. */
  children: ReactNode;
  /** Visual variant — see the component doc comment above for what each one composes. Defaults to
   * `"sidebar"`. */
  variant?: "sidebar" | "top-nav" | "top-nav-sidebar" | "three-pane" | "mobile" | "tablet";
  /** Override the default full-viewport height — for embedded shells that don't own the entire
   * viewport (though if you're embedding, you probably want a plain `<Stack>` instead). Defaults
   * to `"100vh"`. */
  height?: string;
}

export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  {
    sidebar,
    topNav,
    railSidebar,
    tabBar,
    rightPanel,
    children,
    variant = "sidebar",
    height = "100vh",
    className,
    style,
    ...props
  },
  ref,
) {
  const rootProps = {
    ref,
    className: clsx("rebar-app-shell", `rebar-app-shell--${variant}`, className),
    "data-rebar-component": "app-shell",
    "data-rebar-variant": variant,
    style: { height, ...style },
    ...props,
  };

  // Sidebar / Tablet variants: horizontal row, sidebar on the left — tablet is the same shape
  // with the icon-rail collapsed state defaulted on, not a structurally different layout.
  if ((variant === "sidebar" || variant === "tablet") && sidebar) {
    const effectiveSidebar = variant === "tablet" ? { defaultCollapsed: true, ...sidebar } : sidebar;
    return (
      <Stack direction="row" {...rootProps}>
        <SidebarNav {...effectiveSidebar} />
        <Box
          className="rebar-app-shell-content"
          style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
        >
          {children}
        </Box>
        {rightPanel ? <SidePanel {...rightPanel} /> : null}
      </Stack>
    );
  }

  // Top-nav variant: vertical column, nav on top, content below.
  if (variant === "top-nav" && topNav) {
    const content = rightPanel ? (
      <Stack direction="row" style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <Box className="rebar-app-shell-content" style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
          {children}
        </Box>
        <SidePanel {...rightPanel} />
      </Stack>
    ) : (
      <Box className="rebar-app-shell-content" style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
        {children}
      </Box>
    );
    return (
      <Stack direction="column" {...rootProps}>
        <NavBar {...topNav} />
        {content}
      </Stack>
    );
  }

  // Top-nav-sidebar variant: nav spans the full width on top; a sidebar + content row fills the
  // rest — the GitHub/Linear complex-dashboard shape neither of the other two nav slots alone can
  // represent.
  if (variant === "top-nav-sidebar" && topNav && sidebar) {
    return (
      <Stack direction="column" {...rootProps}>
        <NavBar {...topNav} />
        <Stack direction="row" style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <SidebarNav {...sidebar} />
          <Box className="rebar-app-shell-content" style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
            {children}
          </Box>
          {rightPanel ? <SidePanel {...rightPanel} /> : null}
        </Stack>
      </Stack>
    );
  }

  // Three-pane variant: a forced-collapsed icon rail, a normal (list) sidebar, then content — the
  // Slack/Discord/VS Code shape.
  if (variant === "three-pane" && railSidebar && sidebar) {
    return (
      <Stack direction="row" {...rootProps}>
        <SidebarNav {...railSidebar} collapsed hideCollapseToggle />
        <SidebarNav {...sidebar} />
        <Box
          className="rebar-app-shell-content"
          style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
        >
          {children}
        </Box>
        {rightPanel ? <SidePanel {...rightPanel} /> : null}
      </Stack>
    );
  }

  // Mobile variant: an optional top bar, scrollable content, a real MobileTabBar pinned to the
  // bottom — no rightPanel slot here, there's no room for a persistent side panel at this width.
  // `MobileTabBar` is real `position: fixed` (correct for its normal standalone use, anchoring to
  // the actual app viewport) — composed inside a constrained-height `AppShell` instead, that would
  // anchor to the real browser viewport and ignore this component's own bounds entirely. `transform`
  // on this root gives every `position: fixed` descendant a new containing block (a standard CSS
  // technique), making it track *this* box instead, with zero change to `MobileTabBar` itself.
  if (variant === "mobile" && tabBar) {
    return (
      <Stack direction="column" {...rootProps} style={{ ...rootProps.style, transform: "translateZ(0)" }}>
        {topNav ? <NavBar {...topNav} /> : null}
        <Box className="rebar-app-shell-content" style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
          {children}
        </Box>
        <MobileTabBar {...tabBar} />
      </Stack>
    );
  }

  // Fallback: no variant-matching props provided, just render children in a full-height container.
  return (
    <Box
      ref={ref}
      className={clsx("rebar-app-shell", "rebar-app-shell--bare", className)}
      data-rebar-component="app-shell"
      data-rebar-variant="bare"
      style={{ height, ...style }}
      {...props}
    >
      {children}
    </Box>
  );
});
