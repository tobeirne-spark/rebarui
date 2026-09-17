import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpeedDial } from "../components/SpeedDial";

const ACTIONS = [
  { label: "Edit", onSelect: vi.fn() },
  { label: "Share", onSelect: vi.fn() },
  { label: "Delete", onSelect: vi.fn() },
];

describe("SpeedDial", () => {
  it("does not render actions until opened, uncontrolled", async () => {
    const user = userEvent.setup();
    render(<SpeedDial actions={ACTIONS} />);
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open actions" }));
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("reveals every action as a real, labeled button when the main button is clicked", async () => {
    const user = userEvent.setup();
    render(<SpeedDial actions={ACTIONS} />);
    await user.click(screen.getByRole("button", { name: "Open actions" }));
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("calls the clicked action's own onSelect and closes the dial", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <SpeedDial
        actions={[{ label: "Edit", onSelect }]}
        defaultOpen
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Uncontrolled (only onOpenChange given, no `open`) — closing is self-managed, so the
    // action button disappears from the DOM.
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("in controlled mode, does not self-manage open state — the caller's `open` stays authoritative", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(<SpeedDial actions={[{ label: "Edit", onSelect }]} open onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Still open — the component never forced it closed itself, only asked via onOpenChange.
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("rotates the trigger's icon 45deg when open (a common SpeedDial convention)", async () => {
    const user = userEvent.setup();
    render(<SpeedDial actions={ACTIONS} />);
    const trigger = screen.getByRole("button", { name: "Open actions" });
    const glyph = trigger.querySelector("span");
    expect(glyph).toHaveStyle({ transform: "rotate(0deg)" });
    await user.click(trigger);
    const openTrigger = screen.getByRole("button", { name: "Close actions" });
    expect(openTrigger.querySelector("span")).toHaveStyle({ transform: "rotate(45deg)" });
  });

  it("defaults to a plain + glyph when no icon is given", () => {
    render(<SpeedDial actions={ACTIONS} />);
    expect(screen.getByRole("button", { name: "Open actions" })).toHaveTextContent("+");
  });

  it("bumps the icon span's font-size when a custom icon is given, but not for the default + glyph", () => {
    const { rerender } = render(<SpeedDial actions={ACTIONS} />);
    const plusGlyph = screen.getByRole("button", { name: "Open actions" }).querySelector("span");
    expect(plusGlyph?.style.fontSize).toBe("");

    rerender(<SpeedDial actions={ACTIONS} icon={<svg width="1em" height="1em" aria-hidden="true" />} />);
    const customGlyph = screen.getByRole("button", { name: "Open actions" }).querySelector("span");
    expect(customGlyph?.style.fontSize).toBe("1.5em");
  });

  it("applies the direction attribute", () => {
    render(<SpeedDial actions={ACTIONS} direction="left" />);
    expect(document.querySelector('[data-rebar-component="speed-dial"]')).toHaveAttribute(
      "data-rebar-direction",
      "left",
    );
  });
});
