import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavBar } from "../components/NavBar";

const ITEMS = [
  { label: "Docs", href: "/docs" },
  { label: "Web Components", href: "/components" },
  { label: "Mobile Components", href: "/mobile" },
  { label: "Diagrams", href: "/diagrams" },
  { label: "Benchmarks", href: "/benchmarks" },
  { label: "About", href: "/about" },
];

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-rebar-bionic");
});

/**
 * jsdom has no real layout engine — clientWidth/offsetWidth are always 0 — so overflow behavior
 * is tested by temporarily overriding both getters on HTMLElement.prototype: clientWidth returns
 * a fixed simulated container width, offsetWidth looks up a simulated width per element by its
 * text content (every measured item has distinct, identifiable text).
 */
function mockMeasurements(containerWidth: number, widths: Record<string, number>) {
  const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
  const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return this.dataset.rebarComponent === "navbar" ? containerWidth : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return widths[this.textContent ?? ""] ?? 0;
    },
  });

  return function restore() {
    if (originalClientWidth) Object.defineProperty(HTMLElement.prototype, "clientWidth", originalClientWidth);
    if (originalOffsetWidth) Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  };
}

describe("NavBar", () => {
  it("renders every item as a real link when the container has plenty of room", () => {
    const restore = mockMeasurements(5000, {
      Docs: 50,
      "Web Components": 120,
      "Mobile Components": 140,
      Diagrams: 80,
      Benchmarks: 90,
      About: 60,
      More: 40,
    });
    try {
      render(<NavBar items={ITEMS} aria-label="Main" />);
      const nav = screen.getByRole("navigation", { name: "Main" });
      for (const item of ITEMS) {
        expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
      }
      expect(nav).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "More" })).not.toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it("moves items that don't fit into a trailing More popover, and keeps the rest as direct links", async () => {
    const restore = mockMeasurements(200, {
      Docs: 50,
      "Web Components": 120,
      "Mobile Components": 140,
      Diagrams: 80,
      Benchmarks: 90,
      About: 60,
      More: 40,
    });
    try {
      const user = userEvent.setup();
      render(<NavBar items={ITEMS} aria-label="Main" />);

      // Docs (50) fits within the 200px budget; Web Components (120) does not once More's width
      // is reserved (50 + 24 gap + 120 = 194, budget = 200 - (40 + 24) = 136) — so only Docs
      // renders as a direct, always-visible link, everything else collapses into More.
      expect(screen.getByRole("link", { name: "Docs" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Web Components" })).not.toBeInTheDocument();

      const trigger = screen.getByRole("button", { name: "More" });
      expect(trigger).toBeInTheDocument();

      await user.click(trigger);
      expect(await screen.findByRole("link", { name: "Web Components" })).toHaveAttribute(
        "href",
        "/components",
      );
      expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
    } finally {
      restore();
    }
  });

  it("still splits labels for bionic reading when ambient (measurement and visible labels stay in sync)", () => {
    document.documentElement.setAttribute("data-rebar-bionic", "true");
    const { container } = render(<NavBar items={ITEMS} aria-label="Main" />);
    expect(container.querySelector(".rebar-bionic-fixation")).toBeInTheDocument();
  });
});
