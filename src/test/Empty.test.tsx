import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Empty } from "../components/Empty";
import { GHOST_EMPTY_PLACEHOLDER } from "../assets/ghostEmptyPlaceholder";
import { EMPTY_PLACEHOLDER } from "../assets/emptyPlaceholder";

describe("Empty", () => {
  it("renders a default description and a decorative illustration", () => {
    const { container } = render(<Empty />);
    expect(screen.getByText("No data")).toBeInTheDocument();
    const icon = container.querySelector('[data-rebar-part="icon"]');
    expect(icon).toBeInTheDocument();
    // Decorative only — alt="" so a screen reader skips it and goes straight to the description.
    expect(icon).toHaveAttribute("alt", "");
  });

  it("renders both a raster illustration and a vector fallback for dark mode by default (icon='auto')", () => {
    const { container } = render(<Empty />);
    expect(container.querySelector(".rebar-empty-icon-raster")).toBeInTheDocument();
    expect(container.querySelector(".rebar-empty-icon-vector")).toBeInTheDocument();
  });

  it("renders only the illustration, forced visible, when icon='illustration'", () => {
    const { container } = render(<Empty icon="illustration" />);
    const raster = container.querySelector(".rebar-empty-icon-raster");
    expect(raster).toBeInTheDocument();
    expect(raster).toHaveStyle({ display: "block" });
    expect(container.querySelector(".rebar-empty-icon-vector")).not.toBeInTheDocument();
  });

  it("renders only the vector, forced visible, when icon='vector'", () => {
    const { container } = render(<Empty icon="vector" />);
    const vector = container.querySelector(".rebar-empty-icon-vector");
    expect(vector).toBeInTheDocument();
    expect(vector).toHaveStyle({ display: "block" });
    expect(container.querySelector(".rebar-empty-icon-raster")).not.toBeInTheDocument();
  });

  it("defaults to the ghost illustration", () => {
    const { container } = render(<Empty />);
    expect(container.querySelector(".rebar-empty-icon-raster")).toHaveAttribute("src", GHOST_EMPTY_PLACEHOLDER);
  });

  it("falls back to the original bowl-and-spoon illustration via illustration prop", () => {
    const { container } = render(<Empty illustration="bowl-and-spoon" />);
    expect(container.querySelector(".rebar-empty-icon-raster")).toHaveAttribute("src", EMPTY_PLACEHOLDER);
  });

  it("accepts a custom description", () => {
    render(<Empty description="No projects yet" />);
    expect(screen.getByText("No projects yet")).toBeInTheDocument();
  });

  it("renders an action slot when given children", () => {
    render(
      <Empty>
        <button>Create project</button>
      </Empty>,
    );
    expect(screen.getByRole("button", { name: "Create project" })).toBeInTheDocument();
  });
});
