import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Rate } from "../components/Rate";

describe("Rate", () => {
  it("renders a radiogroup of the requested star count", () => {
    render(<Rate count={5} />);
    expect(screen.getByRole("radiogroup", { name: "Rating" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
  });

  it("checks the star matching the current value", () => {
    render(<Rate defaultValue={3} />);
    expect(screen.getByRole("radio", { name: "3 stars" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "4 stars" })).toHaveAttribute("aria-checked", "false");
  });

  it("sets the value on click and calls onChange", async () => {
    const onChange = vi.fn();
    render(<Rate onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    expect(onChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole("radio", { name: "4 stars" })).toHaveAttribute("aria-checked", "true");
  });

  it("increases the value with the right arrow key", async () => {
    const onChange = vi.fn();
    render(<Rate defaultValue={2} onChange={onChange} />);
    screen.getByRole("radio", { name: "2 stars" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("does not respond to clicks or keys while disabled", async () => {
    const onChange = vi.fn();
    render(<Rate defaultValue={2} disabled onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
