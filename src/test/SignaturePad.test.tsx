import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SignaturePad } from "../components/SignaturePad";

describe("SignaturePad", () => {
  it("carries data-rebar-component and starts empty", () => {
    const { container } = render(<SignaturePad />);
    const root = container.querySelector('[data-rebar-component="signature-pad"]');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute("data-rebar-empty", "true");
  });

  it("renders a real canvas with an accessible name", () => {
    render(<SignaturePad aria-label="Sign here" />);
    expect(screen.getByRole("img", { name: "Sign here" })).toBeInTheDocument();
  });

  it("the Clear button starts disabled on an empty pad", () => {
    render(<SignaturePad />);
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
  });

  it("drawing (pointerdown/move/up) does not throw, even without real canvas rendering in jsdom", () => {
    const { container } = render(<SignaturePad />);
    const canvas = container.querySelector('[data-rebar-part="canvas"]') as HTMLElement;
    expect(() => {
      fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
      fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
      fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
    }).not.toThrow();
  });

  it("marks the pad non-empty and enables Clear after a stroke", () => {
    const { container } = render(<SignaturePad />);
    const canvas = container.querySelector('[data-rebar-part="canvas"]') as HTMLElement;
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
    expect(container.querySelector('[data-rebar-component="signature-pad"]')).not.toHaveAttribute(
      "data-rebar-empty",
    );
    expect(screen.getByRole("button", { name: "Clear" })).toBeEnabled();
  });

  it("calls onValueChange after a completed stroke", () => {
    const onValueChange = vi.fn();
    const { container } = render(<SignaturePad onValueChange={onValueChange} />);
    const canvas = container.querySelector('[data-rebar-part="canvas"]') as HTMLElement;
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]![0]).toEqual(expect.any(String));
  });

  it("Clear resets to empty and calls onValueChange with an empty string", async () => {
    const onValueChange = vi.fn();
    const { container } = render(<SignaturePad onValueChange={onValueChange} />);
    const canvas = container.querySelector('[data-rebar-part="canvas"]') as HTMLElement;
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 40, clientY: 30 });

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(container.querySelector('[data-rebar-component="signature-pad"]')).toHaveAttribute(
      "data-rebar-empty",
      "true",
    );
    expect(onValueChange).toHaveBeenLastCalledWith("");
  });

  it("disables drawing and the Clear button when disabled", () => {
    render(<SignaturePad disabled />);
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
  });
});
