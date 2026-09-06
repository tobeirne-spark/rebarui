import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ButtonGroup } from "../components/ButtonGroup";
import { Button } from "../components/Button";

describe("ButtonGroup", () => {
  it("renders its children as real buttons", () => {
    render(
      <ButtonGroup>
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("button", { name: "One" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Two" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Three" })).toBeInTheDocument();
  });

  it("defaults to horizontal orientation", () => {
    render(
      <ButtonGroup>
        <Button>One</Button>
      </ButtonGroup>,
    );
    expect(document.querySelector('[data-rebar-component="button-group"]')).toHaveAttribute(
      "data-rebar-orientation",
      "horizontal",
    );
  });

  it('applies data-rebar-orientation="vertical" when orientation="vertical"', () => {
    render(
      <ButtonGroup orientation="vertical">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    );
    const group = document.querySelector('[data-rebar-component="button-group"]');
    expect(group).toHaveAttribute("data-rebar-orientation", "vertical");
  });

  it("carries a group role and the rebar-component marker", () => {
    render(
      <ButtonGroup>
        <Button>One</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-rebar-component", "button-group");
  });

  it("forwards arbitrary data-*/aria-* props to the root", () => {
    render(
      <ButtonGroup data-testid="my-group" aria-label="Row actions">
        <Button>One</Button>
      </ButtonGroup>,
    );
    const group = screen.getByTestId("my-group");
    expect(group).toHaveAttribute("aria-label", "Row actions");
  });
});
