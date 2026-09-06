import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScrollArea } from "../components/ScrollArea";

describe("ScrollArea", () => {
  it("renders its children", () => {
    render(<ScrollArea>Content</ScrollArea>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("carries data-rebar-component and defaults to vertical orientation", () => {
    render(<ScrollArea data-testid="scroll">Content</ScrollArea>);
    const el = screen.getByTestId("scroll");
    expect(el).toHaveAttribute("data-rebar-component", "scroll-area");
    expect(el).toHaveAttribute("data-rebar-orientation", "vertical");
  });

  it("applies maxHeight as an inline style, treating a number as px", () => {
    render(
      <ScrollArea data-testid="scroll" maxHeight={200}>
        Content
      </ScrollArea>,
    );
    expect(screen.getByTestId("scroll")).toHaveStyle({ maxHeight: "200px" });
  });

  it("accepts a string maxHeight as-is", () => {
    render(
      <ScrollArea data-testid="scroll" maxHeight="50vh">
        Content
      </ScrollArea>,
    );
    expect(screen.getByTestId("scroll")).toHaveStyle({ maxHeight: "50vh" });
  });

  it("reflects the orientation prop", () => {
    render(
      <ScrollArea data-testid="scroll" orientation="horizontal">
        Content
      </ScrollArea>,
    );
    expect(screen.getByTestId("scroll")).toHaveAttribute("data-rebar-orientation", "horizontal");
  });

  it("forwards arbitrary data-*/aria-* props onto the root", () => {
    render(
      <ScrollArea data-testid="scroll" aria-label="Log output">
        Content
      </ScrollArea>,
    );
    expect(screen.getByTestId("scroll")).toHaveAttribute("aria-label", "Log output");
  });
});
