import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Iframe } from "../components/Iframe";

afterEach(cleanup);

describe("Iframe", () => {
  it("renders a real iframe with the given src and an accessible title", () => {
    render(<Iframe src="https://example.com" title="Example embed" />);
    const iframe = screen.getByTitle("Example embed");
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute("src", "https://example.com");
  });

  it("carries the expected data-rebar-component attribute", () => {
    render(<Iframe src="https://example.com" title="Example embed" />);
    expect(screen.getByTitle("Example embed")).toHaveAttribute("data-rebar-component", "iframe");
  });

  it("forwards arbitrary iframe attributes (e.g. sandbox)", () => {
    render(<Iframe src="https://example.com" title="Example embed" sandbox="allow-scripts" />);
    expect(screen.getByTitle("Example embed")).toHaveAttribute("sandbox", "allow-scripts");
  });

  it("merges a custom className with its own", () => {
    render(<Iframe src="https://example.com" title="Example embed" className="custom-class" />);
    expect(screen.getByTitle("Example embed")).toHaveClass("rebar-iframe", "custom-class");
  });
});
