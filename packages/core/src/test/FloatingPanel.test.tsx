import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloatingPanel } from "../components/FloatingPanel";
import type { FloatingPanelRef } from "../components/FloatingPanel";

afterEach(cleanup);

describe("FloatingPanel", () => {
  it("starts at defaultHeight, exposing it as a real, keyboard-operable slider", () => {
    render(
      <FloatingPanel anchors={[100, 300, 600]} defaultHeight={300}>
        Content
      </FloatingPanel>,
    );
    const handle = screen.getByRole("slider", { name: "Resize panel" });
    expect(handle).toHaveAttribute("aria-valuenow", "300");
    expect(handle).toHaveAttribute("aria-valuemin", "100");
    expect(handle).toHaveAttribute("aria-valuemax", "600");
  });

  it("defaults to the smallest anchor when no defaultHeight is given", () => {
    render(<FloatingPanel anchors={[600, 100, 300]}>Content</FloatingPanel>);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "100");
  });

  it("ArrowUp/ArrowDown jump between anchors (placement='bottom' default: up grows, down shrinks)", async () => {
    const user = userEvent.setup();
    render(
      <FloatingPanel anchors={[100, 300, 600]} defaultHeight={300}>
        Content
      </FloatingPanel>,
    );
    const handle = screen.getByRole("slider");
    handle.focus();
    await user.keyboard("{ArrowUp}");
    expect(handle).toHaveAttribute("aria-valuenow", "600");
    await user.keyboard("{ArrowDown}");
    expect(handle).toHaveAttribute("aria-valuenow", "300");
    await user.keyboard("{ArrowDown}");
    expect(handle).toHaveAttribute("aria-valuenow", "100");
  });

  it("placement='top' flips the arrow-key direction (down grows, up shrinks)", async () => {
    const user = userEvent.setup();
    render(
      <FloatingPanel anchors={[100, 300, 600]} defaultHeight={300} placement="top">
        Content
      </FloatingPanel>,
    );
    const handle = screen.getByRole("slider");
    handle.focus();
    await user.keyboard("{ArrowDown}");
    expect(handle).toHaveAttribute("aria-valuenow", "600");
    await user.keyboard("{ArrowUp}");
    await user.keyboard("{ArrowUp}");
    expect(handle).toHaveAttribute("aria-valuenow", "100");
  });

  it("Home/End jump straight to the min/max anchor", async () => {
    const user = userEvent.setup();
    render(
      <FloatingPanel anchors={[100, 300, 600]} defaultHeight={300}>
        Content
      </FloatingPanel>,
    );
    const handle = screen.getByRole("slider");
    handle.focus();
    await user.keyboard("{End}");
    expect(handle).toHaveAttribute("aria-valuenow", "600");
    await user.keyboard("{Home}");
    expect(handle).toHaveAttribute("aria-valuenow", "100");
  });

  it("is controlled via height/onHeightChange when both are passed", async () => {
    const user = userEvent.setup();
    const onHeightChange = vi.fn();
    render(
      <FloatingPanel anchors={[100, 300, 600]} height={300} onHeightChange={onHeightChange}>
        Content
      </FloatingPanel>,
    );
    const handle = screen.getByRole("slider");
    handle.focus();
    await user.keyboard("{ArrowUp}");
    expect(onHeightChange).toHaveBeenCalledWith(600, true);
    // Still 300 — the caller hasn't fed the new height back in via the `height` prop yet.
    expect(handle).toHaveAttribute("aria-valuenow", "300");
  });

  it("exposes an imperative setHeight via ref", () => {
    const ref = createRef<FloatingPanelRef>();
    render(
      <FloatingPanel ref={ref} anchors={[100, 300, 600]} defaultHeight={100}>
        Content
      </FloatingPanel>,
    );
    act(() => {
      ref.current?.setHeight(600, { immediate: true });
    });
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "600");
  });

  it("dispatching pointer events on the handle does not throw, even without real PointerEvent support in jsdom", () => {
    render(
      <FloatingPanel anchors={[100, 300, 600]} defaultHeight={300}>
        Content
      </FloatingPanel>,
    );
    const handle = screen.getByRole("slider");
    expect(() => {
      fireEvent.pointerDown(handle, { pointerId: 1, clientY: 300 });
      fireEvent.pointerMove(window, { pointerId: 1, clientY: 100 });
      fireEvent.pointerUp(window, { pointerId: 1, clientY: 100 });
    }).not.toThrow();
  });
});
