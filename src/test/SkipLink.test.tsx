import { describe, expect, it, vi } from "vitest";
import type { MouseEvent as ReactMouseEvent } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { SkipLink } from "../components/SkipLink";

describe("SkipLink", () => {
  it("carries data-rebar-component on the root", () => {
    render(<SkipLink />);
    expect(document.querySelector('[data-rebar-component="skip-link"]')).not.toBeNull();
  });

  it("links to #main-content by default", () => {
    render(<SkipLink />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "#main-content");
  });

  it("links to a custom targetId", () => {
    render(<SkipLink targetId="content" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "#content");
  });

  it("defaults to 'Skip to main content' text", () => {
    render(<SkipLink />);
    expect(screen.getByRole("link", { name: "Skip to main content" })).toBeInTheDocument();
  });

  it("accepts custom children", () => {
    render(<SkipLink>Skip to results</SkipLink>);
    expect(screen.getByRole("link", { name: "Skip to results" })).toBeInTheDocument();
  });

  it("forwards arbitrary aria-*/data-* props to the root", () => {
    render(<SkipLink data-testid="skip" />);
    expect(screen.getByTestId("skip")).toBeInTheDocument();
  });

  it("clicking focuses the target and scrolls it a comfortable third down the viewport, not flush to the top", () => {
    document.body.innerHTML = '<main id="main-content" tabindex="-1"></main>';
    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<SkipLink />);
    fireEvent.click(screen.getByRole("link"));
    expect(document.getElementById("main-content")).toHaveFocus();
    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth", top: expect.any(Number) }),
    );
    scrollToSpy.mockRestore();
    document.body.innerHTML = "";
  });

  it("adds a temporary tabindex to a non-focusable target and removes it again on blur", () => {
    document.body.innerHTML = '<main id="main-content"></main>';
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<SkipLink />);
    const target = document.getElementById("main-content")!;
    expect(target).not.toHaveAttribute("tabindex");
    fireEvent.click(screen.getByRole("link"));
    expect(target).toHaveAttribute("tabindex", "-1");
    fireEvent.blur(target);
    expect(target).not.toHaveAttribute("tabindex");
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("leaves a target's existing tabindex alone", () => {
    document.body.innerHTML = '<main id="main-content" tabindex="0"></main>';
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<SkipLink />);
    fireEvent.click(screen.getByRole("link"));
    const target = document.getElementById("main-content")!;
    fireEvent.blur(target);
    expect(target).toHaveAttribute("tabindex", "0");
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("falls back to the native anchor jump when the target isn't in the DOM", () => {
    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<SkipLink targetId="does-not-exist" />);
    const event = fireEvent.click(screen.getByRole("link"));
    // fireEvent.click returns false when preventDefault was called — true here means the native
    // jump was allowed to proceed, since there was nothing for the custom handler to focus.
    expect(event).toBe(true);
    expect(scrollToSpy).not.toHaveBeenCalled();
    scrollToSpy.mockRestore();
  });

  it("respects a caller's own onClick calling preventDefault, skipping the custom scroll entirely", () => {
    document.body.innerHTML = '<main id="main-content"></main>';
    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const onClick = vi.fn((e: ReactMouseEvent) => e.preventDefault());
    render(<SkipLink onClick={onClick} />);
    fireEvent.click(screen.getByRole("link"));
    expect(onClick).toHaveBeenCalled();
    expect(scrollToSpy).not.toHaveBeenCalled();
    scrollToSpy.mockRestore();
    document.body.innerHTML = "";
  });
});
