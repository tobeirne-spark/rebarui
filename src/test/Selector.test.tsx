import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Selector } from "../components/Selector";

afterEach(cleanup);

const OPTIONS = [
  { label: "Red", value: "red" },
  { label: "Green", value: "green" },
  { label: "Blue", value: "blue", disabled: true },
];

describe("Selector", () => {
  it("renders one chip per option", () => {
    render(<Selector options={OPTIONS} />);
    expect(screen.getByRole("button", { name: "Red" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Green" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Blue" })).toBeInTheDocument();
  });

  it("single-select: picking a new option replaces the previous selection", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Selector options={OPTIONS} onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: "Red" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["red"]);
    expect(screen.getByRole("button", { name: "Red" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Green" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["green"]);
    expect(screen.getByRole("button", { name: "Red" })).toHaveAttribute("aria-pressed", "false");
  });

  it("multiple: picking accumulates selections", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Selector options={OPTIONS} multiple onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: "Red" }));
    await user.click(screen.getByRole("button", { name: "Green" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["red", "green"]);
  });

  it("clicking an already-selected option deselects it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Selector options={OPTIONS} value={["red"]} onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: "Red" }));
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it("a disabled option cannot be toggled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Selector options={OPTIONS} onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: "Blue" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("supports a description under the label", () => {
    render(<Selector options={[{ label: "Standard", description: "2-3 days", value: "std" }]} />);
    expect(screen.getByText("2-3 days")).toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<Selector options={OPTIONS} />);
    expect(container.querySelector("[data-rebar-component='selector']")).toBeInTheDocument();
  });
});
