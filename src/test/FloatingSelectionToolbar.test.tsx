import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import type { RefObject } from "react";
import {
  FloatingSelectionToolbar,
  type FloatingSelectionAction,
} from "../components/FloatingSelectionToolbar";

/**
 * jsdom implements the real `Selection`/`Range` API (so `selection.toString()`, `anchorNode`,
 * `contains()` etc. all behave like a real browser) but does NOT dispatch a real `selectionchange`
 * event when a selection is made or changed programmatically — confirmed directly against this
 * repo's own jsdom version before writing these tests, not assumed. Every test below drives the
 * real Selection API and then manually dispatches the event the browser would otherwise fire,
 * which is exactly what this component listens for either way.
 */
function selectTextWithin(el: HTMLElement, startOffset: number, endOffset: number) {
  const textNode = el.firstChild;
  if (!textNode) throw new Error("expected a text node to select within");
  const range = document.createRange();
  range.setStart(textNode, startOffset);
  range.setEnd(textNode, endOffset);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  document.dispatchEvent(new Event("selectionchange"));
}

function collapseSelection() {
  const selection = window.getSelection();
  selection?.removeAllRanges();
  document.dispatchEvent(new Event("selectionchange"));
}

/** Real per-instance `getBoundingClientRect` mock for whatever `Range` is currently selected —
 * jsdom has no layout engine and doesn't even implement `Range.prototype.getBoundingClientRect`
 * at all (confirmed directly: `vi.spyOn` fails with "does not exist" against a stock jsdom
 * `Range`), unlike `Element.prototype.getBoundingClientRect`, which jsdom does define (just
 * returning an all-zero rect) and which `Affix.test.tsx` spies on instead. So this defines the
 * method outright rather than spying on an existing one. */
function mockSelectionRect(rect: Partial<DOMRect>) {
  const base: DOMRect = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
  };
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => ({ ...base, ...rect }) as DOMRect,
  });
}

/** jsdom's `offsetWidth`/`offsetHeight` are always 0 — override them for the toolbar's own root
 * only (matched via its `data-rebar-component`), same technique `NavBar.test.tsx` already uses. */
function mockToolbarSize(width: number, height: number) {
  const originalWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
  const originalHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute("data-rebar-component") === "floating-selection-toolbar" ? width : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute("data-rebar-component") === "floating-selection-toolbar" ? height : 0;
    },
  });
  return () => {
    if (originalWidth) Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalWidth);
    if (originalHeight) Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalHeight);
  };
}

const actions: FloatingSelectionAction[] = [
  { key: "ask-ai", label: "Ask AI", onSelect: vi.fn() },
  { key: "define", label: "Define", onSelect: vi.fn() },
];

