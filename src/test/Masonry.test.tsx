import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Masonry } from "../components/Masonry";

describe("Masonry", () => {
  it("renders all children", () => {
    render(
      <Masonry>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </Masonry>,
    );
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  it("wraps each child in a part=item element with break-inside: avoid applied", () => {
    render(
      <Masonry>
        <div>Item 1</div>
        <div>Item 2</div>
      </Masonry>,
    );
    const items = document.querySelectorAll('[data-rebar-part="item"]');
    expect(items).toHaveLength(2);
    items.forEach((item) => {
      expect(item).toHaveStyle({ breakInside: "avoid" });
    });
  });

  it("defaults to 3 columns and 16px gap", () => {
    render(
      <Masonry>
        <div>Item 1</div>
      </Masonry>,
    );
    const root = document.querySelector('[data-rebar-component="masonry"]');
    expect(root).toHaveStyle({ columnCount: "3", columnGap: "16px" });
  });

  it("applies custom columns and gap", () => {
    render(
      <Masonry columns={5} gap={24}>
        <div>Item 1</div>
      </Masonry>,
    );
    const root = document.querySelector('[data-rebar-component="masonry"]');
    expect(root).toHaveStyle({ columnCount: "5", columnGap: "24px" });
    const item = document.querySelector('[data-rebar-part="item"]');
    expect(item).toHaveStyle({ marginBottom: "24px" });
  });

  it("carries the rebar-component marker", () => {
    render(
      <Masonry>
        <div>Item 1</div>
      </Masonry>,
    );
    expect(document.querySelector('[data-rebar-component="masonry"]')).not.toBeNull();
  });
});
