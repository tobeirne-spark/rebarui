import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DatePicker } from "../components/DatePicker";

describe("DatePicker", () => {
  it("renders three bounded numeric fields showing the given date", () => {
    render(<DatePicker defaultValue={new Date(2026, 5, 15)} />);
    expect(screen.getByRole("textbox", { name: "Day" })).toHaveValue("15");
    expect(screen.getByRole("textbox", { name: "Month" })).toHaveValue("6");
    expect(screen.getByRole("textbox", { name: "Year" })).toHaveValue("2026");
  });

  it("defaults to today when no value/defaultValue is given", () => {
    const today = new Date();
    render(<DatePicker />);
    expect(screen.getByRole("textbox", { name: "Day" })).toHaveValue(String(today.getDate()));
    expect(screen.getByRole("textbox", { name: "Year" })).toHaveValue(String(today.getFullYear()));
  });

  it("carries the expected data-rebar-component and data-rebar-part attributes", () => {
    const { container } = render(<DatePicker defaultValue={new Date(2026, 5, 15)} />);
    expect(container.querySelector('[data-rebar-component="date-picker"]')).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-part="day"]')).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-part="month"]')).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-part="year"]')).toBeInTheDocument();
  });

  it("fires onValueChange with a full Date when the day field's stepper is used", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker defaultValue={new Date(2026, 5, 15)} onValueChange={onValueChange} />);
    await user.click(screen.getAllByRole("button", { name: "Increase" })[0]!);
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 5, 16));
  });

  it("clamps the day field's own max to the actual days in the selected month", () => {
    render(<DatePicker defaultValue={new Date(2026, 1, 1)} />);
    // February 2026 (not a leap year) has 28 days.
    expect(screen.getByRole("textbox", { name: "Day" })).toHaveAttribute(
      "aria-label",
      "Day",
    );
    const day = screen.getByRole("textbox", { name: "Day" }) as HTMLInputElement;
    expect(day).not.toBeDisabled();
  });

  it("re-clamps day when switching from a 31-day month to a 30-day month", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker defaultValue={new Date(2026, 0, 31)} onValueChange={onValueChange} />);
    // January 31 -> increment month to February: no real 31st in Feb 2026 (28 days), so the
    // committed date's day must be clamped down rather than silently overflowing into March.
    await user.click(screen.getAllByRole("button", { name: "Increase" })[1]!);
    const committed = onValueChange.mock.calls[0]?.[0] as Date;
    expect(committed.getMonth()).toBe(1);
    expect(committed.getDate()).toBe(28);
  });

  it("does not self-manage state when value is controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker value={new Date(2026, 5, 15)} onValueChange={onValueChange} />);
    await user.click(screen.getAllByRole("button", { name: "Increase" })[0]!);
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 5, 16));
    // Field still shows the caller's own unchanged value, since it was never fed back in.
    expect(screen.getByRole("textbox", { name: "Day" })).toHaveValue("15");
  });

  it("clamps the committed date to minDate/maxDate once a full year is typed", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DatePicker
        defaultValue={new Date(2026, 5, 15)}
        minDate={new Date(2020, 0, 1)}
        maxDate={new Date(2030, 11, 31)}
        onValueChange={onValueChange}
      />,
    );
    const year = screen.getByRole("textbox", { name: "Year" });
    await user.clear(year);
    await user.type(year, "2099");
    const committed = onValueChange.mock.calls.at(-1)?.[0] as Date;
    expect(committed.getFullYear()).toBe(2030);
  });

  it("does not clamp a partial (implausible, sub-1000) typed year mid-keystroke", async () => {
    // Regression test for a real usability bug: clamping every keystroke of a multi-digit year
    // straight to a far-away bound (e.g. 1906) would overwrite the field back to that bound after
    // the very first digit, making it impossible to type a year one digit at a time.
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker defaultValue={new Date(2026, 5, 15)} onValueChange={onValueChange} />);
    const year = screen.getByRole("textbox", { name: "Year" });
    await user.clear(year);
    await user.type(year, "1");
    expect(year).toHaveValue("1");
  });

  it("disables the day/month decrement steppers at their own min", () => {
    render(<DatePicker defaultValue={new Date(2026, 0, 1)} />);
    const decrements = screen.getAllByRole("button", { name: "Decrease" });
    // Day is at 1 (its own min) and Month is at 1 (its own min) — both decrements disabled.
    expect(decrements[0]).toBeDisabled();
    expect(decrements[1]).toBeDisabled();
  });

  it("disables inputs when disabled is set", () => {
    render(<DatePicker defaultValue={new Date(2026, 5, 15)} disabled />);
    expect(screen.getByRole("textbox", { name: "Day" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Month" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Year" })).toBeDisabled();
  });
});
