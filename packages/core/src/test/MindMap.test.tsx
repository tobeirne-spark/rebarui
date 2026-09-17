import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MindMap } from "../components/MindMap";
import type { MindMapBranch } from "../components/MindMap";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-rebar-bionic");
});

const branches: MindMapBranch[] = [
  {
    id: "branch-a",
    label: "Branch A",
    children: [
      { id: "a-1", label: "A1" },
      { id: "a-2", label: "A2" },
    ],
  },
  {
    id: "branch-b",
    label: "Branch B",
    children: [{ id: "b-1", label: "B1" }],
  },
];

describe("MindMap", () => {
  it("carries data-rebar-component=mind-map and forwards data-testid", () => {
    render(<MindMap topic="Central topic" branches={branches} data-testid="map" />);
    expect(screen.getByTestId("map")).toHaveAttribute("data-rebar-component", "mind-map");
  });

  it("produces exactly one node per topic + branch + child", () => {
    const { container } = render(<MindMap topic="Central topic" branches={branches} />);
    // 1 root + 2 branches + 3 children (2 under branch-a, 1 under branch-b) = 6 nodes.
    expect(container.querySelectorAll('[data-rebar-part="node"]')).toHaveLength(6);
  });

  it("renders the topic, every branch label, and every child label", () => {
    render(<MindMap topic="Central topic" branches={branches} />);
    expect(screen.getByText("Central topic")).toBeInTheDocument();
    expect(screen.getByText("Branch A")).toBeInTheDocument();
    expect(screen.getByText("Branch B")).toBeInTheDocument();
    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByText("B1")).toBeInTheDocument();
  });

  it("a branch with no children still renders without crashing", () => {
    const lonely: MindMapBranch[] = [{ id: "solo", label: "Solo branch" }];
    const { container } = render(<MindMap topic="Topic" branches={lonely} />);
    // 1 root + 1 branch, no children = 2 nodes.
    expect(container.querySelectorAll('[data-rebar-part="node"]')).toHaveLength(2);
    expect(screen.getByText("Solo branch")).toBeInTheDocument();
  });

  it("renders one edge per branch (to the topic) plus one per child (to its branch)", () => {
    const { container } = render(<MindMap topic="Central topic" branches={branches} />);
    // 2 branch edges + 3 child edges = 5 edges.
    expect(container.querySelectorAll('[data-rebar-part="edge"]')).toHaveLength(5);
  });

  it("splits the topic/branch labels for bionic reading via SVG tspan when ambient", () => {
    document.documentElement.setAttribute("data-rebar-bionic", "true");
    const { container } = render(<MindMap topic="Central topic" branches={branches} />);
    const fixations = container.querySelectorAll("tspan.rebar-bionic-fixation");
    expect(fixations.length).toBeGreaterThan(0);
    expect(fixations[0]?.tagName.toLowerCase()).toBe("tspan");
  });

  it("does not split labels for bionic reading when not ambient", () => {
    const { container } = render(<MindMap topic="Central topic" branches={branches} />);
    expect(container.querySelector(".rebar-bionic-fixation")).not.toBeInTheDocument();
  });
});
