import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement these — several Radix primitives (Select, Toast, Tooltip, Slider)
// use them internally regardless of whether a test actually exercises pointer/resize behavior.
// Standard, well-known polyfills for testing Radix under jsdom, not Rebar-specific workarounds.
if (typeof window !== "undefined") {
  if (!("ResizeObserver" in window)) {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    // @ts-expect-error -- test-only stub, not a full ResizeObserver implementation
    window.ResizeObserver = ResizeObserverStub;
  }

  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
  if (!Element.prototype.scrollTo) {
    // A synchronous stand-in for real (possibly `behavior: "smooth"`, necessarily async) scrolling
    // — jsdom has no layout/animation loop to drive an actual smooth scroll, so this applies the
    // target position immediately. Setting `this.scrollTop` (rather than assigning a local var)
    // means a test's own per-element `scrollTop` getter/setter override still runs as normal.
    Element.prototype.scrollTo = function (optionsOrX?: ScrollToOptions | number, y?: number) {
      if (typeof optionsOrX === "object" && optionsOrX !== null) {
        if (typeof optionsOrX.top === "number") this.scrollTop = optionsOrX.top;
        if (typeof optionsOrX.left === "number") this.scrollLeft = optionsOrX.left;
      } else if (typeof optionsOrX === "number") {
        this.scrollLeft = optionsOrX;
        if (typeof y === "number") this.scrollTop = y;
      }
    };
  }
}
