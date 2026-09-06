import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "../components/Breadcrumb";

describe("Breadcrumb", () => {
  const items = [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: "Marketing Site Redesign" },
  ];

  it("renders a labeled nav landmark with real links for non-final items", () => {
    render(<Breadcrumb items={items} />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/projects");
  });

  it("marks the final item as the current page, not a link", () => {
    render(<Breadcrumb items={items} />);
    const current = screen.getByText("Marketing Site Redesign");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.tagName).not.toBe("A");
  });

  it("renders a separator between items but not after the last one", () => {
    const { container } = render(<Breadcrumb items={items} />);
    expect(container.querySelectorAll('[data-rebar-part="separator"]')).toHaveLength(2);
  });
});
