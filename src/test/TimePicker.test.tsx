import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { TimePicker } from "../components/TimePicker";

describe("TimePicker", () => {
  it("carries data-rebar-component and shows the formatted 12h trigger label", () => {
    render(<TimePicker defaultValue="14:30" />);
    const trigger = screen.getByRole("button", { name: /2:30 PM/ });
    expect(trigger).toHaveAttribute("data-rebar-component", "time-picker");
    expect(trigger).toHaveTextContent("2:30 PM");
  });

  it("defaults to 12h format and shows an AM/PM toggle", async () => {
    const user = userEvent.setup();
    render(<TimePicker defaultValue="09:00" />);
    await user.click(screen.getByRole("button", { name: /9:00 AM/ }));
    expect(screen.getByRole("button", { name: "AM" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PM" })).toBeInTheDocument();
  });

  it("picking an hour then a minute updates the value uncontrolled, keeping the popover open across both picks", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker defaultValue="00:00" onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: /12:00 AM/ }));
    const hours = within(screen.getByRole("listbox", { name: "Hour" }));
    const minutes = within(screen.getByRole("listbox", { name: "Minute" }));

    await user.click(hours.getByRole("option", { name: "2" }));
    expect(onValueChange).toHaveBeenLastCalledWith("02:00");

    // Popover is still open and usable for the second pick.
    await user.click(minutes.getByRole("option", { name: "05" }));
    expect(onValueChange).toHaveBeenLastCalledWith("02:05");

    expect(screen.getByRole("button", { name: /2:05 AM/ })).toBeInTheDocument();
  });

  it("toggling PM recomputes the 24h value from the current displayed hour", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker defaultValue="02:05" onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: /2:05 AM/ }));
    await user.click(screen.getByRole("button", { name: "PM" }));

    expect(onValueChange).toHaveBeenCalledWith("14:05");
  });

  it("supports controlled value — trigger reflects the prop, not internal state", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker value="03:00" onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: /3:00 AM/ }));
    const hours = within(screen.getByRole("listbox", { name: "Hour" }));
    await user.click(hours.getByRole("option", { name: "5" }));

    expect(onValueChange).toHaveBeenCalledWith("05:00");
    // Value prop never changed, so the trigger still reads the original time.
    expect(screen.getByRole("button", { name: /3:00 AM/ })).toBeInTheDocument();
  });

  it("updates the trigger once a controlled value prop is fed back in", async () => {
    function Controlled() {
      const [value, setValue] = useState("03:00");
      return <TimePicker value={value} onValueChange={setValue} />;
    }
    const user = userEvent.setup();
    render(<Controlled />);

    await user.click(screen.getByRole("button", { name: /3:00 AM/ }));
    const hours = within(screen.getByRole("listbox", { name: "Hour" }));
    await user.click(hours.getByRole("option", { name: "5" }));

    expect(screen.getByRole("button", { name: /5:00 AM/ })).toBeInTheDocument();
  });

  it('renders 24h format with no AM/PM toggle and zero-padded, 0-23 hour values', async () => {
    const user = userEvent.setup();
    render(<TimePicker defaultValue="14:05" format="24h" />);

    expect(screen.getByRole("button", { name: /14:05/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /14:05/ }));

    const hours = within(screen.getByRole("listbox", { name: "Hour" }));
    expect(hours.getAllByRole("option")).toHaveLength(24);
    expect(hours.getByRole("option", { name: "00" })).toBeInTheDocument();
    expect(hours.getByRole("option", { name: "23" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "AM" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "PM" })).not.toBeInTheDocument();
  });

  it("minuteStep limits which minute values appear", async () => {
    const user = userEvent.setup();
    render(<TimePicker defaultValue="09:00" minuteStep={15} />);
    await user.click(screen.getByRole("button", { name: /9:00 AM/ }));

    const minutes = within(screen.getByRole("listbox", { name: "Minute" }));
    const options = minutes.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["00", "15", "30", "45"]);
  });
});
