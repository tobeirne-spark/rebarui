import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PullToRefresh } from "../components/PullToRefresh";

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

function getScrollContainer() {
  return screen.getByTestId("scroll").closest('[data-rebar-part="scroll-container"]') as HTMLElement;
}

describe("PullToRefresh", () => {
  it("carries data-rebar-component and renders children", () => {
    render(
      <PullToRefresh onRefresh={() => {}}>
        <div data-testid="scroll">Content</div>
      </PullToRefresh>,
    );
    expect(screen.getByTestId("scroll")).toBeInTheDocument();
    expect(getScrollContainer().closest('[data-rebar-component="pull-to-refresh"]')).toBeTruthy();
  });

  it("has a genuine non-gesture fallback: an always-visible Refresh button that calls onRefresh", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(
      <PullToRefresh onRefresh={onRefresh}>
        <div data-testid="scroll">Content</div>
      </PullToRefresh>,
    );

    const button = screen.getByRole("button", { name: "Refresh" });
    await user.click(button);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("manages its own internal refreshing state around a Promise-returning onRefresh when uncontrolled", async () => {
    let resolveRefresh: () => void = () => {};
    const onRefresh = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    const user = userEvent.setup();
    render(
      <PullToRefresh onRefresh={onRefresh}>
        <div data-testid="scroll">Content</div>
      </PullToRefresh>,
    );

    const button = screen.getByRole("button", { name: "Refresh" });
    await user.click(button);

    expect(screen.getByRole("button", { name: "Refreshing" })).toBeDisabled();

    await act(async () => {
      resolveRefresh();
      await Promise.resolve();
    });

    expect(screen.getByRole("button", { name: "Refresh" })).not.toBeDisabled();
  });

  it("triggers a refresh when dragging down past the threshold from scrollTop 0", () => {
    const onRefresh = vi.fn();
    render(
      <PullToRefresh onRefresh={onRefresh} threshold={60}>
        <div data-testid="scroll">Content</div>
      </PullToRefresh>,
    );

    const container = getScrollContainer();
    container.scrollTop = 0;

    act(() => {
      container.dispatchEvent(
        new FakePointerEvent("pointerdown", { bubbles: true, clientY: 0, pointerId: 1, button: 0 }),
      );
      window.dispatchEvent(new FakePointerEvent("pointermove", { clientY: 80, pointerId: 1 }));
      window.dispatchEvent(new FakePointerEvent("pointerup", { clientY: 80, pointerId: 1 }));
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("does not track the pull gesture when the scroll container isn't at scrollTop 0", () => {
    const onRefresh = vi.fn();
    render(
      <PullToRefresh onRefresh={onRefresh} threshold={60}>
        <div data-testid="scroll">Content</div>
      </PullToRefresh>,
    );

    const container = getScrollContainer();
    container.scrollTop = 40;

    act(() => {
      container.dispatchEvent(
        new FakePointerEvent("pointerdown", { bubbles: true, clientY: 0, pointerId: 1, button: 0 }),
      );
      window.dispatchEvent(new FakePointerEvent("pointermove", { clientY: 80, pointerId: 1 }));
      window.dispatchEvent(new FakePointerEvent("pointerup", { clientY: 80, pointerId: 1 }));
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("does not trigger a refresh when released before the threshold", () => {
    const onRefresh = vi.fn();
    render(
      <PullToRefresh onRefresh={onRefresh} threshold={60}>
        <div data-testid="scroll">Content</div>
      </PullToRefresh>,
    );

    const container = getScrollContainer();
    container.scrollTop = 0;

    act(() => {
      container.dispatchEvent(
        new FakePointerEvent("pointerdown", { bubbles: true, clientY: 0, pointerId: 1, button: 0 }),
      );
      window.dispatchEvent(new FakePointerEvent("pointermove", { clientY: 20, pointerId: 1 }));
      window.dispatchEvent(new FakePointerEvent("pointerup", { clientY: 20, pointerId: 1 }));
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("shows a spinner and disables the fallback button when controlled refreshing=true", () => {
    render(
      <PullToRefresh onRefresh={() => {}} refreshing>
        <div data-testid="scroll">Content</div>
      </PullToRefresh>,
    );
    expect(screen.getByRole("button", { name: "Refreshing" })).toBeDisabled();
  });
});
