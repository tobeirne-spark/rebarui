import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SectionNav } from "../components/SectionNav";

afterEach(cleanup);

// jsdom has no real IntersectionObserver — stub it so the component can mount without crashing;
// active-heading tracking itself isn't exercised by these tests (that's a real-browser behavior).
class FakeIntersectionObserver {
  observe() {}
  disconnect() {}
}
vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);

const SHORT_SECTIONS = [
  { id: "intro", label: "Introduction" },
  { id: "usage", label: "Usage" },
];

const LONG_SECTIONS = Array.from({ length: 15 }, (_, i) => ({
  id: `section-${i}`,
  label: `Section ${i}`,
}));

describe("SectionNav", () => {
  it("renders every section as a real in-page link, without search chrome under the threshold", () => {
    render(<SectionNav sections={SHORT_SECTIONS} />);
    for (const section of SHORT_SECTIONS) {
      expect(screen.getByRole("link", { name: section.label })).toHaveAttribute(
        "href",
        `#${section.id}`,
      );
    }
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("shows search chrome once the list is long enough, and filters by it", async () => {
    const user = userEvent.setup();
    render(<SectionNav sections={LONG_SECTIONS} />);
    const search = screen.getByPlaceholderText("Filter sections…");
    expect(search).toBeInTheDocument();
    await user.type(search, "Section 3");
    expect(screen.getByRole("link", { name: "Section 3" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Section 0" })).not.toBeInTheDocument();
  });

  it("shows a 'no matches' message when a filter matches nothing", async () => {
    const user = userEvent.setup();
    render(<SectionNav sections={LONG_SECTIONS} />);
    await user.type(screen.getByPlaceholderText("Filter sections…"), "zzz");
    expect(screen.getByText("No matches.")).toBeInTheDocument();
  });

  describe("scroll mist (ref/HEURISTICS.md #43)", () => {
    /** jsdom has no real layout — scrollHeight/clientHeight are always 0 — so scroll state is
     * simulated the same way NavBar's tests simulate layout: override the relevant getters on
     * HTMLElement.prototype, scoped to just this component's scroll container. */
    function mockScroll(scrollTop: number, clientHeight: number, scrollHeight: number) {
      const isTarget = function (this: HTMLElement) {
        return this.dataset.rebarPart === "scroll";
      };
      const originalScrollTop = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollTop");
      const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
      const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");

      Object.defineProperty(HTMLElement.prototype, "scrollTop", {
        configurable: true,
        get(this: HTMLElement) {
          return isTarget.call(this) ? scrollTop : 0;
        },
        // A no-op setter: this fixture models a scroll position fixed by the test, not a real
        // scrollable element — the beacon-follow effect (ref/HEURISTICS.md #44) may try to assign
        // this on mount, which would otherwise throw ("has only a getter") for a value these mist
        // tests never intend to change.
        set() {},
      });
      Object.defineProperty(HTMLElement.prototype, "clientHeight", {
        configurable: true,
        get(this: HTMLElement) {
          return isTarget.call(this) ? clientHeight : 0;
        },
      });
      Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
        configurable: true,
        get(this: HTMLElement) {
          return isTarget.call(this) ? scrollHeight : 0;
        },
      });

      return function restore() {
        if (originalScrollTop) Object.defineProperty(HTMLElement.prototype, "scrollTop", originalScrollTop);
        if (originalClientHeight) Object.defineProperty(HTMLElement.prototype, "clientHeight", originalClientHeight);
        if (originalScrollHeight) Object.defineProperty(HTMLElement.prototype, "scrollHeight", originalScrollHeight);
      };
    }

    it("shows only the bottom mist when scrolled to the top with more content below", () => {
      const restore = mockScroll(0, 200, 500);
      try {
        render(<SectionNav sections={LONG_SECTIONS} />);
        const top = document.querySelector('[data-rebar-part="mist-top"]') as HTMLElement;
        const bottom = document.querySelector('[data-rebar-part="mist-bottom"]') as HTMLElement;
        expect(top.style.opacity).toBe("0");
        expect(bottom.style.opacity).toBe("1");
      } finally {
        restore();
      }
    });

    it("shows both mists when scrolled to the middle of a long list", () => {
      const restore = mockScroll(100, 200, 500);
      try {
        render(<SectionNav sections={LONG_SECTIONS} />);
        const top = document.querySelector('[data-rebar-part="mist-top"]') as HTMLElement;
        const bottom = document.querySelector('[data-rebar-part="mist-bottom"]') as HTMLElement;
        expect(top.style.opacity).toBe("1");
        expect(bottom.style.opacity).toBe("1");
      } finally {
        restore();
      }
    });

    it("hides the bottom mist once scrolled all the way down — that absence signals the true end", () => {
      const restore = mockScroll(300, 200, 500);
      try {
        render(<SectionNav sections={LONG_SECTIONS} />);
        const top = document.querySelector('[data-rebar-part="mist-top"]') as HTMLElement;
        const bottom = document.querySelector('[data-rebar-part="mist-bottom"]') as HTMLElement;
        expect(top.style.opacity).toBe("1");
        expect(bottom.style.opacity).toBe("0");
      } finally {
        restore();
      }
    });

    it("shows neither mist when the whole list already fits", () => {
      const restore = mockScroll(0, 500, 500);
      try {
        render(<SectionNav sections={LONG_SECTIONS} />);
        const top = document.querySelector('[data-rebar-part="mist-top"]') as HTMLElement;
        const bottom = document.querySelector('[data-rebar-part="mist-bottom"]') as HTMLElement;
        expect(top.style.opacity).toBe("0");
        expect(bottom.style.opacity).toBe("0");
      } finally {
        restore();
      }
    });
  });

  describe("beacon follows the active section (ref/HEURISTICS.md #44)", () => {
    /** Captures the real IntersectionObserver callback so a test can fire it manually — a plain
     * no-op stub (used by every other test in this file) can't simulate "a different heading
     * scrolled into view," which is exactly the input this behavior reacts to. */
    class CapturingIntersectionObserver {
      static instances: CapturingIntersectionObserver[] = [];
      callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        CapturingIntersectionObserver.instances.push(this);
      }
      observe() {}
      disconnect() {}
      fire(id: string) {
        this.callback(
          [{ isIntersecting: true, target: { id } } as unknown as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
    }

    /** Gives each rendered `<a>` a fixed position/size (jsdom has no real layout) and makes the
     * scroll container's `scrollTop` both readable and settable, backed by a plain variable —
     * `scrollActiveIntoView` needs to assign it, unlike the mist tests above which only ever read
     * it. Item N sits at offsetTop = N * ITEM_HEIGHT. */
    const ITEM_HEIGHT = 30;
    const CLIENT_HEIGHT = 120;
    /** Must match the component's own MIST_HEIGHT_PX. */
    const MIST_HEIGHT = 28;

    function mockRailLayout(container: HTMLElement) {
      let scrollTop = 0;
      Object.defineProperty(container, "scrollTop", {
        configurable: true,
        get: () => scrollTop,
        set: (v: number) => {
          scrollTop = v;
        },
      });
      Object.defineProperty(container, "clientHeight", { configurable: true, value: CLIENT_HEIGHT });
      Object.defineProperty(container, "scrollHeight", {
        configurable: true,
        value: LONG_SECTIONS.length * ITEM_HEIGHT,
      });
      container.querySelectorAll("a.rebar-section-nav-link").forEach((a, i) => {
        Object.defineProperty(a, "offsetTop", { configurable: true, value: i * ITEM_HEIGHT });
        Object.defineProperty(a, "offsetHeight", { configurable: true, value: ITEM_HEIGHT });
      });
      return () => scrollTop;
    }

    beforeEach(() => {
      CapturingIntersectionObserver.instances = [];
      vi.stubGlobal("IntersectionObserver", CapturingIntersectionObserver);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("scrolls the rail to bring a newly-active item into view when it's below the fold", () => {
      render(<SectionNav sections={LONG_SECTIONS} />);
      const container = document.querySelector('[data-rebar-part="scroll"]') as HTMLElement;
      const getScrollTop = mockRailLayout(container);

      // Section 10 sits at y=300–330, well past the 120px visible window starting at scrollTop 0.
      act(() => {
        CapturingIntersectionObserver.instances[0]!.fire("section-10");
      });

      // +MIST_HEIGHT: the beacon must clear the bottom mist, not land flush against the edge.
      expect(getScrollTop()).toBe(300 + ITEM_HEIGHT - CLIENT_HEIGHT + MIST_HEIGHT);
    });

    it("does not scroll when the newly-active item is already visible", () => {
      render(<SectionNav sections={LONG_SECTIONS} />);
      const container = document.querySelector('[data-rebar-part="scroll"]') as HTMLElement;
      const getScrollTop = mockRailLayout(container);

      // Section 1 (y=30–60) is well within the initial 0–120 visible window.
      act(() => {
        CapturingIntersectionObserver.instances[0]!.fire("section-1");
      });

      expect(getScrollTop()).toBe(0);
    });

    it("keeps clearance from the bottom mist even for an item flush against that edge", () => {
      render(<SectionNav sections={LONG_SECTIONS} />);
      const container = document.querySelector('[data-rebar-part="scroll"]') as HTMLElement;
      const getScrollTop = mockRailLayout(container);

      // Section 3 (y=90–120) sits exactly flush with the 120px visible window's bottom edge —
      // "visible" by a naive check, but squarely under the bottom mist without the offset.
      act(() => {
        CapturingIntersectionObserver.instances[0]!.fire("section-3");
      });

      expect(getScrollTop()).toBe(90 + ITEM_HEIGHT - CLIENT_HEIGHT + MIST_HEIGHT);
    });

    it("respects a manual scroll of the rail, then recenters on the beacon after the idle delay", () => {
      vi.useFakeTimers();
      render(<SectionNav sections={LONG_SECTIONS} />);
      const container = document.querySelector('[data-rebar-part="scroll"]') as HTMLElement;
      const getScrollTop = mockRailLayout(container);
      const observer = CapturingIntersectionObserver.instances[0]!;

      // A real person scrolls the rail by hand — not a scroll this component caused itself.
      fireEvent.scroll(container);

      // The beacon moves to an out-of-view item while the manual scroll is still "in effect" —
      // it must NOT be yanked back into view yet.
      act(() => {
        observer.fire("section-10");
      });
      expect(getScrollTop()).toBe(0);

      // Still within the idle window — no recenter yet.
      act(() => {
        vi.advanceTimersByTime(4999);
      });
      expect(getScrollTop()).toBe(0);

      // Idle window elapsed — recenters on whichever item is active *now*, not at scroll time.
      act(() => {
        vi.advanceTimersByTime(1);
      });
      // +MIST_HEIGHT: the beacon must clear the bottom mist, not land flush against the edge.
      expect(getScrollTop()).toBe(300 + ITEM_HEIGHT - CLIENT_HEIGHT + MIST_HEIGHT);
    });
  });

  describe("beacon pointer (ref/HEURISTICS.md #46)", () => {
    const ITEM_HEIGHT = 30;
    const CLIENT_HEIGHT = 120;

    class CapturingIntersectionObserver {
      static instances: CapturingIntersectionObserver[] = [];
      callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        CapturingIntersectionObserver.instances.push(this);
      }
      observe() {}
      disconnect() {}
      fire(id: string) {
        this.callback(
          [{ isIntersecting: true, target: { id } } as unknown as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
    }

    function mockRailLayout(container: HTMLElement) {
      let scrollTop = 0;
      Object.defineProperty(container, "scrollTop", {
        configurable: true,
        get: () => scrollTop,
        set: (v: number) => {
          scrollTop = v;
        },
      });
      Object.defineProperty(container, "clientHeight", { configurable: true, value: CLIENT_HEIGHT });
      Object.defineProperty(container, "scrollHeight", {
        configurable: true,
        value: LONG_SECTIONS.length * ITEM_HEIGHT,
      });
      container.querySelectorAll("a.rebar-section-nav-link").forEach((a, i) => {
        Object.defineProperty(a, "offsetTop", { configurable: true, value: i * ITEM_HEIGHT });
        Object.defineProperty(a, "offsetHeight", { configurable: true, value: ITEM_HEIGHT });
      });
    }

    beforeEach(() => {
      CapturingIntersectionObserver.instances = [];
      vi.stubGlobal("IntersectionObserver", CapturingIntersectionObserver);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows a bottom pointer while a manual-scroll pause keeps an out-of-view beacon from being followed", () => {
      vi.useFakeTimers();
      render(<SectionNav sections={LONG_SECTIONS} />);
      const container = document.querySelector('[data-rebar-part="scroll"]') as HTMLElement;
      mockRailLayout(container);
      const observer = CapturingIntersectionObserver.instances[0]!;

      fireEvent.scroll(container);
      act(() => {
        observer.fire("section-10"); // y=300–330, well past the 120px visible window
      });

      expect(document.querySelector('[data-rebar-part="beacon-pointer-bottom"]')).toBeInTheDocument();
      expect(document.querySelector('[data-rebar-part="beacon-pointer-top"]')).not.toBeInTheDocument();
    });

    it("shows no pointer once the beacon is genuinely visible", () => {
      render(<SectionNav sections={LONG_SECTIONS} />);
      const container = document.querySelector('[data-rebar-part="scroll"]') as HTMLElement;
      mockRailLayout(container);

      // Default active section (index 0) is visible from mount — nothing to point toward.
      expect(document.querySelector('[data-rebar-part="beacon-pointer-top"]')).not.toBeInTheDocument();
      expect(document.querySelector('[data-rebar-part="beacon-pointer-bottom"]')).not.toBeInTheDocument();
    });

    it("stretches into a bar while a scroll that could be moving the beacon is actively happening", () => {
      vi.useFakeTimers();
      render(<SectionNav sections={LONG_SECTIONS} />);
      const container = document.querySelector('[data-rebar-part="scroll"]') as HTMLElement;
      mockRailLayout(container);
      const observer = CapturingIntersectionObserver.instances[0]!;

      fireEvent.scroll(container);
      act(() => {
        observer.fire("section-10");
      });

      // No time has passed since the triggering scroll — still "actively scrolling".
      const pointer = document.querySelector('[data-rebar-part="beacon-pointer-bottom"]') as HTMLElement;
      const height = parseFloat(pointer.style.height);
      expect(height).toBeGreaterThan(6); // taller than the resting dot's fixed 6px size
    });

    it("eases back to a resting dot once the scroll settles", () => {
      vi.useFakeTimers();
      render(<SectionNav sections={LONG_SECTIONS} />);
      const container = document.querySelector('[data-rebar-part="scroll"]') as HTMLElement;
      mockRailLayout(container);
      const observer = CapturingIntersectionObserver.instances[0]!;

      fireEvent.scroll(container);
      act(() => {
        observer.fire("section-10");
      });
      // Past the idle debounce with no further scroll events — motion has settled.
      act(() => {
        vi.advanceTimersByTime(200);
      });

      const pointer = document.querySelector('[data-rebar-part="beacon-pointer-bottom"]') as HTMLElement;
      expect(parseFloat(pointer.style.height)).toBe(6);
    });
  });

  describe("bionic reading on section labels", () => {
    afterEach(() => {
      document.documentElement.removeAttribute("data-rebar-bionic");
    });

    it("renders labels plainly by default", () => {
      const { container } = render(<SectionNav sections={[{ id: "intro", label: "Introduction" }]} />);
      expect(container.querySelector(".rebar-bionic-fixation")).not.toBeInTheDocument();
      expect(screen.getByText("Introduction")).toBeInTheDocument();
    });

    it("follows the ambient data-rebar-bionic attribute", () => {
      document.documentElement.setAttribute("data-rebar-bionic", "true");
      const { container } = render(<SectionNav sections={[{ id: "intro", label: "Introduction" }]} />);
      expect(container.querySelector(".rebar-bionic-fixation")).toBeInTheDocument();
    });
  });
});
