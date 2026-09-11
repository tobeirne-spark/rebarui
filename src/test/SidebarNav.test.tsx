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
});
