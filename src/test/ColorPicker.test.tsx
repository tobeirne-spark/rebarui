import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorPicker } from "../components/ColorPicker";

afterEach(cleanup);

describe("ColorPicker", () => {
  it("renders a trigger showing the current color", () => {
    render(<ColorPicker defaultValue="#2e7d32" />);
    expect(screen.getByRole("button", { name: /#2e7d32/ })).toBeInTheDocument();
  });

  it("opens a popover of preset swatches and a native color input on click", async () => {
    const user = userEvent.setup();
    render(<ColorPicker />);
    await user.click(screen.getByRole("button", { name: /Pick a color/ }));
    expect(screen.getAllByRole("button", { name: /^#/ }).length).toBeGreaterThan(1);
  });

  it("calls onChange and closes when a preset swatch is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker onChange={onChange} presets={["#111111", "#222222"]} />);
    await user.click(screen.getByRole("button", { name: /Pick a color/ }));
    await user.click(screen.getByRole("button", { name: "#222222" }));
    expect(onChange).toHaveBeenCalledWith("#222222");
  });
});
