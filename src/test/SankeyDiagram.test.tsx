import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SankeyDiagram } from "../components/SankeyDiagram";

afterEach(cleanup);

describe("SankeyDiagram", () => {
  const nodes = [
    { id: "a", label: "Source A" },
    { id: "b", label: "Middle B" },
    { id: "c", label: "Sink C" },
  ];
  const links = [
    { source: "a", target: "b", value: 10 },
    { source: "b", target: "c", value: 10 },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<SankeyDiagram nodes={nodes} links={links} title="Cost flow" />);
    expect(screen.getByRole("img", { name: "Cost flow" })).toBeInTheDocument();
  });

  it("falls back to a default accessible name when no title is set", () => {
    render(<SankeyDiagram nodes={nodes} links={links} />);
    expect(screen.getByRole("img", { name: "Sankey diagram" })).toBeInTheDocument();
  });

  it("renders one rect per node and one path per link", () => {
    const { container } = render(<SankeyDiagram nodes={nodes} links={links} title="Cost flow" />);
    expect(container.querySelectorAll("rect")).toHaveLength(nodes.length);
    expect(container.querySelectorAll("path")).toHaveLength(links.length);
  });

  it("renders the title as a visible figcaption", () => {
    const { container } = render(<SankeyDiagram nodes={nodes} links={links} title="Cost flow" />);
    const caption = container.querySelector("figcaption");
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveTextContent("Cost flow");
  });

  it("renders no figcaption when title is omitted", () => {
    const { container } = render(<SankeyDiagram nodes={nodes} links={links} />);
    expect(container.querySelector("figcaption")).not.toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<SankeyDiagram nodes={nodes} links={links} title="Cost flow" />);
    expect(container.querySelector('[data-rebar-component="sankey-diagram"]')).toBeInTheDocument();
  });

  it("places a node with no incoming links (a true source) in column 0, without crashing", () => {
    const { container } = render(<SankeyDiagram nodes={nodes} links={links} title="Cost flow" />);
    // "a" is the very first source (nothing links into it) and is rendered first, in node order.
    const rects = Array.from(container.querySelectorAll("rect"));
    expect(rects[0]).toHaveAttribute("data-rebar-node-column", "0");
  });

  it("does not crash on a cyclic link graph, and still renders every node", () => {
    const cyclicNodes = [
      { id: "x", label: "X" },
      { id: "y", label: "Y" },
    ];
    const cyclicLinks = [
      { source: "x", target: "y", value: 5 },
      { source: "y", target: "x", value: 3 },
    ];
    const { container } = render(<SankeyDiagram nodes={cyclicNodes} links={cyclicLinks} title="Cyclic" />);
    expect(container.querySelectorAll("rect")).toHaveLength(2);
    expect(container.querySelectorAll("path")).toHaveLength(2);
  });
});
