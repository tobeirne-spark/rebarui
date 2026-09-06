import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BackTop } from "../components/BackTop";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { value, writable: true, configurable: true });
}

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })),
  });
}

describe("BackTop", () => {
  beforeEach(() => {
    setScrollY(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error -- cleaning up our own test-only override
    delete window.matchMedia;
  });

  it("is hidden below the visibility threshold", () => {
    render(<BackTop visibilityThreshold={300} />);
    expect(screen.queryByRole("button", { name: "Back to top" })).not.toBeInTheDocument();
  });

  it("appears once scrolled past the visibility threshold", () => {
    render(<BackTop visibilityThreshold={300} />);
    setScrollY(301);
    fireEvent.scroll(window);
    expect(screen.getByRole("button", { name: "Back to top" })).toBeInTheDocument();
  });

  it("stays hidden if the scroll never crosses the threshold", () => {
    render(<BackTop visibilityThreshold={300} />);
    setScrollY(150);
    fireEvent.scroll(window);
    expect(screen.queryByRole("button", { name: "Back to top" })).not.toBeInTheDocument();
  });

  it("re-hides once scrolled back above the threshold", () => {
    render(<BackTop visibilityThreshold={300} />);
    setScrollY(301);
    fireEvent.scroll(window);
    expect(screen.getByRole("button", { name: "Back to top" })).toBeInTheDocument();

    setScrollY(0);
    fireEvent.scroll(window);
    expect(screen.queryByRole("button", { name: "Back to top" })).not.toBeInTheDocument();
  });

  it("clicking scrolls the target back to the top, and calls onClick", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const onClick = vi.fn();
    render(<BackTop visibilityThreshold={300} onClick={onClick} />);
    setScrollY(301);
    fireEvent.scroll(window);

    fireEvent.click(screen.getByRole("button", { name: "Back to top" }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses a custom target's own scroll position and scrollTo, not window's", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    Object.defineProperty(container, "scrollTop", { value: 0, writable: true, configurable: true });
    const containerScrollTo = vi.fn();
    container.scrollTo = containerScrollTo;
    const windowScrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    render(<BackTop visibilityThreshold={100} target={() => container} />);

    Object.defineProperty(container, "scrollTop", { value: 150, writable: true, configurable: true });
    fireEvent.scroll(container);

    expect(screen.getByRole("button", { name: "Back to top" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to top" }));

    expect(containerScrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(windowScrollTo).not.toHaveBeenCalled();

    document.body.removeChild(container);
  });

  it("respects prefers-reduced-motion by scrolling with behavior: auto instead of smooth", () => {
    mockMatchMedia(true);
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<BackTop visibilityThreshold={300} />);
    setScrollY(301);
    fireEvent.scroll(window);

    fireEvent.click(screen.getByRole("button", { name: "Back to top" }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });

  it("carries data-rebar-component on the root", () => {
    render(<BackTop visibilityThreshold={0} />);
    setScrollY(1);
    fireEvent.scroll(window);
    expect(screen.getByRole("button", { name: "Back to top" })).toHaveAttribute(
      "data-rebar-component",
      "back-top",
    );
  });

  it("renders custom children instead of the default glyph", () => {
    render(
      <BackTop visibilityThreshold={0}>
        <span>Top</span>
      </BackTop>,
    );
    setScrollY(1);
    fireEvent.scroll(window);
    expect(screen.getByText("Top")).toBeInTheDocument();
  });
});
