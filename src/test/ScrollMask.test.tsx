import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ScrollMask } from "../components/ScrollMask";

function mockScrollBox(el: HTMLDivElement, { scrollLeft = 0, scrollWidth = 100, clientWidth = 100 } = {}) {
  Object.defineProperty(el, "scrollLeft", { value: scrollLeft, configurable: true });
  Object.defineProperty(el, "scrollWidth", { value: scrollWidth, configurable: true });
  Object.defineProperty(el, "clientWidth", { value: clientWidth, configurable: true });
}

describe("ScrollMask", () => {
  it("shows neither mask when the tracked element doesn't overflow", () => {
    const ref = createRef<HTMLDivElement>();
    const track = document.createElement("div");
    mockScrollBox(track, { scrollWidth: 100, clientWidth: 100 });
    // @ts-expect-error -- assigning a plain element to a ref for the test
    ref.current = track;

    const { container } = render(<ScrollMask scrollTrackRef={ref} />);
    expect(container.querySelector('[data-rebar-part="start"]')).toHaveStyle({ opacity: "0" });
    expect(container.querySelector('[data-rebar-part="end"]')).toHaveStyle({ opacity: "0" });
  });

  it("shows only the end mask when scrolled to the start of overflowing content", () => {
    const ref = createRef<HTMLDivElement>();
    const track = document.createElement("div");
    mockScrollBox(track, { scrollLeft: 0, scrollWidth: 300, clientWidth: 100 });
    // @ts-expect-error -- assigning a plain element to a ref for the test
    ref.current = track;

    const { container } = render(<ScrollMask scrollTrackRef={ref} />);
    expect(container.querySelector('[data-rebar-part="start"]')).toHaveStyle({ opacity: "0" });
    expect(container.querySelector('[data-rebar-part="end"]')).toHaveStyle({ opacity: "1" });
  });

  it("shows only the start mask when scrolled to the end", () => {
    const ref = createRef<HTMLDivElement>();
    const track = document.createElement("div");
    mockScrollBox(track, { scrollLeft: 200, scrollWidth: 300, clientWidth: 100 });
    // @ts-expect-error -- assigning a plain element to a ref for the test
    ref.current = track;

    const { container } = render(<ScrollMask scrollTrackRef={ref} />);
    expect(container.querySelector('[data-rebar-part="start"]')).toHaveStyle({ opacity: "1" });
    expect(container.querySelector('[data-rebar-part="end"]')).toHaveStyle({ opacity: "0" });
  });

  it("shows both masks when scrolled to the middle", () => {
    const ref = createRef<HTMLDivElement>();
    const track = document.createElement("div");
    mockScrollBox(track, { scrollLeft: 100, scrollWidth: 300, clientWidth: 100 });
    // @ts-expect-error -- assigning a plain element to a ref for the test
    ref.current = track;

    const { container } = render(<ScrollMask scrollTrackRef={ref} />);
    expect(container.querySelector('[data-rebar-part="start"]')).toHaveStyle({ opacity: "1" });
    expect(container.querySelector('[data-rebar-part="end"]')).toHaveStyle({ opacity: "1" });
  });

  it("both masks are decorative (aria-hidden)", () => {
    const ref = createRef<HTMLDivElement>();
    const track = document.createElement("div");
    mockScrollBox(track);
    // @ts-expect-error -- assigning a plain element to a ref for the test
    ref.current = track;

    const { container } = render(<ScrollMask scrollTrackRef={ref} />);
    expect(container.querySelector('[data-rebar-part="start"]')).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector('[data-rebar-part="end"]')).toHaveAttribute("aria-hidden", "true");
  });
});
