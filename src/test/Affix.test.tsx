import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Affix } from "../components/Affix";

interface RectState {
  wrapperTop: number;
  contentWidth: number;
  contentHeight: number;
}

/**
 * A single `Element.prototype.getBoundingClientRect` mock, installed once *before* the first
 * render — the mount effect calls `measure()` synchronously during `render()` itself (before a
 * test gets a chance to grab specific DOM nodes and mock them individually), so mocking real
 * element instances only *after* `render()` returns is too late: the very first measurement would
 * already have run against jsdom's real (all-zero) rects. Dispatches by which part of `Affix` is
 * being measured (its own `data-rebar-*` attributes), so the wrapper's scroll-driven `top` and the
 * content's own natural size can be updated independently as a test progresses.
 */
function installRectMock(initial: RectState) {
  const state = { ...initial };
  const spy = vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (
    this: Element,
  ) {
    const base = { left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} };
    if (this.getAttribute("data-rebar-component") === "affix") {
      return { ...base, top: state.wrapperTop, width: 0, height: 0 } as DOMRect;
    }
    if (this.getAttribute("data-rebar-part") === "content") {
      return { ...base, top: 0, width: state.contentWidth, height: state.contentHeight } as DOMRect;
    }
    return { ...base, top: 0, width: 0, height: 0 } as DOMRect;
  });
  return {
    spy,
    set: (next: Partial<RectState>) => Object.assign(state, next),
  };
}

// Our own scroll handler is rAF-throttled — flush one real animation frame (not fake timers, since
// jsdom's requestAnimationFrame implementation isn't guaranteed to be in vitest's default fake-timer
// set) after firing the scroll event so the throttled measurement has actually run before asserting.
async function scrollAndFlush(target: Window | Element = window) {
  await act(async () => {
    fireEvent.scroll(target);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
}

describe("Affix", () => {
  it("stays unaffixed while its natural position is still below offsetTop", async () => {
    const rects = installRectMock({ wrapperTop: 50, contentWidth: 120, contentHeight: 40 });
    render(
      <Affix offsetTop={0}>
        <div>Pinned content</div>
      </Affix>,
    );

    rects.set({ wrapperTop: 50 });
    await scrollAndFlush();

    expect(document.querySelector('[data-rebar-part="placeholder"]')).not.toBeInTheDocument();
    expect(screen.getByText("Pinned content")).toBeInTheDocument();
    rects.spy.mockRestore();
  });

  it("affixes once scrolled past offsetTop, leaving a same-sized placeholder in flow", async () => {
    const rects = installRectMock({ wrapperTop: 50, contentWidth: 120, contentHeight: 40 });
    render(
      <Affix offsetTop={10}>
        <div>Pinned content</div>
      </Affix>,
    );
    const content = document.querySelector('[data-rebar-part="content"]') as HTMLElement;

    rects.set({ wrapperTop: -5 });
    await scrollAndFlush();

    const placeholder = document.querySelector('[data-rebar-part="placeholder"]') as HTMLElement;
    expect(placeholder).toBeInTheDocument();
    expect(placeholder.style.width).toBe("120px");
    expect(placeholder.style.height).toBe("40px");
    expect(content.style.position).toBe("fixed");
    expect(content.style.top).toBe("10px");
    rects.spy.mockRestore();
  });

  it("calls onAffixChange on the affix/unaffix transitions, not on every scroll", async () => {
    const onAffixChange = vi.fn();
    const rects = installRectMock({ wrapperTop: 50, contentWidth: 100, contentHeight: 20 });
    render(
      <Affix offsetTop={0} onAffixChange={onAffixChange}>
        <div>Pinned content</div>
      </Affix>,
    );

    rects.set({ wrapperTop: 50 });
    await scrollAndFlush();
    expect(onAffixChange).not.toHaveBeenCalled();

    rects.set({ wrapperTop: -1 });
    await scrollAndFlush();
    expect(onAffixChange).toHaveBeenCalledTimes(1);
    expect(onAffixChange).toHaveBeenLastCalledWith(true);

    // Scrolling again while still past the threshold must not fire a redundant call.
    rects.set({ wrapperTop: -20 });
    await scrollAndFlush();
    expect(onAffixChange).toHaveBeenCalledTimes(1);

    rects.set({ wrapperTop: 50 });
    await scrollAndFlush();
    expect(onAffixChange).toHaveBeenCalledTimes(2);
    expect(onAffixChange).toHaveBeenLastCalledWith(false);
    expect(document.querySelector('[data-rebar-part="placeholder"]')).not.toBeInTheDocument();
    rects.spy.mockRestore();
  });

  it("carries data-rebar-component on the root", () => {
    render(
      <Affix>
        <div>Pinned content</div>
      </Affix>,
    );
    expect(document.querySelector('[data-rebar-component="affix"]')).toBeInTheDocument();
  });
});
