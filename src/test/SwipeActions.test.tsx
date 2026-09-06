import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SwipeActions } from "../components/SwipeActions";

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

function mockActionsWidth(width: number) {
  const actions = document.querySelector('[data-rebar-part="actions"]') as HTMLElement;
  vi.spyOn(actions, "getBoundingClientRect").mockReturnValue({
    width,
    height: 44,
    top: 0,
    left: 0,
    right: width,
    bottom: 44,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
}

describe("SwipeActions", () => {
  it("carries data-rebar-component and renders row content plus actions", () => {
    render(
      <SwipeActions actions={[{ label: "Archive", onSelect: () => {} }]}>
        <div data-testid="row">Row content</div>
      </SwipeActions>,
    );
    expect(screen.getByTestId("row")).toBeInTheDocument();
    // hidden: true — the action is inside an aria-hidden container until opened (see the next
    // test), so the default accessible-role query correctly can't see it yet.
    expect(screen.getByRole("button", { name: "Archive", hidden: true })).toBeInTheDocument();
    expect(screen.getByTestId("row").closest('[data-rebar-component="swipe-actions"]')).toBeTruthy();
  });

  it("hides the revealed actions from the accessibility tree until opened", () => {
    render(
      <SwipeActions actions={[{ label: "Archive", onSelect: () => {} }]}>
        <div>Row content</div>
      </SwipeActions>,
    );
    const actions = document.querySelector('[data-rebar-part="actions"]');
    expect(actions).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: "Archive", hidden: true })).toHaveAttribute("tabindex", "-1");
  });

  it("has a genuine non-drag fallback: a 'more actions' toggle button that opens and closes the same state a swipe would", async () => {
    const user = userEvent.setup();
    render(
      <SwipeActions actions={[{ label: "Archive", onSelect: () => {} }]}>
        <div>Row content</div>
      </SwipeActions>,
    );

    const toggle = screen.getByRole("button", { name: "More actions" });
    await user.click(toggle);

    expect(screen.getByRole("button", { name: "Hide actions" })).toHaveAttribute("aria-expanded", "true");
    expect(document.querySelector('[data-rebar-part="actions"]')).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByRole("button", { name: "Archive" })).toHaveAttribute("tabindex", "0");

    await user.click(screen.getByRole("button", { name: "Hide actions" }));
    expect(screen.getByRole("button", { name: "More actions" })).toHaveAttribute("aria-expanded", "false");
  });

  it("calls onSelect and closes when a revealed action is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <SwipeActions actions={[{ label: "Delete", onSelect, destructive: true }]}>
        <div>Row content</div>
      </SwipeActions>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "More actions" })).toHaveAttribute("aria-expanded", "false");
  });

  it("snaps fully open when released past ~40% of the actions' total width", () => {
    render(
      <SwipeActions actions={[{ label: "Archive", onSelect: () => {} }]}>
        <div data-testid="row">Row content</div>
      </SwipeActions>,
    );
    mockActionsWidth(100);
    const content = document.querySelector('[data-rebar-part="content"]') as HTMLElement;

    act(() => {
      content.dispatchEvent(
        new FakePointerEvent("pointerdown", { bubbles: true, clientX: 0, pointerId: 1, button: 0 }),
      );
      window.dispatchEvent(new FakePointerEvent("pointermove", { clientX: -50, pointerId: 1 }));
      window.dispatchEvent(new FakePointerEvent("pointerup", { clientX: -50, pointerId: 1 }));
    });

    expect(screen.getByRole("button", { name: "Hide actions" })).toHaveAttribute("aria-expanded", "true");
  });

  it("springs back closed when released before the ~40% threshold", () => {
    render(
      <SwipeActions actions={[{ label: "Archive", onSelect: () => {} }]}>
        <div data-testid="row">Row content</div>
      </SwipeActions>,
    );
    mockActionsWidth(100);
    const content = document.querySelector('[data-rebar-part="content"]') as HTMLElement;

    act(() => {
      content.dispatchEvent(
        new FakePointerEvent("pointerdown", { bubbles: true, clientX: 0, pointerId: 1, button: 0 }),
      );
      window.dispatchEvent(new FakePointerEvent("pointermove", { clientX: -20, pointerId: 1 }));
      window.dispatchEvent(new FakePointerEvent("pointerup", { clientX: -20, pointerId: 1 }));
    });

    expect(screen.getByRole("button", { name: "More actions" })).toHaveAttribute("aria-expanded", "false");
  });

  it("disables the toggle and every action, and ignores drag, when disabled", async () => {
    const user = userEvent.setup();
    render(
      <SwipeActions actions={[{ label: "Archive", onSelect: () => {} }]} disabled>
        <div>Row content</div>
      </SwipeActions>,
    );
    expect(screen.getByRole("button", { name: "More actions" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Archive", hidden: true })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "More actions" }));
    expect(document.querySelector('[data-rebar-part="actions"]')).toHaveAttribute("aria-hidden", "true");
  });
});
