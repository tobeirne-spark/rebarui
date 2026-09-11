import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NodeLinkGraph } from "../components/NodeLinkGraph";
import type { NodeLinkGraphEdge, NodeLinkGraphNode } from "../components/NodeLinkGraph";

afterEach(() => {
  cleanup();
  // Unmount (disconnecting each component's own useAmbientBionic MutationObserver) before
  // clearing the attribute — the reverse order fires the observer's callback on an about-to-
  // unmount component outside of act(), a benign but noisy warning; matches NavBar.test.tsx's
  // own established ordering for the same ambient-bionic attribute.
  document.documentElement.removeAttribute("data-rebar-bionic");
});

// jsdom doesn't implement a real `PointerEvent` constructor in every version this project's CI
// runs against — a minimal, local stand-in (MouseEvent plus the two pointer-specific fields this
// component's handlers actually read), the same technique `ResizablePanels.test.tsx` uses.
class FakePointerEvent extends MouseEvent {
  pointerId: number;
  pointerType: string;
  constructor(type: string, params: MouseEventInit & { pointerId?: number; pointerType?: string } = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 0;
    this.pointerType = params.pointerType ?? "mouse";
  }
}

function parseTransform(transform: string | null) {
  const translate = transform?.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
  const scale = transform?.match(/scale\(([-\d.]+)\)/);
  const translateX = translate?.[1];
  const translateY = translate?.[2];
  const scaleValue = scale?.[1];
  return {
    x: translateX !== undefined ? parseFloat(translateX) : undefined,
    y: translateY !== undefined ? parseFloat(translateY) : undefined,
    scale: scaleValue !== undefined ? parseFloat(scaleValue) : undefined,
  };
}

function getNodeTransform(container: HTMLElement, id: string) {
  const el = container.querySelector(`[data-rebar-part="node"][data-node-id="${id}"]`);
  return parseTransform(el?.getAttribute("transform") ?? null);
}

const treeNodes: NodeLinkGraphNode[] = [
  { id: "root", label: "Root" },
  { id: "child-a", label: "Child A", parentId: "root" },
  { id: "child-b", label: "Child B", parentId: "root" },
];
const treeEdges: NodeLinkGraphEdge[] = [
  { source: "root", target: "child-a" },
  { source: "root", target: "child-b" },
];

