import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Barcode } from "../components/Barcode";

describe("Barcode", () => {
  it("renders a real, scannable svg with a data-rebar-component marker", () => {
    const { container } = render(<Barcode value="HELLO123" />);
    const svg = container.querySelector('[data-rebar-component="barcode"]');
    expect(svg).toBeInTheDocument();
    expect(svg?.tagName).toBe("svg");
    expect(container.querySelectorAll("rect[data-rebar-part='bar']").length).toBeGreaterThan(10);
  });

  it("has an accessible name describing what it encodes", () => {
    render(<Barcode value="HELLO123" />);
    expect(screen.getByRole("img", { name: "Barcode for HELLO123" })).toBeInTheDocument();
  });

  it("shows the encoded value as text beneath the bars by default", () => {
    render(<Barcode value="HELLO123" />);
    expect(screen.getByText("HELLO123")).toBeInTheDocument();
  });

  it("omits the text when showText is false", () => {
    render(<Barcode value="HELLO123" showText={false} />);
    expect(screen.queryByText("HELLO123")).not.toBeInTheDocument();
  });

  it("scales total width with barWidth and content length", () => {
    const { container: narrow } = render(<Barcode value="HI" barWidth={1} />);
    const narrowWidth = Number(narrow.querySelector("svg")!.getAttribute("width"));

    const { container: wide } = render(<Barcode value="HI" barWidth={4} />);
    const wideWidth = Number(wide.querySelector("svg")!.getAttribute("width"));
    expect(wideWidth).toBeGreaterThan(narrowWidth);

    const { container: longer } = render(<Barcode value="A MUCH LONGER VALUE THAN HI" barWidth={1} />);
    const longerWidth = Number(longer.querySelector("svg")!.getAttribute("width"));
    expect(longerWidth).toBeGreaterThan(narrowWidth);
  });

  it("omits the background rect when bgColor is transparent", () => {
    const opaque = render(<Barcode value="hi" bgColor="#ffffff" />);
    expect(opaque.container.querySelector("rect[fill='#ffffff']")).toBeInTheDocument();
    opaque.unmount();

    const transparent = render(<Barcode value="hi" bgColor="transparent" />);
    expect(transparent.container.querySelector("rect[fill='transparent']")).not.toBeInTheDocument();
  });

  it("produces a different bar pattern for a different value", () => {
    const a = render(<Barcode value="HELLO" />);
    const aBars = a.container.querySelectorAll("rect[data-rebar-part='bar']").length;
    a.unmount();
    const b = render(<Barcode value="A MUCH LONGER PIECE OF TEXT THAN HELLO" />);
    const bBars = b.container.querySelectorAll("rect[data-rebar-part='bar']").length;
    expect(aBars).not.toBe(bBars);
  });

  it("renders nothing but the background when value is empty", () => {
    const { container } = render(<Barcode value="" />);
    expect(container.querySelectorAll("rect[data-rebar-part='bar']").length).toBe(0);
  });
});
