import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { DiagramMinimap } from "../components/DiagramMinimap";

afterEach(cleanup);

const nodes = [
  { id: "a", x: 0, y: 0 },
  { id: "b", x: 100, y: 0 },
  { id: "c", x: 100, y: 200 },
];

describe("DiagramMinimap", () => {
  it("carries data-rebar-component=diagram-minimap and forwards data-testid", () => {
    render(<DiagramMinimap nodes={nodes} data-testid="minimap" />);
    expect(screen.getByTestId("minimap")).toHaveAttribute("data-rebar-component", "diagram-minimap");
  });

  it("renders a real svg with an accessible name from title when ariaLabel is omitted", () => {
    render(<DiagramMinimap nodes={nodes} title="Canvas overview" />);
    expect(screen.getByRole("img", { name: "Canvas overview" })).toBeInTheDocument();
  });

  it("prefers an explicit ariaLabel over title for the accessible name", () => {
    render(<DiagramMinimap nodes={nodes} title="Canvas overview" ariaLabel="Detailed overview" />);
    expect(screen.getByRole("img", { name: "Detailed overview" })).toBeInTheDocument();
  });

  it("renders one dot per node", () => {
    const { container } = render(<DiagramMinimap nodes={nodes} />);
    expect(container.querySelectorAll('[data-rebar-part="node-dot"]')).toHaveLength(3);
  });

  it("dots render at positions scaled proportionally into the small frame (relative positions, not exact pixels)", () => {
    const { container } = render(<DiagramMinimap nodes={nodes} width={120} height={90} />);
    const getDot = (id: string) => container.querySelector(`[data-rebar-part="node-dot"][data-node-id="${id}"]`)!;
    const a = getDot("a");
    const b = getDot("b");
    const c = getDot("c");

    const ax = parseFloat(a.getAttribute("cx")!);
    const bx = parseFloat(b.getAttribute("cx")!);
    const cy = parseFloat(a.getAttribute("cy")!);
    const cyC = parseFloat(c.getAttribute("cy")!);

    // "a" is at the minimum x (0) -> scales to frame x=0; "b"/"c" are at the max x (100) -> frame's
    // right edge. Relative ordering must be preserved, not exact source pixels.
    expect(ax).toBeLessThan(bx);
    expect(parseFloat(b.getAttribute("cx")!)).toBeCloseTo(parseFloat(c.getAttribute("cx")!), 5);
    // "a"/"b" share y=0 (top) while "c" is at the max y (200, bottom) -> "c"'s frame cy is greater.
    expect(cy).toBeLessThan(cyC);

    // Every dot lands inside the declared frame bounds.
    for (const dot of [a, b, c]) {
      expect(parseFloat(dot.getAttribute("cx")!)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(dot.getAttribute("cx")!)).toBeLessThanOrEqual(120);
      expect(parseFloat(dot.getAttribute("cy")!)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(dot.getAttribute("cy")!)).toBeLessThanOrEqual(90);
    }
  });

  it("renders the viewportBounds overlay rect only when supplied", () => {
    const { container, rerender } = render(<DiagramMinimap nodes={nodes} />);
    expect(container.querySelector('[data-rebar-part="viewport"]')).not.toBeInTheDocument();

    rerender(<DiagramMinimap nodes={nodes} viewportBounds={{ x: 0, y: 0, width: 50, height: 50 }} />);
    expect(container.querySelector('[data-rebar-part="viewport"]')).toBeInTheDocument();
  });

  it("a single node with no viewportBounds still renders without crashing", () => {
    render(<DiagramMinimap nodes={[{ id: "solo", x: 42, y: 42 }]} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
});
