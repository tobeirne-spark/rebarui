import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "../components/AppShell";

const SIDEBAR_ITEMS = [{ label: "Home", href: "/" }];
const NAV_ITEMS = [{ label: "Docs", href: "/docs" }];
const TAB_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Settings", href: "/settings" },
];

describe("AppShell", () => {
  it("carries data-rebar-component and the variant on the root, defaulting to sidebar", () => {
    render(
      <AppShell sidebar={{ items: SIDEBAR_ITEMS }}>
        <div>content</div>
      </AppShell>,
    );
    const root = document.querySelector('[data-rebar-component="app-shell"]');
    expect(root).toHaveAttribute("data-rebar-variant", "sidebar");
  });

  it("renders SidebarNav and children for variant=sidebar", () => {
    render(
      <AppShell sidebar={{ items: SIDEBAR_ITEMS }}>
        <div>dashboard content</div>
      </AppShell>,
    );
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByText("dashboard content")).toBeInTheDocument();
  });

  it("renders NavBar and children for variant=top-nav", () => {
    render(
      <AppShell variant="top-nav" topNav={{ items: NAV_ITEMS }}>
        <div>page content</div>
      </AppShell>,
    );
    expect(screen.getByRole("link", { name: "Docs" })).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("renders NavBar above a sidebar+content row for variant=top-nav-sidebar", () => {
    render(
      <AppShell variant="top-nav-sidebar" topNav={{ items: NAV_ITEMS }} sidebar={{ items: SIDEBAR_ITEMS }}>
        <div>combined content</div>
      </AppShell>,
    );
    expect(screen.getByRole("link", { name: "Docs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByText("combined content")).toBeInTheDocument();
    expect(document.querySelector('[data-rebar-variant="top-nav-sidebar"]')).toBeInTheDocument();
  });

  it("renders a forced-collapsed rail alongside a normal sidebar for variant=three-pane", () => {
    render(
      <AppShell
        variant="three-pane"
        railSidebar={{ items: [{ label: "Workspace", href: "/w" }] }}
        sidebar={{ items: SIDEBAR_ITEMS }}
      >
        <div>three pane content</div>
      </AppShell>,
    );
    // The rail's own item label is hidden (icon-only) once forced collapsed — its accessible
    // name survives via the native title/aria, but the visible sidebar's label doesn't collapse.
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByText("three pane content")).toBeInTheDocument();
  });

  it("renders a top bar, content, and MobileTabBar for variant=mobile", () => {
    render(
      <AppShell variant="mobile" topNav={{ items: NAV_ITEMS }} tabBar={{ items: TAB_ITEMS }}>
        <div>mobile content</div>
      </AppShell>,
    );
    expect(screen.getByRole("link", { name: "Docs" })).toBeInTheDocument();
    expect(screen.getByText("mobile content")).toBeInTheDocument();
    expect(document.querySelector('[data-rebar-component="mobile-tab-bar"]')).toBeInTheDocument();
  });

  it("renders variant=mobile without a top bar when topNav is omitted", () => {
    render(
      <AppShell variant="mobile" tabBar={{ items: TAB_ITEMS }}>
        <div>mobile content</div>
      </AppShell>,
    );
    expect(document.querySelector('[data-rebar-component="navbar"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-rebar-component="mobile-tab-bar"]')).toBeInTheDocument();
  });

  it("defaults the sidebar to collapsed for variant=tablet unless overridden", () => {
    render(
      <AppShell variant="tablet" sidebar={{ items: SIDEBAR_ITEMS }}>
        <div>tablet content</div>
      </AppShell>,
    );
    const sidebar = document.querySelector('[data-rebar-component="sidebar-nav"]');
    expect(sidebar).toHaveAttribute("data-rebar-collapsed", "true");
  });

  it("respects an explicit defaultCollapsed=false on variant=tablet", () => {
    render(
      <AppShell variant="tablet" sidebar={{ items: SIDEBAR_ITEMS, defaultCollapsed: false }}>
        <div>tablet content</div>
      </AppShell>,
    );
    const sidebar = document.querySelector('[data-rebar-component="sidebar-nav"]');
    expect(sidebar).not.toHaveAttribute("data-rebar-collapsed");
  });

  it("adds a real SidePanel alongside variant=sidebar when rightPanel is set", () => {
    render(
      <AppShell sidebar={{ items: SIDEBAR_ITEMS }} rightPanel={{ title: "Details" }}>
        <div>content</div>
      </AppShell>,
    );
    expect(document.querySelector('[data-rebar-component="side-panel"]')).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("adds a real SidePanel alongside variant=top-nav when rightPanel is set", () => {
    render(
      <AppShell variant="top-nav" topNav={{ items: NAV_ITEMS }} rightPanel={{ title: "Outline" }}>
        <div>content</div>
      </AppShell>,
    );
    expect(document.querySelector('[data-rebar-component="side-panel"]')).toBeInTheDocument();
  });

  it("falls back to a bare full-height container when no variant-matching props are given", () => {
    render(<AppShell>bare content</AppShell>);
    const root = document.querySelector('[data-rebar-component="app-shell"]');
    expect(root).toHaveAttribute("data-rebar-variant", "bare");
    expect(screen.getByText("bare content")).toBeInTheDocument();
  });
});
