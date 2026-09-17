import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionSheet } from "../components/ActionSheet";
import { Button } from "../components/Button";

// jsdom doesn't implement a real `PointerEvent` constructor in every version this project's CI
// runs against — a minimal, local stand-in, the same technique NodeLinkGraph.test.tsx uses.
class FakePointerEvent extends MouseEvent {
  pointerId: number;
  pointerType: string;
  constructor(type: string, params: MouseEventInit & { pointerId?: number; pointerType?: string } = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 0;
    this.pointerType = params.pointerType ?? "mouse";
  }
}

const ACTIONS = [
  { label: "Share" },
  { label: "Rename" },
  { label: "Delete", destructive: true },
];

describe("ActionSheet", () => {
  it("renders each action as a real button, plus a separate Cancel button", () => {
    render(<ActionSheet open actions={ACTIONS} />);
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rename" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("supports a custom cancel label", () => {
    render(<ActionSheet open actions={ACTIONS} cancelLabel="Dismiss" />);
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("marks a destructive action visually distinct via its own class", () => {
    render(<ActionSheet open actions={ACTIONS} />);
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
      "rebar-action-sheet-item-destructive",
    );
    expect(screen.getByRole("button", { name: "Share" })).not.toHaveClass(
      "rebar-action-sheet-item-destructive",
    );
  });

  it("fires onSelect and closes the sheet when an action is chosen", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ActionSheet
        open
        onOpenChange={onOpenChange}
        actions={[{ label: "Share", onSelect }]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Share" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes the sheet when Cancel is chosen, without calling any action's onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ActionSheet
        open
        onOpenChange={onOpenChange}
        actions={[{ label: "Share", onSelect }]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("opens via its trigger, uncontrolled", async () => {
    const user = userEvent.setup();
    render(<ActionSheet trigger={<Button>Actions</Button>} actions={ACTIONS} title="Choose an action" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("dialog", { name: "Choose an action" })).toBeInTheDocument();
  });

  it("renders the visible pill as aria-hidden, same as BottomSheet", () => {
    render(<ActionSheet open actions={ACTIONS} />);
    const handle = document.querySelector('[data-rebar-part="handle"]');
    expect(handle).not.toBeNull();
    expect(handle).toHaveAttribute("aria-hidden", "true");
  });

  it("dragging the handle down past ~25% of the sheet's height dismisses it, same as BottomSheet", () => {
    const onOpenChange = vi.fn();
    render(<ActionSheet open onOpenChange={onOpenChange} actions={ACTIONS} />);
    const dragHandle = document.querySelector('[data-rebar-part="drag-handle"]') as HTMLElement;

    act(() => {
      dragHandle.dispatchEvent(new FakePointerEvent("pointerdown", { bubbles: true, clientY: 100, pointerId: 1, button: 0 }));
      window.dispatchEvent(new FakePointerEvent("pointermove", { clientY: 250, pointerId: 1 }));
      window.dispatchEvent(new FakePointerEvent("pointerup", { clientY: 250, pointerId: 1 }));
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
