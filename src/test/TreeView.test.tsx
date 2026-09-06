import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TreeView } from "../components/TreeView";

afterEach(cleanup);

const DATA = [
  {
    value: "src",
    label: "src",
    children: [
      { value: "index.ts", label: "index.ts" },
      { value: "components", label: "components", children: [{ value: "Button.tsx", label: "Button.tsx" }] },
    ],
  },
  { value: "package.json", label: "package.json" },
];

describe("TreeView", () => {
  it("renders a real tree with only top-level nodes visible by default", () => {
    render(<TreeView data={DATA} aria-label="Files" />);
    expect(screen.getByRole("tree", { name: "Files" })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: /src/ })).toBeInTheDocument();
    expect(screen.queryByRole("treeitem", { name: /index\.ts/ })).not.toBeInTheDocument();
  });

  it("expands a node to reveal its children on toggle click", async () => {
    const user = userEvent.setup();
    render(<TreeView data={DATA} aria-label="Files" />);
    await user.click(screen.getByRole("button", { name: "Expand" }));
    expect(screen.getByRole("treeitem", { name: /index\.ts/ })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: /src/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("selects a node on click and marks it aria-selected", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TreeView data={DATA} onSelect={onSelect} aria-label="Files" />);
    await user.click(screen.getByRole("treeitem", { name: /package\.json/ }));
    expect(onSelect).toHaveBeenCalledWith("package.json");
    expect(screen.getByRole("treeitem", { name: /package\.json/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("moves real DOM focus down via ArrowDown, not just tabIndex", async () => {
    const user = userEvent.setup();
    render(<TreeView data={DATA} defaultExpanded={["src"]} aria-label="Files" />);
    const src = screen.getByRole("treeitem", { name: /src/ });
    src.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("treeitem", { name: /index\.ts/ })).toHaveFocus();
  });

  it("expands a collapsed node via ArrowRight without moving focus off it", async () => {
    const user = userEvent.setup();
    render(<TreeView data={DATA} aria-label="Files" />);
    const src = screen.getByRole("treeitem", { name: /src/ });
    src.focus();
    await user.keyboard("{ArrowRight}");
    expect(src).toHaveAttribute("aria-expanded", "true");
    expect(src).toHaveFocus();
  });
});
