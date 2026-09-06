import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "../components/Checkbox";

describe("Checkbox", () => {
  it("renders as a real checkbox with the label as its accessible name", () => {
    render(<Checkbox>Accept terms</Checkbox>);
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).toBeInTheDocument();
  });

  it("toggles via keyboard (Tab, Space) and calls onCheckedChange", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox onCheckedChange={onCheckedChange}>Accept terms</Checkbox>);

    await user.tab();
    expect(screen.getByRole("checkbox")).toHaveFocus();

    await user.keyboard(" ");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("carries data-rebar-component and forwards data-testid", () => {
    render(<Checkbox data-testid="terms-checkbox">Accept terms</Checkbox>);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("data-rebar-component", "checkbox");
    expect(checkbox).toHaveAttribute("data-testid", "terms-checkbox");
  });
});
