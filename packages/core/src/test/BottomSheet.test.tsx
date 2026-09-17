import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BottomSheet } from "../components/BottomSheet";
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

describe("BottomSheet", () => {
  it("renders as a drawer fixed to the bottom, with its own data-rebar-component", () => {
    render(
      <BottomSheet open title="Share">
        Sharing options
      </BottomSheet>,
    );
    const sheet = screen.getByRole("dialog", { name: "Share" });
    expect(sheet).toHaveAttribute("data-rebar-component", "bottom-sheet");
    expect(sheet).toHaveAttribute("data-rebar-side", "bottom");
    expect(sheet).toHaveClass("rebar-drawer-content-bottom");
  });

  it("renders the visible pill as aria-hidden (a real, functional drag-handle wrapper sits around it)", () => {
    render(
      <BottomSheet open title="Share">
        Sharing options
      </BottomSheet>,
    );
    const handle = document.querySelector('[data-rebar-part="handle"]');
    expect(handle).not.toBeNull();
    expect(handle).toHaveAttribute("aria-hidden", "true");
    expect(handle?.tagName).not.toBe("BUTTON");
    expect(document.querySelector('[data-rebar-part="drag-handle"]')).toBeInTheDocument();
  });

  it("dragging the handle down past ~25% of the sheet's height dismisses it", () => {
    const onOpenChange = vi.fn();
    render(
      <BottomSheet open onOpenChange={onOpenChange} title="Share">
        Sharing options
      </BottomSheet>,
    );
    const dragHandle = document.querySelector('[data-rebar-part="drag-handle"]') as HTMLElement;

    act(() => {
      dragHandle.dispatchEvent(new FakePointerEvent("pointerdown", { bubbles: true, clientY: 100, pointerId: 1, button: 0 }));
      // Default size is 360, so 25% is 90px — 150px comfortably clears the threshold.
      window.dispatchEvent(new FakePointerEvent("pointermove", { clientY: 250, pointerId: 1 }));
      window.dispatchEvent(new FakePointerEvent("pointerup", { clientY: 250, pointerId: 1 }));
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("dragging the handle only a little snaps back without dismissing it", () => {
    const onOpenChange = vi.fn();
    render(
      <BottomSheet open onOpenChange={onOpenChange} title="Share">
        Sharing options
      </BottomSheet>,
    );
    const dragHandle = document.querySelector('[data-rebar-part="drag-handle"]') as HTMLElement;

    act(() => {
      dragHandle.dispatchEvent(new FakePointerEvent("pointerdown", { bubbles: true, clientY: 100, pointerId: 1, button: 0 }));
      window.dispatchEvent(new FakePointerEvent("pointermove", { clientY: 120, pointerId: 1 }));
      window.dispatchEvent(new FakePointerEvent("pointerup", { clientY: 120, pointerId: 1 }));
    });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Share" })).toBeInTheDocument();
  });

  it("dismisses via the close button, not just the (non-functional) handle", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <BottomSheet open onOpenChange={onOpenChange} title="Share">
        Sharing options
      </BottomSheet>,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("opens via its trigger and closes on Escape (controlled)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <BottomSheet
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            onOpenChange(next);
          }}
          trigger={<Button>Open</Button>}
          title="Share"
        >
          Sharing options
        </BottomSheet>
      );
    }

    render(<Controlled />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog", { name: "Share" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("works uncontrolled via defaultOpen", () => {
    render(
      <BottomSheet defaultOpen title="Share">
        Sharing options
      </BottomSheet>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
