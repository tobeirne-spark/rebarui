import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloatingBubble } from "../components/FloatingBubble";

afterEach(cleanup);

describe("FloatingBubble", () => {
  it("renders as a real, focusable button", () => {
    render(<FloatingBubble>+</FloatingBubble>);
    expect(screen.getByRole("button", { name: "+" })).toBeInTheDocument();
  });

  it("fires onClick on a plain click (no drag)", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<FloatingBubble onClick={onClick}>+</FloatingBubble>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is keyboard-activatable regardless of drag support — Enter/Space always work", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<FloatingBubble onClick={onClick}>+</FloatingBubble>);
    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("reflects the given offset (controlled) as a translate() transform", () => {
    render(<FloatingBubble offset={{ x: 10, y: 20 }}>+</FloatingBubble>);
    expect(screen.getByRole("button")).toHaveStyle({ transform: "translate(10px, 20px)" });
  });

  it("defaults to defaultOffset when uncontrolled", () => {
    render(<FloatingBubble defaultOffset={{ x: 5, y: 5 }}>+</FloatingBubble>);
    expect(screen.getByRole("button")).toHaveStyle({ transform: "translate(5px, 5px)" });
  });

  it("dispatching pointer events does not throw, even without real PointerEvent/setPointerCapture support in jsdom", () => {
    render(<FloatingBubble magnetic="xy">+</FloatingBubble>);
    const button = screen.getByRole("button");
    expect(() => {
      fireEvent.pointerDown(button, { pointerId: 1, clientX: 0, clientY: 0 });
      fireEvent.pointerMove(window, { pointerId: 1, clientX: 10, clientY: 10 });
      fireEvent.pointerUp(window, { pointerId: 1, clientX: 10, clientY: 10 });
    }).not.toThrow();
  });
});
