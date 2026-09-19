import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ChevronDownIcon, EnterOutlined, InboxOutlined } from "../components/icons";

describe("icons", () => {
  it("defaults to a 24x24 viewBox for a RemixIcon-sourced icon", () => {
    const { container } = render(<ChevronDownIcon />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("data-rebar-icon", "ChevronDownIcon");
  });

  it("carries its own native viewBox for an Ant Design-sourced icon", () => {
    const { container } = render(<EnterOutlined />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("viewBox", "64 64 896 896");
    expect(svg).toHaveAttribute("data-rebar-icon", "EnterOutlined");
  });

  it("InboxOutlined carries its own 1024x1024 viewBox", () => {
    const { container } = render(<InboxOutlined />);
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", "0 0 1024 1024");
  });

  it("defaults size to 1em and forwards an explicit size override", () => {
    const { container, rerender } = render(<ChevronDownIcon />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "1em");

    rerender(<ChevronDownIcon size={32} />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "32");
  });
});
