import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Grid } from "../components/Grid";

describe("Grid", () => {
  it("carries data-rebar-component on the root", () => {
    render(<Grid>content</Grid>);
    expect(document.querySelector('[data-rebar-component="grid"]')).not.toBeNull();
  });

  it("defaults to an auto-fit/minmax responsive template with no columns prop set", () => {
    const { container } = render(<Grid>content</Grid>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.display).toBe("grid");
    expect(el.style.gridTemplateColumns).toBe("repeat(auto-fit, minmax(240px, 1fr))");
  });

  it("honors a custom minItemWidth", () => {
    const { container } = render(<Grid minItemWidth={320}>content</Grid>);
    expect((container.firstChild as HTMLElement).style.gridTemplateColumns).toBe(
      "repeat(auto-fit, minmax(320px, 1fr))",
    );
  });

  it("accepts a CSS length string for minItemWidth", () => {
    const { container } = render(<Grid minItemWidth="20rem">content</Grid>);
    expect((container.firstChild as HTMLElement).style.gridTemplateColumns).toBe(
      "repeat(auto-fit, minmax(20rem, 1fr))",
    );
  });

  it("uses a fixed column count instead when columns is set", () => {
    const { container } = render(<Grid columns={3}>content</Grid>);
    expect((container.firstChild as HTMLElement).style.gridTemplateColumns).toBe("repeat(3, 1fr)");
  });

  it("applies the gap token as a --rebar-space-* custom property reference", () => {
    const { container } = render(<Grid gap="lg">content</Grid>);
    expect((container.firstChild as HTMLElement).style.gap).toBe("var(--rebar-space-lg, 24px)");
  });

  it("renders as a different element via `as`", () => {
    const { container } = render(<Grid as="section">content</Grid>);
    expect(container.firstChild!.nodeName).toBe("SECTION");
  });

  it("forwards arbitrary data-*/aria-* props to the root", () => {
    render(<Grid data-testid="card-grid" aria-label="Results" />);
    const el = document.querySelector('[data-testid="card-grid"]');
    expect(el).toHaveAttribute("aria-label", "Results");
  });
});
