import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DatePicker } from "../components/DatePicker";

describe("DatePicker", () => {
  it("shows a placeholder when no date is picked", () => {
    render(<DatePicker placeholder="Pick a date" />);
    const trigger = screen.getByRole("button", { name: /current value none/ });
    expect(trigger).toHaveTextContent("Pick a date");
  });

  it("opens a calendar popover on click and picks a date, closing the popover", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker defaultValue={new Date(2026, 5, 1)} onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: /June 1, 2026/ }));
    expect(screen.getByRole("button", { name: /June 15, 2026/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /June 15, 2026/ }));
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 5, 15));
    expect(screen.queryByRole("button", { name: /Previous month/ })).not.toBeInTheDocument();
  });

  it("updates the trigger label after an uncontrolled pick", async () => {
    const user = userEvent.setup();
    render(<DatePicker defaultValue={new Date(2026, 5, 1)} />);
    await user.click(screen.getByRole("button", { name: /June 1, 2026/ }));
    await user.click(screen.getByRole("button", { name: /June 20, 2026/ }));
    expect(screen.getByRole("button", { name: /June 20, 2026/ })).toBeInTheDocument();
  });

  it("does not self-manage state when value is controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker value={new Date(2026, 5, 1)} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: /June 1, 2026/ }));
    await user.click(screen.getByRole("button", { name: /June 15, 2026/ }));
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 5, 15));
    // Trigger label doesn't change since the caller never fed the new value back in.
    expect(screen.getByRole("button", { name: /June 1, 2026/ })).toBeInTheDocument();
  });

  it("respects minDate/maxDate passed through to the underlying Calendar", async () => {
    const user = userEvent.setup();
    render(
      <DatePicker
        defaultValue={new Date(2026, 5, 15)}
        minDate={new Date(2026, 5, 10)}
        maxDate={new Date(2026, 5, 20)}
      />,
    );
    await user.click(screen.getByRole("button", { name: /June 15, 2026/ }));
    expect(within(screen.getByRole("button", { name: /June 5, 2026/ })).getByText("5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /June 5, 2026/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /June 25, 2026/ })).toBeDisabled();
  });
});
