import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PickerWheel } from "../components/PickerWheel";

afterEach(cleanup);

// jsdom doesn't implement a real `PointerEvent` constructor in every version this project's CI
// runs against — a minimal, local stand-in (MouseEvent plus the two pointer-specific fields this
// component's handlers actually read), same technique `ResizablePanels.test.tsx` uses.
class FakePointerEvent extends MouseEvent {
  pointerId: number;
  pointerType: string;
  constructor(type: string, params: MouseEventInit & { pointerId?: number; pointerType?: string } = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 0;
    this.pointerType = params.pointerType ?? "mouse";
  }
}

const OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

describe("PickerWheel", () => {
  it("carries data-rebar-component and a real listbox/option ARIA structure", () => {
    render(<PickerWheel options={OPTIONS} defaultValue="Wed" />);
    const listbox = screen.getByRole("listbox");
    expect(listbox.closest('[data-rebar-component="picker-wheel"]')).toBeTruthy();
    expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length);
    expect(screen.getByRole("option", { name: "Wed" })).toHaveAttribute("aria-selected", "true");
  });

  it("every option button is a real >=44px touch target by default", () => {
    render(<PickerWheel options={OPTIONS} defaultValue="Wed" />);
    for (const option of screen.getAllByRole("option")) {
      expect(option.style.height).toBe("44px");
    }
  });

  it("has a genuine non-drag fallback: clicking a non-centered option selects and centers it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<PickerWheel options={OPTIONS} defaultValue="Wed" onValueChange={onValueChange} />);

    await user.click(screen.getByRole("option", { name: "Fri" }));

    expect(onValueChange).toHaveBeenCalledWith("Fri");
    expect(screen.getByRole("option", { name: "Fri" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "Wed" })).toHaveAttribute("aria-selected", "false");
  });

  it("supports uncontrolled usage via defaultValue, reflecting picks without a value prop", async () => {
    const user = userEvent.setup();
    render(<PickerWheel options={OPTIONS} defaultValue="Mon" />);
    await user.click(screen.getByRole("option", { name: "Sun" }));
    expect(screen.getByRole("option", { name: "Sun" })).toHaveAttribute("aria-selected", "true");
  });

  it("is a real controlled component when value is supplied", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<PickerWheel options={OPTIONS} value="Mon" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("option", { name: "Sun" }));
    // Controlled: the displayed selection doesn't change until the caller feeds the new value back.
    expect(onValueChange).toHaveBeenCalledWith("Sun");
    expect(screen.getByRole("option", { name: "Mon" })).toHaveAttribute("aria-selected", "true");
  });

  it("adjusts the selection via a real onWheel event", () => {
    const onValueChange = vi.fn();
    render(<PickerWheel options={OPTIONS} defaultValue="Wed" onValueChange={onValueChange} />);
    const listbox = screen.getByRole("listbox");
    act(() => {
      listbox.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 100 }));
    });
    expect(onValueChange).toHaveBeenCalledWith("Thu");
  });

  it("adjusts the selection via ArrowUp/ArrowDown keyboard input", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<PickerWheel options={OPTIONS} defaultValue="Wed" onValueChange={onValueChange} />);
    screen.getByRole("listbox").focus();
    await user.keyboard("{ArrowDown}");
    expect(onValueChange).toHaveBeenCalledWith("Thu");
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(onValueChange).toHaveBeenLastCalledWith("Tue");
  });

  it("snaps to the nearest option on pointer drag release", () => {
    const onValueChange = vi.fn();
    render(<PickerWheel options={OPTIONS} defaultValue="Wed" itemHeight={44} onValueChange={onValueChange} />);
    const listbox = screen.getByRole("listbox");

    act(() => {
      listbox.dispatchEvent(
        new FakePointerEvent("pointerdown", { bubbles: true, clientY: 0, pointerId: 1, button: 0 }),
      );
      // Dragging up by ~2 rows should move the selection down (later) by 2 options.
      window.dispatchEvent(new FakePointerEvent("pointermove", { clientY: -88, pointerId: 1 }));
      window.dispatchEvent(new FakePointerEvent("pointerup", { clientY: -88, pointerId: 1 }));
    });

    expect(onValueChange).toHaveBeenCalledWith("Fri");
  });
});
