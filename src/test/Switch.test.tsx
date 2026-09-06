import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "../components/Switch";

describe("Switch", () => {
  it("renders as a real switch role", () => {
    render(<Switch aria-label="Dark mode" />);
    expect(screen.getByRole("switch", { name: "Dark mode" })).toBeInTheDocument();
  });

  it("toggles via keyboard and calls onCheckedChange", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Dark mode" onCheckedChange={onCheckedChange} />);

    await user.tab();
    await user.keyboard(" ");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("carries data-rebar-component", () => {
    render(<Switch aria-label="Dark mode" />);
    expect(screen.getByRole("switch")).toHaveAttribute("data-rebar-component", "switch");
  });
});
