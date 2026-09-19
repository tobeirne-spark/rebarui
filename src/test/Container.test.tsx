import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Container } from "../components/Container";

describe("Container", () => {
  it("carries data-rebar-component on the root", () => {
    render(<Container>content</Container>);
    expect(document.querySelector('[data-rebar-component="container"]')).not.toBeNull();
  });

  it("centers with a default maxWidth of 800px (the lg preset)", () => {
    const { container } = render(<Container>content</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.maxWidth).toBe("800px");
    expect(el.style.marginLeft).toBe("auto");
    expect(el.style.marginRight).toBe("auto");
  });

  it("resolves named presets to their pixel widths", () => {
    const { container } = render(<Container maxWidth="sm">content</Container>);
    expect((container.firstChild as HTMLElement).style.maxWidth).toBe("480px");
  });

  it("accepts a literal number as pixels", () => {
    const { container } = render(<Container maxWidth={600}>content</Container>);
    expect((container.firstChild as HTMLElement).style.maxWidth).toBe("600px");
  });

  it("accepts a literal CSS length string", () => {
    const { container } = render(<Container maxWidth="90vw">content</Container>);
    expect((container.firstChild as HTMLElement).style.maxWidth).toBe("90vw");
  });

  it("removes the constraint entirely when maxWidth is full", () => {
    const { container } = render(<Container maxWidth="full">content</Container>);
    expect((container.firstChild as HTMLElement).style.maxWidth).toBe("");
  });

  it("renders as a different element via `as`", () => {
    const { container } = render(<Container as="main">content</Container>);
    expect(container.firstChild!.nodeName).toBe("MAIN");
  });

  it("has no vertical padding by default", () => {
    const { container } = render(<Container>content</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.paddingTop).toBe("");
    expect(el.style.paddingBottom).toBe("");
  });

  it("applies verticalPadding to top and bottom only when explicitly set", () => {
    const { container } = render(<Container verticalPadding="var(--rebar-space-xl)">content</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.paddingTop).toBe("var(--rebar-space-xl)");
    expect(el.style.paddingBottom).toBe("var(--rebar-space-xl)");
  });

  it("forwards arbitrary data-*/aria-* props to the root", () => {
    render(<Container data-testid="page-container" aria-label="Page content" />);
    const el = document.querySelector('[data-testid="page-container"]');
    expect(el).toHaveAttribute("aria-label", "Page content");
  });
});
