import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarNav } from "../components/SidebarNav";
import type { SidebarNavItem } from "../components/SidebarNav";

afterEach(cleanup);

const ITEMS: SidebarNavItem[] = [
  { label: "Dashboard", href: "/dashboard", active: true },
  { label: "Projects", href: "/projects" },
  {
    label: "Settings",
    items: [
      { label: "Profile", href: "/settings/profile" },
      { label: "Billing", href: "/settings/billing" },
    ],
  },
];

describe("SidebarNav", () => {
  it("renders every top-level item as a real link, marking the active one", () => {
    render(<SidebarNav items={ITEMS} />);
    const dashboard = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboard).toHaveAttribute("href", "/dashboard");
    expect(dashboard.querySelector('[aria-current="page"]')).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Projects" })).not.toHaveAttribute("aria-current");
  });

  it("a group with items renders as a toggle button, not a link, with children initially collapsed", () => {
    render(<SidebarNav items={ITEMS} />);
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
  });

  it("clicking a group toggle expands its children", async () => {
    const user = userEvent.setup();
    render(<SidebarNav items={ITEMS} />);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/settings/profile");
    expect(screen.getByRole("link", { name: "Billing" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
  });

  it("a group containing the active item starts expanded", () => {
    const itemsWithActiveChild: SidebarNavItem[] = [
      {
        label: "Settings",
        items: [
          { label: "Profile", href: "/settings/profile", active: true },
          { label: "Billing", href: "/settings/billing" },
        ],
      },
    ];
    render(<SidebarNav items={itemsWithActiveChild} />);
    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
  });

  it("supports a custom renderLink for client-side routing", () => {
    const renderLink = vi.fn(({ href, children }: { href: string; children: ReactNode }) => (
      <a href={href} data-testid="custom-link">
        {children}
      </a>
    ));
    render(<SidebarNav items={[{ label: "Dashboard", href: "/dashboard" }]} renderLink={renderLink} />);
    expect(screen.getByTestId("custom-link")).toHaveAttribute("href", "/dashboard");
  });

  it("collapsed mode hides visible labels but keeps a real accessible name", () => {
    const { container } = render(<SidebarNav items={ITEMS} collapsed />);
    expect(container.querySelector('[data-rebar-collapsed]')).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    // Still findable by its accessible name (an aria-label on the collapsed link), not just
    // present with empty/no name.
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  it("the built-in collapse toggle works uncontrolled", async () => {
    const user = userEvent.setup();
    const { container } = render(<SidebarNav items={ITEMS} />);
    expect(container.querySelector("[data-rebar-collapsed]")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(container.querySelector("[data-rebar-collapsed]")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(container.querySelector("[data-rebar-collapsed]")).not.toBeInTheDocument();
  });

  it("is controlled when both collapsed and onCollapsedChange are passed", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const { container } = render(<SidebarNav items={ITEMS} collapsed={false} onCollapsedChange={onCollapsedChange} />);
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    // Caller never fed the new value back in — stays expanded.
    expect(container.querySelector("[data-rebar-collapsed]")).not.toBeInTheDocument();
  });

  it("hideCollapseToggle omits the built-in toggle button", () => {
    render(<SidebarNav items={ITEMS} hideCollapseToggle />);
    expect(screen.queryByRole("button", { name: "Collapse sidebar" })).not.toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<SidebarNav items={ITEMS} />);
    expect(container.querySelector('[data-rebar-component="sidebar-nav"]')).toBeInTheDocument();
  });

  it("renders header, panel, and footer slots, each resolving a collapsed-aware function form", () => {
    const { container, rerender } = render(
      <SidebarNav
        items={ITEMS}
        header={({ collapsed }) => (collapsed ? "H-collapsed" : "H-expanded")}
        panel="A promo panel"
        footer="A footer row"
      />,
    );
    expect(screen.getByText("H-expanded")).toBeInTheDocument();
    expect(screen.getByText("A promo panel")).toBeInTheDocument();
    expect(screen.getByText("A footer row")).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-part="header"]')).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-part="panel"]')).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-part="footer"]')).toBeInTheDocument();

    rerender(
      <SidebarNav
        items={ITEMS}
        collapsed
        header={({ collapsed }) => (collapsed ? "H-collapsed" : "H-expanded")}
      />,
    );
    expect(screen.getByText("H-collapsed")).toBeInTheDocument();
  });

  it("renders a heading and a divider entry, hiding the heading (not the divider) while collapsed", () => {
    const entries = [
      { type: "heading" as const, label: "Shortcuts" },
      { label: "Tasks", href: "/tasks" },
      { type: "divider" as const },
      { label: "Reports", href: "/reports" },
    ];
    const { container, rerender } = render(<SidebarNav items={entries} />);
    expect(screen.getByText("Shortcuts")).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-part="divider"]')).toBeInTheDocument();

    rerender(<SidebarNav items={entries} collapsed />);
    expect(screen.queryByText("Shortcuts")).not.toBeInTheDocument();
    expect(container.querySelector('[data-rebar-part="divider"]')).toBeInTheDocument();
  });

  it("renders a badge on an item, hidden while collapsed", () => {
    const entries = [{ label: "Chat", href: "/chat", badge: "5" }];
    const { container, rerender } = render(<SidebarNav items={entries} />);
    expect(container.querySelector('[data-rebar-part="badge"]')).toHaveTextContent("5");

    rerender(<SidebarNav items={entries} collapsed />);
    expect(container.querySelector('[data-rebar-part="badge"]')).not.toBeInTheDocument();
  });

  it("variant=\"grid\" renders a 2-column tile grid, falling back to a single column while collapsed", () => {
    const { container, rerender } = render(<SidebarNav items={ITEMS.slice(0, 2)} variant="grid" />);
    expect(container.querySelector(".rebar-sidebar-nav-list-grid")).toBeInTheDocument();

    rerender(<SidebarNav items={ITEMS.slice(0, 2)} variant="grid" collapsed />);
    expect(container.querySelector(".rebar-sidebar-nav-list-grid")).not.toBeInTheDocument();
  });

  it("logo swaps between full and compact automatically with the collapsed state", () => {
    const { rerender } = render(
      <SidebarNav
        items={ITEMS}
        logo={{ full: <span>Wide Wordmark</span>, compact: <span>Square Mark</span> }}
      />,
    );
    expect(screen.getByText("Wide Wordmark")).toBeInTheDocument();
    expect(screen.queryByText("Square Mark")).not.toBeInTheDocument();

    rerender(
      <SidebarNav
        items={ITEMS}
        collapsed
        logo={{ full: <span>Wide Wordmark</span>, compact: <span>Square Mark</span> }}
      />,
    );
    expect(screen.getByText("Square Mark")).toBeInTheDocument();
    expect(screen.queryByText("Wide Wordmark")).not.toBeInTheDocument();
  });

  it("a workspace switcher renders label, description, and responds to click", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <SidebarNav
        items={ITEMS}
        workspace={{ label: "Saleshouse", description: "general team", onClick }}
      />,
    );
    const button = screen.getByRole("button", { name: /Saleshouse/ });
    expect(screen.getByText("general team")).toBeInTheDocument();
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("built-in search filters items (and matching nested children) by label as the user types", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SidebarNav items={ITEMS} search={{ onSearch }} />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Projects" })).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "dash");
    expect(onSearch).toHaveBeenLastCalledWith("dash");
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Projects" })).not.toBeInTheDocument();
  });

  it("search auto-expands a group whose child matches, and hides one whose subtree doesn't", async () => {
    const user = userEvent.setup();
    render(<SidebarNav items={ITEMS} search />);
    await user.type(screen.getByRole("searchbox"), "billing");
    expect(screen.getByRole("link", { name: "Billing" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("search collapses to a bare icon while the sidebar is collapsed", () => {
    const { container } = render(<SidebarNav items={ITEMS} search collapsed />);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(container.querySelector('[data-rebar-part="search"]')).toBeInTheDocument();
  });

  it("collapsed with no icon falls back to the label's first letter, rather than a blank row", () => {
    const { container, rerender } = render(<SidebarNav items={[{ label: "Chat", href: "#chat" }]} />);
    expect(container.querySelector(".rebar-sidebar-nav-icon-fallback")).not.toBeInTheDocument();

    rerender(<SidebarNav items={[{ label: "Chat", href: "#chat" }]} collapsed />);
    const fallback = container.querySelector(".rebar-sidebar-nav-icon-fallback");
    expect(fallback).toHaveTextContent("C");
  });

  it("collapsed with a real icon never shows the fallback letter", () => {
    const { container } = render(
      <SidebarNav items={[{ label: "Chat", href: "#chat", icon: <span data-testid="real-icon" /> }]} collapsed />,
    );
    expect(container.querySelector(".rebar-sidebar-nav-icon-fallback")).not.toBeInTheDocument();
    expect(screen.getByTestId("real-icon")).toBeInTheDocument();
  });

  it("activeStyle applies the matching modifier class to the active item", () => {
    const { container, rerender } = render(<SidebarNav items={ITEMS} activeStyle="bar" />);
    expect(container.querySelector(".rebar-sidebar-nav-active-bar")).toBeInTheDocument();

    rerender(<SidebarNav items={ITEMS} activeStyle="fill" />);
    expect(container.querySelector(".rebar-sidebar-nav-active-fill")).toBeInTheDocument();
  });

  it("collapseTogglePlacement=\"edge\" applies the edge modifier class", () => {
    const { container } = render(<SidebarNav items={ITEMS} collapseTogglePlacement="edge" />);
    expect(container.querySelector(".rebar-sidebar-nav-collapse-toggle-edge")).toBeInTheDocument();
  });
});
