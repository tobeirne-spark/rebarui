import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberInput } from "../components/NumberInput";

afterEach(cleanup);

describe("NumberInput", () => {
  it("renders with the expected data attributes and a default value", () => {
    render(<NumberInput defaultValue={5} aria-label="Quantity" />);
    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("5");
  });

  it("increments and decrements via the stepper buttons", async () => {
    const user = userEvent.setup();
    render(<NumberInput defaultValue={5} aria-label="Quantity" />);
    await user.click(screen.getByRole("button", { name: "Increase" }));
    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("6");
    await user.click(screen.getByRole("button", { name: "Decrease" }));
    await user.click(screen.getByRole("button", { name: "Decrease" }));
    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("4");
  });

  it("clamps to min/max and disables the stepper at the boundary", async () => {
    const user = userEvent.setup();
    render(<NumberInput defaultValue={9} min={0} max={10} aria-label="Bounded" />);
    const increment = screen.getByRole("button", { name: "Increase" });
    await user.click(increment);
    expect(screen.getByRole("textbox", { name: "Bounded" })).toHaveValue("10");
    expect(increment).toBeDisabled();
  });

  it("calls onChange with the clamped value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberInput defaultValue={0} max={5} onChange={onChange} aria-label="Callback" />);
    for (let i = 0; i < 7; i++) {
      await user.click(screen.getByRole("button", { name: "Increase" }));
    }
    expect(onChange).toHaveBeenLastCalledWith(5);
  });
});