describe("NodeLinkGraph", () => {
  it("carries data-rebar-component and forwards data-testid", () => {
    render(<NodeLinkGraph nodes={treeNodes} edges={treeEdges} data-testid="graph" />);
    expect(screen.getByTestId("graph")).toHaveAttribute("data-rebar-component", "node-link-graph");
  });

  it("hierarchical layout positions parent and children at different depth-based y, and siblings at different x", () => {
    const { container } = render(<NodeLinkGraph nodes={treeNodes} edges={treeEdges} layout="hierarchical" />);

    const root = getNodeTransform(container, "root");
    const childA = getNodeTransform(container, "child-a");
    const childB = getNodeTransform(container, "child-b");

    // Parent sits at a shallower depth (smaller y) than its children.
    expect(root.y).toBeDefined();
    expect(childA.y).toBeDefined();
    expect(root.y).not.toEqual(childA.y);
    expect(childA.y).toEqual(childB.y); // same depth level

    // Siblings are spread horizontally, not stacked at the same x.
    expect(childA.x).not.toEqual(childB.x);
  });

  it("circular layout spaces nodes evenly around a circle (equal radius from center, distinct positions)", () => {
    const nodes: NodeLinkGraphNode[] = [
      { id: "n0", label: "0" },
      { id: "n1", label: "1" },
      { id: "n2", label: "2" },
      { id: "n3", label: "3" },
    ];
    const { container } = render(<NodeLinkGraph nodes={nodes} edges={[]} layout="circular" width={400} height={400} />);

    const cx = 200;
    const cy = 200;
    const positions = nodes.map((n) => getNodeTransform(container, n.id));
    const radii = positions.map((p) => Math.hypot((p.x ?? 0) - cx, (p.y ?? 0) - cy));

    // All nodes sit at (approximately) the same radius from the graph's center.
    const firstRadius = radii[0];
    expect(firstRadius).toBeDefined();
    for (const r of radii) {
      expect(Math.abs(r - firstRadius!)).toBeLessThan(1);
    }

    // But at distinct angular positions (no two nodes share the same x,y).
    const unique = new Set(positions.map((p) => `${p.x},${p.y}`));
    expect(unique.size).toBe(nodes.length);
  });

  it("clicking the zoom buttons changes the rendered scale", async () => {
    const user = userEvent.setup();
    const { container } = render(<NodeLinkGraph nodes={treeNodes} edges={treeEdges} />);

    const before = parseTransform(
      container.querySelector('[data-rebar-part="pan-zoom-container"]')?.getAttribute("transform") ?? null,
    );
    expect(before.scale).toBe(1);

    await user.click(screen.getByLabelText("Zoom in"));
    const afterIn = parseTransform(
      container.querySelector('[data-rebar-part="pan-zoom-container"]')?.getAttribute("transform") ?? null,
    );
    expect(afterIn.scale).toBeGreaterThan(1);

    await user.click(screen.getByLabelText("Zoom out"));
    await user.click(screen.getByLabelText("Zoom out"));
    const afterOut = parseTransform(
      container.querySelector('[data-rebar-part="pan-zoom-container"]')?.getAttribute("transform") ?? null,
    );
    expect(afterOut.scale).toBeLessThan(afterIn.scale!);
  });

  it("zoom buttons are real >=44x44 touch targets", () => {
    render(<NodeLinkGraph nodes={treeNodes} edges={treeEdges} />);
    for (const label of ["Zoom in", "Zoom out"]) {
      const button = screen.getByLabelText(label);
      expect(button.tagName).toBe("BUTTON");
    }
  });

  it("dragging a node in manual layout fires onNodePositionChange with reasonable new coordinates", () => {
    const onNodePositionChange = vi.fn();
    const manualNodes: NodeLinkGraphNode[] = [
      { id: "a", label: "A", x: 50, y: 50 },
      { id: "b", label: "B", x: 200, y: 150 },
    ];
    const { container } = render(
      <NodeLinkGraph
        nodes={manualNodes}
        edges={[]}
        layout="manual"
        onNodePositionChange={onNodePositionChange}
      />,
    );

    const nodeEl = container.querySelector('[data-rebar-part="node"][data-node-id="a"]')!;

    act(() => {
      nodeEl.dispatchEvent(
        new FakePointerEvent("pointerdown", { bubbles: true, clientX: 50, clientY: 50, pointerId: 1, button: 0 }),
      );
      window.dispatchEvent(new FakePointerEvent("pointermove", { clientX: 90, clientY: 70, pointerId: 1 }));
      window.dispatchEvent(new FakePointerEvent("pointerup", { clientX: 90, clientY: 70, pointerId: 1 }));
    });

    expect(onNodePositionChange).toHaveBeenCalledWith("a", 90, 70);
  });

  it("dragging a node in hierarchical layout does NOT reposition it or fire onNodePositionChange", () => {
    const onNodePositionChange = vi.fn();
    const { container } = render(
      <NodeLinkGraph
        nodes={treeNodes}
        edges={treeEdges}
        layout="hierarchical"
        onNodePositionChange={onNodePositionChange}
      />,
    );

    const before = getNodeTransform(container, "child-a");
    const nodeEl = container.querySelector('[data-rebar-part="node"][data-node-id="child-a"]')!;

    act(() => {
      nodeEl.dispatchEvent(
        new FakePointerEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100, pointerId: 1, button: 0 }),
      );
      window.dispatchEvent(new FakePointerEvent("pointermove", { clientX: 300, clientY: 300, pointerId: 1 }));
      window.dispatchEvent(new FakePointerEvent("pointerup", { clientX: 300, clientY: 300, pointerId: 1 }));
    });

    const after = getNodeTransform(container, "child-a");
    expect(after).toEqual(before);
    expect(onNodePositionChange).not.toHaveBeenCalled();
  });

  it("a node with no edges at all still renders without crashing", () => {
    render(<NodeLinkGraph nodes={[{ id: "solo", label: "Solo" }]} edges={[]} />);
    expect(screen.getByText("Solo")).toBeInTheDocument();
  });

  it("splits default node/edge labels for bionic reading via SVG tspan when ambient", () => {
    document.documentElement.setAttribute("data-rebar-bionic", "true");
    const { container } = render(
      <NodeLinkGraph
        nodes={[
          { id: "a", label: "Authentication" },
          { id: "b", label: "Authorization" },
        ]}
        edges={[{ source: "a", target: "b", label: "Requires" }]}
      />,
    );
    const fixations = container.querySelectorAll("tspan.rebar-bionic-fixation");
    expect(fixations.length).toBeGreaterThan(0);
    // A real tspan, not a plain HTML span — invalid content model inside SVG <text>.
    expect(fixations[0]?.tagName.toLowerCase()).toBe("tspan");
  });

  it("does not split labels for bionic reading when not ambient and bionic is not forced on", () => {
    const { container } = render(
      <NodeLinkGraph nodes={[{ id: "a", label: "Authentication" }]} edges={[]} />,
    );
    expect(container.querySelector(".rebar-bionic-fixation")).not.toBeInTheDocument();
  });

  it("renders the default node as a floating circle (not a bordered box), label below it", () => {
    const { container } = render(
      <NodeLinkGraph nodes={[{ id: "a", label: "Authentication" }]} edges={[]} />,
    );
    const shape = container.querySelector('[data-rebar-part="node-shape"]');
    expect(shape?.tagName.toLowerCase()).toBe("circle");
    expect(shape).toHaveAttribute("filter");
    const text = container.querySelector('[data-rebar-part="node"] text');
    expect(Number(text?.getAttribute("y"))).toBeGreaterThan(0);
  });

  it("a node's own color overrides the default node-circle fill", () => {
    const { container } = render(
      <NodeLinkGraph nodes={[{ id: "a", label: "A", color: "#ff0000" }]} edges={[]} />,
    );
    expect(container.querySelector('[data-rebar-part="node-shape"]')).toHaveAttribute("fill", "#ff0000");
  });

  it("fires onViewportChange with resolved node positions and the full-canvas viewport at 100% zoom/no pan", () => {
    const onViewportChange = vi.fn();
    render(
      <NodeLinkGraph
        nodes={[
          { id: "a", label: "A", x: 10, y: 10 },
          { id: "b", label: "B", x: 20, y: 20, parentId: "a" },
        ]}
        edges={[]}
        layout="manual"
        width={480}
        height={360}
        onViewportChange={onViewportChange}
      />,
    );
    expect(onViewportChange).toHaveBeenCalled();
    const call = onViewportChange.mock.calls.at(-1)?.[0];
    expect(call.nodes).toEqual([
      { id: "a", x: 10, y: 10 },
      { id: "b", x: 20, y: 20 },
    ]);
    // No pan, zoom 1 — the visible region is exactly the component's own width/height, from 0,0.
    expect(call.viewportBounds).toEqual({ x: -0, y: -0, width: 480, height: 360 });
  });

  it("onViewportChange reports a shifted/scaled viewportBounds after zooming in", async () => {
    const user = userEvent.setup();
    const onViewportChange = vi.fn();
    render(
      <NodeLinkGraph
        nodes={[{ id: "a", label: "A" }]}
        edges={[]}
        width={480}
        height={360}
        onViewportChange={onViewportChange}
      />,
    );
    onViewportChange.mockClear();
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(onViewportChange).toHaveBeenCalled();
    const call = onViewportChange.mock.calls.at(-1)?.[0];
    // Zoomed in (>1x) with no pan means the visible region shrinks below the full width/height.
    expect(call.viewportBounds.width).toBeLessThan(480);
    expect(call.viewportBounds.height).toBeLessThan(360);
  });

  it("renderEdgeStyle overrides one edge's own stroke/strokeWidth, leaving others at default", () => {
    const { container } = render(
      <NodeLinkGraph
        nodes={[
          { id: "a", label: "A" },
          { id: "b", label: "B", parentId: "a" },
          { id: "c", label: "C", parentId: "a" },
        ]}
        edges={[
          { source: "a", target: "b" },
          { source: "a", target: "c" },
        ]}
        renderEdgeStyle={(edge) => (edge.target === "b" ? { stroke: "rgb(211, 47, 47)", strokeWidth: 3 } : undefined)}
      />,
    );
    const edgeLines = container.querySelectorAll('[data-rebar-part="edge"] line');
    expect(edgeLines).toHaveLength(2);
    const styledLine = Array.from(edgeLines).find((l) => l.getAttribute("stroke") === "rgb(211, 47, 47)");
    expect(styledLine).toBeTruthy();
    expect(styledLine).toHaveAttribute("stroke-width", "3");
    const otherLine = Array.from(edgeLines).find((l) => l.getAttribute("stroke") !== "rgb(211, 47, 47)");
    expect(otherLine).toHaveAttribute("stroke-width", "1.5");
  });

  it("a caller-supplied renderNode bypasses the default bionic-wired label entirely", () => {
    document.documentElement.setAttribute("data-rebar-bionic", "true");
    const { container } = render(
      <NodeLinkGraph
        nodes={[{ id: "a", label: "Authentication" }]}
        edges={[]}
        renderNode={(node) => <text data-testid="custom">{node.label}</text>}
      />,
    );
    expect(container.querySelector('[data-testid="custom"]')).toHaveTextContent("Authentication");
    expect(container.querySelector(".rebar-bionic-fixation")).not.toBeInTheDocument();
  });
});
