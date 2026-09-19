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

  it("does not render the typed-name input or Upload button by default", () => {
    render(<SignaturePad />);
    expect(screen.queryByPlaceholderText("Type your name")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upload" })).not.toBeInTheDocument();
  });

  it("allowTypedName: typing a name marks the pad non-empty and emits a value", () => {
    const onValueChange = vi.fn();
    const { container } = render(<SignaturePad allowTypedName onValueChange={onValueChange} />);
    fireEvent.change(screen.getByPlaceholderText("Type your name"), { target: { value: "Ada Lovelace" } });
    expect(container.querySelector('[data-rebar-component="signature-pad"]')).not.toHaveAttribute(
      "data-rebar-empty",
    );
    expect(onValueChange).toHaveBeenCalledWith(expect.any(String));
    expect(screen.getByRole("button", { name: "Clear" })).toBeEnabled();
  });

  it("allowTypedName: clearing the typed name back to empty resets to empty and emits \"\"", () => {
    const onValueChange = vi.fn();
    const { container } = render(<SignaturePad allowTypedName onValueChange={onValueChange} />);
    const input = screen.getByPlaceholderText("Type your name");
    fireEvent.change(input, { target: { value: "Ada" } });
    fireEvent.change(input, { target: { value: "" } });
    expect(container.querySelector('[data-rebar-component="signature-pad"]')).toHaveAttribute(
      "data-rebar-empty",
      "true",
    );
    expect(onValueChange).toHaveBeenLastCalledWith("");
  });

  it("Clear also resets a typed name", () => {
    render(<SignaturePad allowTypedName />);
    const input = screen.getByPlaceholderText("Type your name") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Ada" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(input.value).toBe("");
  });

  it("allowUpload: renders an Upload button and a hidden file input", () => {
    const { container } = render(<SignaturePad allowUpload />);
    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute("accept", "image/*");
  });

  it("allowUpload: selecting a file does not throw, even without real image decoding in jsdom", () => {
    const { container } = render(<SignaturePad allowUpload />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["fake-image-bytes"], "signature.png", { type: "image/png" });
    expect(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }).not.toThrow();
  });

  it("stamp: does not throw when baking a label/timestamp into a completed stroke", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <SignaturePad stamp={{ label: "device-abc123", timestamp: true }} onValueChange={onValueChange} />,
    );
    const canvas = container.querySelector('[data-rebar-part="canvas"]') as HTMLElement;
    expect(() => {
      fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
      fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
      fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
    }).not.toThrow();
    expect(onValueChange).toHaveBeenCalledWith(expect.any(String));
  });
});
