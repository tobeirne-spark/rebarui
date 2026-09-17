import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { Stack } from "./Stack";
import { Box } from "./Box";
import { SidebarNav } from "./SidebarNav";
import { NavBar } from "./NavBar";
import type { SidebarNavProps } from "./SidebarNav";
import type { NavBarProps } from "./NavBar";

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
 * **When to use:**
 * - Dashboard layouts with a sidebar + main content area
 * - Documentation sites with navigation + content
 * - Any full-viewport application where the sidebar/top-nav must extend to the viewport edge
 *
 * **When NOT to use:**
 * - Embedded widgets that don't own the full viewport
 * - Pages that scroll naturally (use a plain `<Stack>` or `<Box>` instead)
 *
 * @example
 * ```tsx
 * <AppShell
 *   sidebar={{
 *     items: [{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }],
 *     header: <Heading level={3}>My App</Heading>,
 *   }}
 * >
 *   <Box style={{ padding: "var(--rebar-space-lg)" }}>
 *     <Heading level={1}>Dashboard</Heading>
 *     <Text>Welcome to the app.</Text>
 *   </Box>
 * </AppShell>
 * ```
 */
export interface AppShellProps extends ComponentPropsWithoutRef<"div"> {
  /** Left sidebar navigation — the traditional dashboard pattern. Pass the same props you'd pass
   * to `<SidebarNav>` directly; this component renders it for you with the correct height
   * inheritance. Mutually exclusive with `topNav` — pick one layout variant, not both. */
  sidebar?: SidebarNavProps;
  /** Top navigation bar — the documentation-site / marketing-page pattern. Pass the same props
   * you'd pass to `<NavBar>` directly. Mutually exclusive with `sidebar`. */
  topNav?: NavBarProps;
  /** The main content area — rendered to the right of the sidebar (or below the top nav). This is
   * your page content: routes, views, whatever the app shell is wrapping. */
  children: ReactNode;
  /** Visual variant — `"sidebar"` (default) for dashboard layouts, `"top-nav"` for
   * documentation/marketing sites. Determines which slot (`sidebar` or `topNav`) is rendered. */
  variant?: "sidebar" | "top-nav";
  /** Override the default full-viewport height — for embedded shells that don't own the entire
   * viewport (though if you're embedding, you probably want a plain `<Stack>` instead). Defaults
   * to `"100vh"`. */
  height?: string;
}

/**
 * A full-viewport application shell that handles CSS height inheritance correctly — the common
 * layout bug where a sidebar doesn't extend to the bottom because its `height: 100%` doesn't
 * resolve without an explicit parent height is impossible here, because this component uses
 * `height: 100vh` (not `minHeight`) on the outer container.
 *
 * Composes `SidebarNav` or `NavBar` with the correct flexbox layout, so consumers don't have to
 * reason about CSS height constraints themselves.
 */
export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  { sidebar, topNav, children, variant = "sidebar", height = "100vh", className, style, ...props },
  ref,
) {
  // Sidebar variant: horizontal row with sidebar on left, content on right
  if (variant === "sidebar" && sidebar) {
    return (
      <Stack
        ref={ref}
        direction="row"
        className={clsx("rebar-app-shell", "rebar-app-shell--sidebar", className)}
        data-rebar-component="app-shell"
        data-rebar-variant="sidebar"
        style={{ height, ...style }}
        {...props}
      >
        <SidebarNav {...sidebar} />
        <Box
          className="rebar-app-shell-content"
          style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
        >
          {children}
        </Box>
      </Stack>
    );
  }

  // Top-nav variant: vertical column with nav on top, content below
  if (variant === "top-nav" && topNav) {
    return (
      <Stack
        ref={ref}
        direction="column"
        className={clsx("rebar-app-shell", "rebar-app-shell--top-nav", className)}
        data-rebar-component="app-shell"
        data-rebar-variant="top-nav"
        style={{ height, ...style }}
        {...props}
      >
        <NavBar {...topNav} />
        <Box
          className="rebar-app-shell-content"
          style={{ flex: 1, minWidth: 0, overflow: "auto" }}
        >
          {children}
        </Box>
      </Stack>
    );
  }

  // Fallback: no sidebar or topNav provided, just render children in a full-height container
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
