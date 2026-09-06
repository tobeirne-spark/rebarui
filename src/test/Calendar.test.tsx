import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Calendar } from "../components/Calendar";

const SEPT_2026 = new Date(2026, 8, 1); // September 2026

describe("Calendar", () => {
  it("carries data-rebar-component on the root and renders the displayed month label", () => {
    render(<Calendar month={SEPT_2026} />);
    const root = screen.getByText("September 2026").closest('[data-rebar-component="calendar"]');
    expect(root).not.toBeNull();
  });

  it("renders 42 real, focusable day-cell buttons", () => {
    const { container } = render(<Calendar month={SEPT_2026} />);
    const dayButtons = container.querySelectorAll('[data-rebar-part="day"]');
    expect(dayButtons).toHaveLength(42);
    dayButtons.forEach((button) => expect(button.tagName).toBe("BUTTON"));
  });

  it("navigates to the next/previous month uncontrolled", async () => {
    const user = userEvent.setup();
    render(<Calendar defaultMonth={SEPT_2026} />);
    expect(screen.getByText("September 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("October 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous month" }));
    await user.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByText("August 2026")).toBeInTheDocument();
  });

  it("calls onMonthChange and stays put when month is controlled", async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(<Calendar month={SEPT_2026} onMonthChange={onMonthChange} />);

    await user.click(screen.getByRole("button", { name: "Next month" }));

    expect(onMonthChange).toHaveBeenCalledTimes(1);
    const [nextMonth] = onMonthChange.mock.calls[0]!;
    expect((nextMonth as Date).getMonth()).toBe(9); // October
    // Still showing September — the parent never fed the new month back in.
    expect(screen.getByText("September 2026")).toBeInTheDocument();
  });

  it("updates the displayed month when a controlled month prop changes", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [month, setMonth] = useState(SEPT_2026);
      return (
        <>
          <button onClick={() => setMonth(new Date(2026, 9, 1))}>jump to october</button>
          <Calendar month={month} onMonthChange={setMonth} />
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByText("September 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "jump to october" }));
    expect(screen.getByText("October 2026")).toBeInTheDocument();
  });

  it("fires onValueChange with the clicked date, uncontrolled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Calendar month={SEPT_2026} onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: "September 15, 2026" }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    const [picked] = onValueChange.mock.calls[0]! as [Date];
    expect(picked.getFullYear()).toBe(2026);
    expect(picked.getMonth()).toBe(8);
    expect(picked.getDate()).toBe(15);
  });

  it("marks the selected day distinctly when value is controlled", () => {
    render(<Calendar month={SEPT_2026} value={new Date(2026, 8, 15)} />);
    const day15 = screen.getByRole("button", { name: "September 15, 2026" });
    expect(day15).toHaveAttribute("data-rebar-selected", "true");
    const day16 = screen.getByRole("button", { name: "September 16, 2026" });
    expect(day16).not.toHaveAttribute("data-rebar-selected");
  });

  it("disables and blocks clicks on days outside minDate/maxDate", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Calendar
        month={SEPT_2026}
        onValueChange={onValueChange}
        minDate={new Date(2026, 8, 10)}
        maxDate={new Date(2026, 8, 20)}
      />,
    );

    const tooEarly = screen.getByRole("button", { name: "September 5, 2026" });
    const tooLate = screen.getByRole("button", { name: "September 25, 2026" });
    const inRange = screen.getByRole("button", { name: "September 15, 2026" });

    expect(tooEarly).toBeDisabled();
    expect(tooLate).toBeDisabled();
    expect(inRange).not.toBeDisabled();

    await user.click(tooEarly);
    expect(onValueChange).not.toHaveBeenCalled();

    await user.click(inRange);
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("renders leading/trailing days from adjacent months as disabled and dimmed, not clickable", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Calendar month={SEPT_2026} onValueChange={onValueChange} />);

    // September 1, 2026 is a Tuesday, so August 31 (last day of prior month) is a leading cell.
    const leadingDay = screen.getByRole("button", { name: "August 31, 2026" });
    expect(leadingDay).toBeDisabled();
    expect(leadingDay).toHaveAttribute("data-rebar-outside", "true");

    await user.click(leadingDay);
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
