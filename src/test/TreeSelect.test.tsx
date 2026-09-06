import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TreeSelect } from "../components/TreeSelect";

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

describe("TreeSelect", () => {
  it("shows a placeholder when nothing is picked", () => {
    render(<TreeSelect data={DATA} placeholder="Pick a file" />);
    expect(screen.getByRole("button", { name: /current value none/ })).toHaveTextContent(
      "Pick a file",
    );
  });

  it("opens a popover with the real tree on trigger click", async () => {
    const user = userEvent.setup();
    render(<TreeSelect data={DATA} placeholder="Pick a file" />);
    expect(screen.queryByRole("tree")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /current value none/ }));
    expect(screen.getByRole("tree")).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: /src/ })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: /package\.json/ })).toBeInTheDocument();
  });

  it("picking a node fires onValueChange with id + label, closes the popover, and updates the trigger label", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TreeSelect data={DATA} placeholder="Pick a file" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: /current value none/ }));
    await user.click(screen.getByRole("treeitem", { name: /package\.json/ }));

    expect(onValueChange).toHaveBeenCalledWith("package.json", "package.json");
    expect(screen.queryByRole("tree")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /current value package\.json/ })).toHaveTextContent(
      "package.json",
    );
  });

  it("picking a nested node reports its own label, not its parent's", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TreeSelect data={DATA} defaultValue="src" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: /current value src/ }));
    await user.click(screen.getByRole("button", { name: "Expand" }));
    await user.click(screen.getByRole("treeitem", { name: /^index\.ts/ }));

    expect(onValueChange).toHaveBeenCalledWith("index.ts", "index.ts");
    expect(screen.getByRole("button", { name: /current value index\.ts/ })).toHaveTextContent(
      "index.ts",
    );
  });

  it("does not self-manage state when value is controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TreeSelect data={DATA} value="src" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: /current value src/ }));
    await user.click(screen.getByRole("treeitem", { name: /package\.json/ }));

    expect(onValueChange).toHaveBeenCalledWith("package.json", "package.json");
    // Trigger label doesn't change since the caller never fed the new value back in.
    expect(screen.getByRole("button", { name: /current value src/ })).toHaveTextContent("src");
  });
});
