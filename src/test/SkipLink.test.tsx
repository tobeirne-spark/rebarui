import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
