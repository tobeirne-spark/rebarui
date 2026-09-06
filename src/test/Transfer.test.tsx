import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Transfer } from "../components/Transfer";

afterEach(cleanup);

const ITEMS = [
  { key: "a", label: "Alpha" },
  { key: "b", label: "Bravo" },
  { key: "c", label: "Charlie" },
];

describe("Transfer", () => {
  it("renders items in the source panel by default, target panel empty", () => {
    render(<Transfer items={ITEMS} />);
    expect(screen.getByRole("checkbox", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Bravo" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Charlie" })).toBeInTheDocument();
    expect(document.querySelector('[data-rebar-part="target-panel"]')).toHaveTextContent("No items");
  });

  it("checking items in source and clicking → moves them to target and fires onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Transfer items={ITEMS} onValueChange={onValueChange} />);

    await user.click(screen.getByRole("checkbox", { name: "Alpha" }));
    await user.click(screen.getByRole("checkbox", { name: "Charlie" }));
    await user.click(screen.getByRole("button", { name: /move checked items to selected/i }));

    expect(onValueChange).toHaveBeenCalledWith(["a", "c"]);
    // Uncontrolled: the component re-renders itself with the new split.
    const targetPanel = document.querySelector('[data-rebar-part="target-panel"]');
    expect(targetPanel).toHaveTextContent("Alpha");
    expect(targetPanel).toHaveTextContent("Charlie");
    const sourcePanel = document.querySelector('[data-rebar-part="source-panel"]');
    expect(sourcePanel).not.toHaveTextContent("Alpha");
    expect(sourcePanel).toHaveTextContent("Bravo");
  });

  it("checking items in target and clicking ← moves them back to source", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Transfer items={ITEMS} defaultValue={["a", "b", "c"]} onValueChange={onValueChange} />);

    await user.click(screen.getByRole("checkbox", { name: "Bravo" }));
    await user.click(screen.getByRole("button", { name: /move checked items to available/i }));

    expect(onValueChange).toHaveBeenCalledWith(["a", "c"]);
    const sourcePanel = document.querySelector('[data-rebar-part="source-panel"]');
    expect(sourcePanel).toHaveTextContent("Bravo");
  });

  it("works as a controlled component: the widget doesn't self-manage state", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Transfer items={ITEMS} value={["a"]} onValueChange={onValueChange} />);

    expect(document.querySelector('[data-rebar-part="target-panel"]')).toHaveTextContent("Alpha");

    await user.click(screen.getByRole("checkbox", { name: "Bravo" }));
    await user.click(screen.getByRole("button", { name: /move checked items to selected/i }));

    expect(onValueChange).toHaveBeenCalledWith(["a", "b"]);
    // Controlled: since the parent never re-rendered with a new `value`, the target panel still
    // shows only the originally-passed key.
    const targetPanel = document.querySelector('[data-rebar-part="target-panel"]');
    expect(targetPanel).toHaveTextContent("Alpha");
    expect(targetPanel).not.toHaveTextContent("Bravo");
  });

  it("carries data-rebar-component and custom panel titles", () => {
    render(<Transfer items={ITEMS} sourceTitle="Left" targetTitle="Right" data-testid="transfer" />);
    expect(screen.getByTestId("transfer")).toHaveAttribute("data-rebar-component", "transfer");
    expect(screen.getByText(/Left \(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/Right \(0\)/)).toBeInTheDocument();
  });
});
