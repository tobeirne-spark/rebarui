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

  it("renders no thumb icon by default", () => {
    const { container } = render(<Switch aria-label="Dark mode" />);
    expect(container.querySelector('[data-rebar-part="thumb-icon"]')).not.toBeInTheDocument();
  });

  it("renders a caller-supplied thumb icon", () => {
    const { container } = render(<Switch aria-label="Dark mode" thumbIcon={<span data-testid="moon" />} />);
    expect(container.querySelector('[data-rebar-part="thumb-icon"]')).toBeInTheDocument();
    expect(screen.getByTestId("moon")).toBeInTheDocument();
  });
});
