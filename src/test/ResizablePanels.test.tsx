import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResizablePanels } from "../components/ResizablePanels";

afterEach(cleanup);

// jsdom doesn't implement a real `PointerEvent` constructor in every version this project's CI
// runs against — a minimal, local stand-in (MouseEvent plus the two pointer-specific fields this
// component's handlers actually read) rather than a global polyfill in setup.ts, since this is
// the only test file in the suite that needs to construct one directly.
class FakePointerEvent extends MouseEvent {
  pointerId: number;
  pointerType: string;
  constructor(type: string, params: MouseEventInit & { pointerId?: number; pointerType?: string } = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 0;
    this.pointerType = params.pointerType ?? "mouse";
  }
}

describe("ResizablePanels", () => {
  it("renders a real separator role carrying the current split as aria-valuenow", () => {
    render(<ResizablePanels first={<div>Left</div>} second={<div>Right</div>} defaultSplit={0.5} />);
    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("aria-valuenow", "50");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
  });

  it("adjusts the split via ArrowRight/ArrowLeft when horizontal, and calls onSplitChange", async () => {
    const user = userEvent.setup();
    const onSplitChange = vi.fn();
    render(
      <ResizablePanels
        first={<div>Left</div>}
        second={<div>Right</div>}
        defaultSplit={0.5}
        onSplitChange={onSplitChange}
      />,
    );

    const separator = screen.getByRole("separator");
    separator.focus();
    await user.keyboard("{ArrowRight}");

    expect(onSplitChange).toHaveBeenCalledWith(0.52);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-valuenow", "52");

    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    // 0.52 - 0.02 - 0.02 = 0.48.
    expect(onSplitChange).toHaveBeenLastCalledWith(0.48);
  });

  it("adjusts the split via ArrowUp/ArrowDown when vertical", async () => {
    const user = userEvent.setup();
    const onSplitChange = vi.fn();
    render(
      <ResizablePanels
        direction="vertical"
        first={<div>Top</div>}
        second={<div>Bottom</div>}
        defaultSplit={0.5}
        onSplitChange={onSplitChange}
      />,
    );

    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("aria-orientation", "horizontal");
    separator.focus();
    await user.keyboard("{ArrowDown}");

    expect(onSplitChange).toHaveBeenCalledWith(0.52);
  });

  it("clamps keyboard resizing to minSplit/maxSplit", async () => {
    const user = userEvent.setup();
    const onSplitChange = vi.fn();
    render(
      <ResizablePanels
        first={<div>Left</div>}
        second={<div>Right</div>}
        defaultSplit={0.11}
        minSplit={0.1}
        maxSplit={0.9}
        onSplitChange={onSplitChange}
      />,
    );

    const separator = screen.getByRole("separator");
    separator.focus();
    // Two presses of a 0.02 step would go below minSplit (0.1) without clamping.
    await user.keyboard("{ArrowLeft}{ArrowLeft}");

    expect(onSplitChange).toHaveBeenLastCalledWith(0.1);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-valuenow", "10");
  });

  it("clamps a controlled split prop that's out of range", () => {
    render(
      <ResizablePanels
        first={<div>Left</div>}
        second={<div>Right</div>}
        split={0.99}
        minSplit={0.1}
        maxSplit={0.9}
      />,
    );
    expect(screen.getByRole("separator")).toHaveAttribute("aria-valuenow", "90");
  });

  it("resizes on pointer drag", () => {
    const onSplitChange = vi.fn();
    render(
      <ResizablePanels
        first={<div>Left</div>}
        second={<div>Right</div>}
        defaultSplit={0.5}
        onSplitChange={onSplitChange}
      />,
    );

    const container = screen.getByRole("separator").closest('[data-rebar-component="resizable-panels"]')!;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: 400,
      bottom: 200,
      width: 400,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    const separator = screen.getByRole("separator");
    act(() => {
      separator.dispatchEvent(
        new FakePointerEvent("pointerdown", { bubbles: true, clientX: 200, clientY: 100, pointerId: 1, button: 0 }),
      );
      window.dispatchEvent(new FakePointerEvent("pointermove", { clientX: 300, clientY: 100, pointerId: 1 }));
      window.dispatchEvent(new FakePointerEvent("pointerup", { clientX: 300, clientY: 100, pointerId: 1 }));
    });

    expect(onSplitChange).toHaveBeenCalledWith(0.75);
  });

  it("carries data-rebar-component and forwards data-testid", () => {
    render(
      <ResizablePanels
        first={<div>Left</div>}
        second={<div>Right</div>}
        data-testid="split-view"
      />,
    );
    expect(screen.getByTestId("split-view")).toHaveAttribute("data-rebar-component", "resizable-panels");
  });
});