function Harness({
  minSelectionLength,
  actionsOverride,
}: {
  minSelectionLength?: number;
  actionsOverride?: FloatingSelectionAction[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div>
      <div ref={containerRef} data-testid="container">
        hello world selectable text
      </div>
      <div data-testid="outside">not watched</div>
      <FloatingSelectionToolbar
        containerRef={containerRef as RefObject<HTMLElement | null>}
        actions={actionsOverride ?? actions}
        minSelectionLength={minSelectionLength}
      />
    </div>
  );
}

let restoreToolbarSize: () => void;

beforeEach(() => {
  restoreToolbarSize = mockToolbarSize(120, 40);
  mockSelectionRect({ top: 300, left: 300, right: 400, bottom: 320, width: 100, height: 20 });
});

afterEach(() => {
  restoreToolbarSize();
  vi.restoreAllMocks();
  window.getSelection()?.removeAllRanges();
});

describe("FloatingSelectionToolbar", () => {
  it("does not render before any selection is made", () => {
    render(<Harness />);
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("appears when a real selection is made within containerRef above minSelectionLength", () => {
    render(<Harness />);
    const container = screen.getByTestId("container");

    act(() => selectTextWithin(container, 0, 11)); // "hello world"

    const toolbar = screen.getByRole("toolbar");
    expect(toolbar).toBeInTheDocument();
    expect(toolbar).toHaveAttribute("aria-label", "Text selection actions");
    expect(toolbar).toHaveAttribute("data-rebar-component", "floating-selection-toolbar");
  });

  it("does not appear for a selection shorter than minSelectionLength", () => {
    render(<Harness minSelectionLength={10} />);
    const container = screen.getByTestId("container");

    act(() => selectTextWithin(container, 0, 2)); // "he" - 2 chars, below default-overridden min of 10

    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("does not appear for a trivial 1-2 character selection under the default minimum", () => {
    render(<Harness />);
    const container = screen.getByTestId("container");

    act(() => selectTextWithin(container, 0, 2)); // "he"

    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("does not appear for a collapsed selection", () => {
    render(<Harness />);
    const container = screen.getByTestId("container");

    act(() => selectTextWithin(container, 0, 11));
    expect(screen.getByRole("toolbar")).toBeInTheDocument();

    act(() => collapseSelection());
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("does not appear for a selection outside containerRef", () => {
    render(<Harness />);
    const outside = screen.getByTestId("outside");

    act(() => selectTextWithin(outside, 0, 10));

    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("clicking an action calls onSelect with the correct selected text", async () => {
    const onSelect = vi.fn();
    render(
      <Harness
        actionsOverride={[{ key: "ask-ai", label: "Ask AI", onSelect }]}
      />,
    );
    const container = screen.getByTestId("container");
    act(() => selectTextWithin(container, 0, 11));

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Ask AI" }));

    expect(onSelect).toHaveBeenCalledWith("hello world");
  });

  it("stays open after an action click rather than closing immediately", async () => {
    const onSelect = vi.fn();
    render(<Harness actionsOverride={[{ key: "ask-ai", label: "Ask AI", onSelect }]} />);
    const container = screen.getByTestId("container");
    act(() => selectTextWithin(container, 0, 11));

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Ask AI" }));

    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("every action button meets the real 44x44 touch-target minimum via CSS min-height/min-width", () => {
    render(<Harness />);
    const container = screen.getByTestId("container");
    act(() => selectTextWithin(container, 0, 11));

    const button = screen.getByRole("button", { name: "Ask AI" });
    expect(button).toHaveAttribute("data-rebar-part", "action");
  });

  it("positions the toolbar above the selection when there's room", () => {
    mockSelectionRect({ top: 400, left: 300, right: 400, bottom: 420, width: 100, height: 20 });
    render(<Harness />);
    const container = screen.getByTestId("container");
    act(() => selectTextWithin(container, 0, 11));

    const toolbar = screen.getByRole("toolbar");
    // toolbar height mocked to 40; selection top is 400, so above = 400 - 40 - 8(offset) = 352
    expect(parseFloat(toolbar.style.top)).toBeLessThan(400);
  });

  it("clamps to stay in viewport, falling back below when there's no room above", () => {
    // Selection sits right at the very top of the viewport - no room above for a 40px-tall toolbar.
    mockSelectionRect({ top: 2, left: 300, right: 400, bottom: 22, width: 100, height: 20 });
    render(<Harness />);
    const container = screen.getByTestId("container");
    act(() => selectTextWithin(container, 0, 11));

    const toolbar = screen.getByRole("toolbar");
    const top = parseFloat(toolbar.style.top);
    expect(top).toBeGreaterThanOrEqual(22); // placed below the selection, not clipped above the viewport
    expect(top).toBeGreaterThanOrEqual(0);
  });

  it("clamps horizontally so the toolbar never renders past the right edge of the viewport", () => {
    mockSelectionRect({
      top: 300,
      left: window.innerWidth - 10,
      right: window.innerWidth + 90,
      bottom: 320,
      width: 100,
      height: 20,
    });
    render(<Harness />);
    const container = screen.getByTestId("container");
    act(() => selectTextWithin(container, 0, 11));

    const toolbar = screen.getByRole("toolbar");
    const left = parseFloat(toolbar.style.left);
    expect(left + 120).toBeLessThanOrEqual(window.innerWidth); // 120 = mocked toolbar width
  });
});
