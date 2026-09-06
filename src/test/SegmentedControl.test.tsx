import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentedControl } from "../components/SegmentedControl";

afterEach(cleanup);

const OPTIONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

describe("SegmentedControl", () => {
  it("renders a real radiogroup with one radio per option", () => {
    render(<SegmentedControl options={OPTIONS} value="week" aria-label="Range" />);
    const group = screen.getByRole("radiogroup", { name: "Range" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Week" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Day" })).toHaveAttribute("aria-checked", "false");
  });

  it("calls onValueChange on click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} value="day" onValueChange={onValueChange} aria-label="Range" />);
    await user.click(screen.getByRole("radio", { name: "Month" }));
    expect(onValueChange).toHaveBeenCalledWith("month");
  });

  it("updates its own visual selection when used uncontrolled (defaultValue only, no value prop)", async () => {
    const user = userEvent.setup();
    render(<SegmentedControl options={OPTIONS} defaultValue="day" aria-label="Range" />);
    await user.click(screen.getByRole("radio", { name: "Month" }));
    expect(screen.getByRole("radio", { name: "Month" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Day" })).toHaveAttribute("aria-checked", "false");
  });

  it("moves selection with arrow keys, wrapping at the ends", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} value="month" onValueChange={onValueChange} aria-label="Range" />);
    screen.getByRole("radio", { name: "Month" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledWith("day");
  });
});
