import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Slider } from "../components/Slider";

describe("Slider", () => {
  it("renders a real slider role with the given value", () => {
    render(<Slider value={30} aria-label="Volume" />);
    expect(screen.getByRole("slider", { name: "Volume" })).toHaveAttribute(
      "aria-valuenow",
      "30",
    );
  });

  it("increases the value on ArrowRight and calls onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Slider defaultValue={30} step={10} aria-label="Volume" onValueChange={onValueChange} />);

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(onValueChange).toHaveBeenCalledWith(40);
  });

  it("carries data-rebar-component and part attributes", () => {
    render(<Slider value={30} aria-label="Volume" />);
    expect(
      screen.getByRole("slider").closest('[data-rebar-component="slider"]'),
    ).not.toBeNull();
  });
});
