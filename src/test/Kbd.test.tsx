import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Kbd } from "../components/Kbd";

describe("Kbd", () => {
  it("renders a real <kbd> element", () => {
    render(<Kbd>K</Kbd>);
    expect(screen.getByText("K").tagName).toBe("KBD");
  });

  it("carries data-rebar-component on the root", () => {
    render(<Kbd>K</Kbd>);
    expect(document.querySelector('[data-rebar-component="kbd"]')).not.toBeNull();
  });

  it("renders arbitrary children, e.g. a multi-character shortcut", () => {
    render(<Kbd>⌘K</Kbd>);
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("forwards arbitrary data-*/aria-* props to the root", () => {
    render(<Kbd data-testid="shortcut">K</Kbd>);
    expect(screen.getByTestId("shortcut")).toBeInTheDocument();
  });
});
