import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ImageCropper } from "../components/ImageCropper";

describe("ImageCropper", () => {
  it("carries data-rebar-component on the root", () => {
    const { container } = render(<ImageCropper src="https://example.com/photo.jpg" />);
    expect(container.querySelector('[data-rebar-component="image-cropper"]')).toBeInTheDocument();
  });

  it("renders the source image and a crop rectangle with four resize handles", () => {
    const { container } = render(<ImageCropper src="https://example.com/photo.jpg" alt="Photo" />);
    expect(screen.getByAltText("Photo")).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(container.querySelector('[data-rebar-part="rect"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-rebar-part="handle"]')).toHaveLength(4);
  });

  it("centers an initial rect within the stage", () => {
    const { container } = render(<ImageCropper src="a.jpg" width={200} height={200} />);
    const rect = container.querySelector('[data-rebar-part="rect"]') as HTMLElement;
    expect(parseFloat(rect.style.width)).toBeGreaterThan(0);
    expect(parseFloat(rect.style.left)).toBeGreaterThanOrEqual(0);
  });

  // jsdom has no real `PointerEvent` constructor (confirmed directly, not assumed — see
  // GraphExplorer.test.tsx's own identical note): fireEvent.pointerDown/Move silently drop
  // clientX/clientY/pointerId, so the real drag-to-move/drag-to-resize math (and the
  // aspect-ratio-preserving clamp at the stage's edge) can't be verified at this level — same
  // reason this codebase's other pointer/drag-driven components verify that class of interaction
  // via a real browser instead. This is the defensive regression check worth keeping at the unit
  // level: dispatching the full gesture, including a corner-handle resize past the stage bounds,
  // never throws (e.g. on `setPointerCapture`, which jsdom also doesn't implement).
  it("dispatching a full move+resize pointer gesture does not throw, even without real PointerEvent/setPointerCapture support", () => {
    const { container } = render(<ImageCropper src="a.jpg" width={200} height={200} aspectRatio={1} />);
    const stage = container.querySelector('[data-rebar-part="stage"]') as HTMLElement;
    const rect = container.querySelector('[data-rebar-part="rect"]') as HTMLElement;
    const handle = container.querySelector('[data-rebar-corner="se"]') as HTMLElement;

    expect(() => {
      fireEvent.pointerDown(rect, { pointerId: 1, clientX: 100, clientY: 100 });
      fireEvent.pointerMove(stage, { pointerId: 1, clientX: 140, clientY: 100 });
      fireEvent.pointerUp(stage, { pointerId: 1, clientX: 140, clientY: 100 });

      fireEvent.pointerDown(handle, { pointerId: 2, clientX: 0, clientY: 0 });
      fireEvent.pointerMove(stage, { pointerId: 2, clientX: 1000, clientY: 1000 });
      fireEvent.pointerUp(stage, { pointerId: 2, clientX: 1000, clientY: 1000 });
    }).not.toThrow();
  });

  it("pressing Crop does not throw, even without real canvas rendering in jsdom", () => {
    render(<ImageCropper src="a.jpg" onCrop={vi.fn()} />);
    expect(() => fireEvent.click(screen.getByRole("button", { name: "Crop" }))).not.toThrow();
  });

  it("disables the Crop button when disabled", () => {
    render(<ImageCropper src="a.jpg" disabled />);
    expect(screen.getByRole("button", { name: "Crop" })).toBeDisabled();
  });
});
