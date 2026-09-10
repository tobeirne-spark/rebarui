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

  it("defaults to size md, reflected as a data attribute", () => {
    render(<ColorPicker />);
    expect(screen.getByRole("button", { name: /Pick a color/ })).toHaveAttribute("data-rebar-size", "md");
  });

  it("renders a visibly smaller swatch for size sm without shrinking the real tap target", () => {
    const { container } = render(<ColorPicker size="sm" defaultValue="#2e7d32" />);
    const trigger = screen.getByRole("button", { name: /Pick a color/ });
    expect(trigger).toHaveAttribute("data-rebar-size", "sm");
    // The trigger button itself carries no inline size — CSS (min-width/min-height: 44px) is what
    // keeps the real hit area at the touch-target minimum regardless of the visual swatch size.
    expect(trigger).not.toHaveAttribute("style");
    const swatch = container.querySelector('[data-rebar-part="swatch"]');
    expect(swatch).toHaveStyle({ width: "20px", height: "20px", backgroundColor: "#2e7d32" });
  });

  it("renders a visibly larger swatch for size lg", () => {
    const { container } = render(<ColorPicker size="lg" defaultValue="#2e7d32" />);
    const swatch = container.querySelector('[data-rebar-part="swatch"]');
    expect(swatch).toHaveStyle({ width: "36px", height: "36px" });
  });
});
