import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphExplorer } from "../components/GraphExplorer";
import type { GraphExplorerEdge, GraphExplorerNode } from "../components/GraphExplorer";

afterEach(cleanup);

const NODES: GraphExplorerNode[] = [
  { id: "p1", label: "Ada Lovelace", category: "Person" },
  { id: "p2", label: "Alan Turing", category: "Person" },
  { id: "l1", label: "London", category: "Location" },
];

const EDGES: GraphExplorerEdge[] = [
  { source: "p1", target: "l1" },
  { source: "p2", target: "l1" },
];

describe("GraphExplorer", () => {
  it("carries the expected data-rebar-component attribute and canvas part", () => {
    const { container } = render(<GraphExplorer nodes={NODES} edges={EDGES} />);
    expect(container.querySelector('[data-rebar-component="graph-explorer"]')).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-part="canvas"]')).toBeInTheDocument();
  });

  it("renders the shared empty state when there are no nodes", () => {
    const { container } = render(<GraphExplorer nodes={[]} edges={[]} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-part="canvas"]')).not.toBeInTheDocument();
  });

  it("renders a real, visible title caption", () => {
    render(<GraphExplorer nodes={NODES} edges={EDGES} title="Crime network" />);
    expect(screen.getByText("Crime network")).toBeInTheDocument();
  });

  it("renders one legend chip per category with a live visible/total count", () => {
    const { container } = render(<GraphExplorer nodes={NODES} edges={EDGES} />);
    const chips = container.querySelectorAll('[data-rebar-part="legend-chip"]');
    expect(chips).toHaveLength(2);
    expect(within(container as HTMLElement).getByText(/2 \/ 2 Person/)).toBeInTheDocument();
    expect(within(container as HTMLElement).getByText(/1 \/ 1 Location/)).toBeInTheDocument();
  });

  it("clicking a legend chip toggles aria-pressed and zeroes that category's visible count", async () => {
    const user = userEvent.setup();
    const { container } = render(<GraphExplorer nodes={NODES} edges={EDGES} />);
    const personChip = screen.getByText(/Person/).closest("button") as HTMLElement;
    expect(personChip).toHaveAttribute("aria-pressed", "true");

    await user.click(personChip);
    expect(personChip).toHaveAttribute("aria-pressed", "false");
    expect(within(container as HTMLElement).getByText(/0 \/ 2 Person/)).toBeInTheDocument();
  });

  it("omits the legend entirely when legend={false}", () => {
    const { container } = render(<GraphExplorer nodes={NODES} edges={EDGES} legend={false} />);
    expect(container.querySelector('[data-rebar-part="legend"]')).not.toBeInTheDocument();
  });

  it("typing in the search box narrows legend counts to matching nodes and shows a match dropdown", async () => {
    const user = userEvent.setup();
    const { container } = render(<GraphExplorer nodes={NODES} edges={EDGES} />);
    const input = screen.getByRole("textbox", { name: "Search nodes" });
    await user.type(input, "Ada");

    expect(within(container as HTMLElement).getByText(/1 \/ 2 Person/)).toBeInTheDocument();
    const results = container.querySelector('[data-rebar-part="search-results"]') as HTMLElement;
    expect(within(results).getByText("Ada Lovelace")).toBeInTheDocument();
    expect(within(results).queryByText("Alan Turing")).not.toBeInTheDocument();
  });

  it("omits the search box entirely when searchable={false}", () => {
    render(<GraphExplorer nodes={NODES} edges={EDGES} searchable={false} />);
    expect(screen.queryByRole("textbox", { name: "Search nodes" })).not.toBeInTheDocument();
  });

  it("selecting a search match fires onNodeClick and opens the radial menu with a built-in Pin action", async () => {
    const user = userEvent.setup();
    const onNodeClick = vi.fn();
    const { container } = render(<GraphExplorer nodes={NODES} edges={EDGES} onNodeClick={onNodeClick} />);

    await user.type(screen.getByRole("textbox", { name: "Search nodes" }), "Ada");
    await user.click(screen.getByText("Ada Lovelace"));

    expect(onNodeClick).toHaveBeenCalledWith(expect.objectContaining({ id: "p1", label: "Ada Lovelace" }));
    const menu = container.querySelector('[data-rebar-part="radial-menu"]');
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("omits the Pin action when pinnable={false}, but keeps custom nodeActions", async () => {
    const user = userEvent.setup();
    const nodeActions = vi.fn().mockReturnValue([{ label: "Expand", onClick: vi.fn() }]);
    render(<GraphExplorer nodes={NODES} edges={EDGES} pinnable={false} nodeActions={nodeActions} />);

    await user.type(screen.getByRole("textbox", { name: "Search nodes" }), "Ada");
    await user.click(screen.getByText("Ada Lovelace"));

    expect(screen.queryByRole("button", { name: "Pin" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand" })).toBeInTheDocument();
    expect(nodeActions).toHaveBeenCalledWith(expect.objectContaining({ id: "p1" }));
  });

  it("clicking a custom node action fires its onClick with the selected node", async () => {
    const user = userEvent.setup();
    const onExpand = vi.fn();
    const nodeActions = vi.fn().mockReturnValue([{ label: "Expand", onClick: onExpand }]);
    render(<GraphExplorer nodes={NODES} edges={EDGES} nodeActions={nodeActions} />);

    await user.type(screen.getByRole("textbox", { name: "Search nodes" }), "Ada");
    await user.click(screen.getByText("Ada Lovelace"));
    await user.click(screen.getByRole("button", { name: "Expand" }));

    expect(onExpand).toHaveBeenCalledWith(expect.objectContaining({ id: "p1", label: "Ada Lovelace" }));
  });

  it("clicking Close on the radial menu deselects the node", async () => {
    const user = userEvent.setup();
    const { container } = render(<GraphExplorer nodes={NODES} edges={EDGES} />);

    await user.type(screen.getByRole("textbox", { name: "Search nodes" }), "Ada");
    await user.click(screen.getByText("Ada Lovelace"));
    expect(container.querySelector('[data-rebar-part="radial-menu"]')).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(container.querySelector('[data-rebar-part="radial-menu"]')).not.toBeInTheDocument();
  });

  it("announces the selected node via a visually-hidden live region", async () => {
    const user = userEvent.setup();
    const { container } = render(<GraphExplorer nodes={NODES} edges={EDGES} />);
    await user.type(screen.getByRole("textbox", { name: "Search nodes" }), "Ada");
    await user.click(screen.getByText("Ada Lovelace"));

    expect(container.querySelector('[data-rebar-part="status"]')).toHaveTextContent(
      "Selected: Ada Lovelace (Person)",
    );
  });

  it("the zoom controls report and clamp percentage", async () => {
    const user = userEvent.setup();
    render(<GraphExplorer nodes={NODES} edges={EDGES} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("125%")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset view" }));
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("forwards arbitrary data-*/aria-* props to the root element", () => {
    render(<GraphExplorer nodes={NODES} edges={EDGES} data-testid="explorer" aria-label="Network" />);
    expect(screen.getByTestId("explorer")).toHaveAttribute("aria-label", "Network");
  });

  // jsdom has no real `PointerEvent` constructor (confirmed directly, not assumed) — testing-
  // library's `fireEvent.pointerDown` silently falls back to a plain `Event`, so properties like
  // `pointerId`/`clientX`/`pointerType` never actually reach the handler. That rules out unit-
  // testing the real pinch-to-zoom math (multi-pointer tracking, hit-test radius by input type)
  // here — same reason this codebase's other pointer/drag-driven components already verify that
  // class of interaction via Playwright against a real browser instead of jsdom. This one test is
  // still worth keeping at the unit level: a defensive regression check that dispatching pointer
  // events at all doesn't throw (e.g. on `canvas.setPointerCapture`, which jsdom also doesn't
  // implement, guarded for specifically because of this).
  it("dispatching pointer events on the canvas does not throw, even without real PointerEvent/setPointerCapture support", () => {
    const { container } = render(<GraphExplorer nodes={NODES} edges={EDGES} />);
    const canvas = container.querySelector('[data-rebar-part="canvas"]') as HTMLElement;

    expect(() => {
      fireEvent.pointerDown(canvas, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 50, clientY: 50 });
      fireEvent.pointerMove(canvas, { pointerId: 1, pointerType: "mouse", clientX: 90, clientY: 70 });
      fireEvent.pointerUp(canvas, { pointerId: 1, pointerType: "mouse", clientX: 90, clientY: 70 });
    }).not.toThrow();
  });
});
