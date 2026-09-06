import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Treemap } from "../components/Treemap";

afterEach(cleanup);

describe("Treemap", () => {
  const data = [
    {
      label: "Group A",
      value: 60,
      children: [
        { label: "A1", value: 30 },
        { label: "A2", value: 30 },
      ],
    },
    { label: "Group B", value: 40 },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<Treemap data={data} title="Portfolio breakdown" />);
    expect(screen.getByRole("img", { name: "Portfolio breakdown" })).toBeInTheDocument();
  });

  it("falls back to ariaLabel, then a default, for the accessible name", () => {
    render(<Treemap data={data} ariaLabel="Custom label" />);
    expect(screen.getByRole("img", { name: "Custom label" })).toBeInTheDocument();

    cleanup();
    render(<Treemap data={data} />);
    expect(screen.getByRole("img", { name: "Treemap" })).toBeInTheDocument();
  });

  it("renders one rect per leaf node, including nested children", () => {
    const { container } = render(<Treemap data={data} title="Portfolio breakdown" />);
    // Group A contributes 2 leaves (A1, A2); Group B has no children so it is itself one leaf.
    expect(container.querySelectorAll("rect")).toHaveLength(3);
  });

  it("renders each leaf's own label when the cell is large enough", () => {
    render(<Treemap data={data} title="Portfolio breakdown" />);
    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByText("Group B")).toBeInTheDocument();
  });

  it("renders the title as a visible caption", () => {
    const { container } = render(<Treemap data={data} title="Portfolio breakdown" />);
    const caption = container.querySelector("figcaption");
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveTextContent("Portfolio breakdown");
  });

  it("omits the caption when no title is given", () => {
    const { container } = render(<Treemap data={data} />);
    expect(container.querySelector("figcaption")).not.toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<Treemap data={data} title="Portfolio breakdown" />);
    expect(container.querySelector('[data-rebar-component="treemap"]')).toBeInTheDocument();
  });

  it("handles a group whose children's values don't add up cleanly (a zero-value child) without dividing by zero", () => {
    const uneven = [
      {
        label: "Group",
        value: 100,
        children: [
          { label: "Has value", value: 100 },
          { label: "Zero", value: 0 },
        ],
      },
    ];
    const { container } = render(<Treemap data={uneven} title="Uneven group" />);
    const rects = container.querySelectorAll("rect");
    // Still exactly one rect per leaf — the zero-value child doesn't get dropped or crash layout.
    expect(rects).toHaveLength(2);

    for (const rect of Array.from(rects)) {
      for (const attr of ["x", "y", "width", "height"]) {
        const raw = rect.getAttribute(attr);
        expect(raw).not.toBeNull();
        expect(Number.isNaN(Number(raw))).toBe(false);
      }
    }

    // The zero-value sibling collapses to zero height (vertical split within the single top-level
    // group) but keeps a finite, non-NaN full-width footprint rather than blowing up the layout.
    const zeroRect = rects[1];
    expect(zeroRect).toBeDefined();
    expect(Number(zeroRect?.getAttribute("height"))).toBe(0);
    expect(Number(zeroRect?.getAttribute("width"))).toBeCloseTo(480, 0);
  });

  it("handles an entirely empty top-level group list without crashing", () => {
    const { container } = render(<Treemap data={[]} title="Empty" />);
    expect(container.querySelectorAll("rect")).toHaveLength(0);
  });
});
