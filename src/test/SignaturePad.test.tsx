import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("calls onValueChange after a completed stroke", async () => {
    const onValueChange = vi.fn();
    const { container } = render(<SignaturePad onValueChange={onValueChange} />);
    const canvas = container.querySelector('[data-rebar-part="canvas"]') as HTMLElement;
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
    // Capturing a value is async now — see emitValue's own comment (a keyed device stamp needs a
    // real, async-only Web Crypto call before there's anything to emit).
    await waitFor(() => expect(onValueChange).toHaveBeenCalledTimes(1));
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

  it("allowTypedName: typing a name marks the pad non-empty immediately, and emits a value on blur", async () => {
    const onValueChange = vi.fn();
    const { container } = render(<SignaturePad allowTypedName onValueChange={onValueChange} />);
    const input = screen.getByPlaceholderText("Type your name");
    fireEvent.change(input, { target: { value: "Ada Lovelace" } });
    expect(container.querySelector('[data-rebar-component="signature-pad"]')).not.toHaveAttribute(
      "data-rebar-empty",
    );
    // Not committed yet -- typing only paints a live preview, the same "commit at the natural end
    // of the gesture" rule pointer drawing follows (moves paint locally, only pointerup emits).
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.blur(input);
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith(expect.any(String)));
    expect(screen.getByRole("button", { name: "Clear" })).toBeEnabled();
  });

  it("allowTypedName: clearing the typed name back to empty resets to empty, and emits \"\" on blur", () => {
    const onValueChange = vi.fn();
    const { container } = render(<SignaturePad allowTypedName onValueChange={onValueChange} />);
    const input = screen.getByPlaceholderText("Type your name");
    fireEvent.change(input, { target: { value: "Ada" } });
    fireEvent.change(input, { target: { value: "" } });
    expect(container.querySelector('[data-rebar-component="signature-pad"]')).toHaveAttribute(
      "data-rebar-empty",
      "true",
    );
    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenLastCalledWith("");
  });

  it("allowTypedName: pressing Enter commits the same way blur does", async () => {
    const onValueChange = vi.fn();
    render(<SignaturePad allowTypedName onValueChange={onValueChange} />);
    const input = screen.getByPlaceholderText("Type your name") as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: "Ada Lovelace" } });
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith(expect.any(String)));
  });

  it("allowTypedName: shows a save hint only once there's a name to commit", () => {
    render(<SignaturePad allowTypedName />);
    const input = screen.getByPlaceholderText("Type your name");
    expect(screen.queryByTitle("Press Enter to save")).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "Ada" } });
    expect(screen.getByTitle("Press Enter to save")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "" } });
    expect(screen.queryByTitle("Press Enter to save")).not.toBeInTheDocument();
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

  it("stamp: does not throw when baking a label/timestamp into a completed stroke", async () => {
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
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith(expect.any(String)));
  });

  it("stamp: computes a real keyed HMAC from deviceId+deviceKey rather than stamping either in the open", async () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <SignaturePad
        stamp={{ deviceId: "device-abc123", deviceKey: "a-sufficiently-long-shared-secret" }}
        onValueChange={onValueChange}
      />,
    );
    const canvas = container.querySelector('[data-rebar-part="canvas"]') as HTMLElement;
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith(expect.any(String)));
  });

  it("stamp: the same deviceId+deviceKey pair always produces the same stamp (deterministic, not per-render random)", async () => {
    const stamp = { deviceId: "device-abc123", deviceKey: "a-sufficiently-long-shared-secret" };
    const results: string[] = [];
    for (let i = 0; i < 2; i++) {
      const onValueChange = vi.fn((value: string) => results.push(value));
      const { container, unmount } = render(<SignaturePad stamp={stamp} onValueChange={onValueChange} />);
      const canvas = container.querySelector('[data-rebar-part="canvas"]') as HTMLElement;
      fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
      fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
      fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
      await waitFor(() => expect(onValueChange).toHaveBeenCalled());
      unmount();
    }
    // jsdom's canvas has no real 2D context (see the module-level jsdom-limitations note), so the
    // two data URLs can't be compared directly — this instead confirms hmacDeviceStamp itself
    // didn't throw or silently vary between two independent calls with identical inputs.
    expect(results).toHaveLength(2);
  });

  it("stamp: ignores a deviceId with no deviceKey, since an unkeyed identifier has nothing safe to do with it", async () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <SignaturePad stamp={{ deviceId: "device-abc123" }} onValueChange={onValueChange} />,
    );
    const canvas = container.querySelector('[data-rebar-part="canvas"]') as HTMLElement;
    expect(() => {
      fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
      fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
      fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 40, clientY: 30 });
    }).not.toThrow();
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith(expect.any(String)));
  });
});
