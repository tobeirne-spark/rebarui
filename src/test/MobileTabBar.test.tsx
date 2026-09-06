import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileTabBar } from "../components/MobileTabBar";

const ITEMS = [
  { label: "Home", icon: <span>🏠</span> },
  { label: "Search", icon: <span>🔎</span> },
  { label: "Profile", icon: <span>👤</span>, href: "/profile" },
];

describe("MobileTabBar", () => {
  it("renders a nav landmark with every item as a real, focusable target", () => {
    render(<MobileTabBar items={ITEMS} />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute("data-rebar-component", "mobile-tab-bar");

    expect(screen.getByRole("button", { name: /Home/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Search/ })).toBeInTheDocument();
    // The href item renders as a real link instead of a button.
    expect(screen.getByRole("link", { name: /Profile/ })).toHaveAttribute("href", "/profile");
  });

  it("shows both icon and label for every item (icons require labels)", () => {
    render(<MobileTabBar items={ITEMS} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("🏠")).toBeInTheDocument();
  });

  it("defaults active tab to index 0, uncontrolled, and updates on click", async () => {
    const user = userEvent.setup();
    render(<MobileTabBar items={ITEMS} />);
    expect(screen.getByRole("button", { name: /Home/ })).toHaveClass(
      "rebar-mobile-tab-bar-item-active",
    );
    await user.click(screen.getByRole("button", { name: /Search/ }));
    expect(screen.getByRole("button", { name: /Search/ })).toHaveClass(
      "rebar-mobile-tab-bar-item-active",
    );
    expect(screen.getByRole("button", { name: /Home/ })).not.toHaveClass(
      "rebar-mobile-tab-bar-item-active",
    );
  });

  it("supports defaultActiveIndex for uncontrolled initial state", () => {
    render(<MobileTabBar items={ITEMS} defaultActiveIndex={1} />);
    expect(screen.getByRole("button", { name: /Search/ })).toHaveClass(
      "rebar-mobile-tab-bar-item-active",
    );
  });

  it("calls onActiveChange and an item's own onSelect on click", async () => {
    const user = userEvent.setup();
    const onActiveChange = vi.fn();
    const onSelect = vi.fn();
    const items = [
      { label: "Home", onSelect },
      { label: "Search" },
    ];
    render(<MobileTabBar items={items} onActiveChange={onActiveChange} />);
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(onActiveChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole("button", { name: "Home" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onActiveChange).toHaveBeenCalledWith(0);
  });

  it("supports fully controlled activeIndex — clicking doesn't change it without the caller updating state", async () => {
    const user = userEvent.setup();
    const onActiveChange = vi.fn();
    render(<MobileTabBar items={ITEMS} activeIndex={0} onActiveChange={onActiveChange} />);

    await user.click(screen.getByRole("button", { name: /Search/ }));
    expect(onActiveChange).toHaveBeenCalledWith(1);
    // Still shows index 0 as active since the caller (this test) never fed activeIndex back.
    expect(screen.getByRole("button", { name: /Home/ })).toHaveClass(
      "rebar-mobile-tab-bar-item-active",
    );
  });

  it("reflects an externally-driven activeIndex change", () => {
    function Controlled() {
      const [active, setActive] = useState(0);
      return (
        <>
          <button onClick={() => setActive(2)}>jump to profile</button>
          <MobileTabBar items={ITEMS} activeIndex={active} onActiveChange={setActive} />
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole("link", { name: /Profile/ })).not.toHaveClass(
      "rebar-mobile-tab-bar-item-active",
    );
  });

  it("uses a custom renderLink for href items", () => {
    render(
      <MobileTabBar
        items={ITEMS}
        renderLink={({ href, children, className }) => (
          <a href={href} className={className} data-testid="custom-link">
            {children}
          </a>
        )}
      />,
    );
    expect(screen.getByTestId("custom-link")).toHaveAttribute("href", "/profile");
  });
});
