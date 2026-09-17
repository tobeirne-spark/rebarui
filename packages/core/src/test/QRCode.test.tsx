import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QRCode } from "../components/QRCode";

describe("QRCode", () => {
  it("renders a real, scannable svg with a data-rebar-component marker", () => {
    const { container } = render(<QRCode value="https://example.com" />);
    const svg = container.querySelector('[data-rebar-component="qrcode"]');
    expect(svg).toBeInTheDocument();
    expect(svg?.tagName).toBe("svg");
    // A real QR encode produces many dark module rects, not a placeholder — the exact count
    // depends on the encoded content's version, but zero would mean nothing was actually encoded.
    expect(container.querySelectorAll("rect").length).toBeGreaterThan(10);
  });

  it("has an accessible name describing what it encodes", () => {
    render(<QRCode value="https://example.com" />);
    expect(screen.getByRole("img", { name: "QR code for https://example.com" })).toBeInTheDocument();
  });

  it("sizes the svg via width/height/viewBox", () => {
    const { container } = render(<QRCode value="hi" size={200} />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("width", "200");
    expect(svg).toHaveAttribute("height", "200");
    expect(svg).toHaveAttribute("viewBox", "0 0 200 200");
  });

  it("omits the background rect when bgColor is transparent", () => {
    const opaque = render(<QRCode value="hi" bgColor="#ffffff" />);
    expect(opaque.container.querySelector("rect[fill='#ffffff']")).toBeInTheDocument();
    opaque.unmount();

    const transparent = render(<QRCode value="hi" bgColor="transparent" />);
    expect(transparent.container.querySelector("rect[fill='transparent']")).not.toBeInTheDocument();
  });

  it("produces different module patterns for different values", () => {
    const a = render(<QRCode value="hello" />);
    const aCount = a.container.querySelectorAll("rect").length;
    a.unmount();
    const b = render(<QRCode value="a much longer piece of text than hello" />);
    const bCount = b.container.querySelectorAll("rect").length;
    expect(aCount).not.toBe(bCount);
  });

  it("renders an overlaid icon image when set", () => {
    const { container } = render(<QRCode value="hi" icon="/logo.svg" />);
    const image = container.querySelector("image");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("href", "/logo.svg");
  });

  it("renders inline SVG content (not just an image URL) as the center icon", () => {
    const { container } = render(
      <QRCode value="hi" icon={<circle cx={12} cy={12} r={10} data-testid="icon-shape" />} />,
    );
    expect(container.querySelector("svg [data-testid='icon-shape']")).toBeInTheDocument();
    // No <image> element when the icon is inline content, not a URL.
    expect(container.querySelector("image")).not.toBeInTheDocument();
  });

  it("forces a normally-light module dark via pictogram, without changing the encoded value", () => {
    const plain = render(<QRCode value="hi" />);
    const moduleCount = Number(plain.container.querySelector("svg")!.getAttribute("data-rebar-module-count"));
    plain.unmount();

    // Force the very last module (bottom-right corner) dark — a spot exceedingly unlikely to
    // already be dark in a real encode, so this proves the override actually forced it.
    const pictogram = Array.from({ length: moduleCount }, () => Array<boolean | undefined>(moduleCount));
    pictogram[moduleCount - 1]![moduleCount - 1] = true;
    const { container } = render(<QRCode value="hi" pictogram={pictogram} />);
    const rects = Array.from(container.querySelectorAll("rect[data-rebar-part='module']"));
    const cell = 160 / moduleCount;
    const forced = rects.find((r) => Number(r.getAttribute("x")) === (moduleCount - 1) * cell && Number(r.getAttribute("y")) === (moduleCount - 1) * cell);
    expect(forced).toBeInTheDocument();
  });

  it("forces a real dark module light via pictogram (false)", () => {
    // The very first module (top-left, part of the top-left finder pattern) is always dark in
    // any real QR encode — a reliable target to prove `false` actually suppresses it.
    const withoutOverride = render(<QRCode value="hi" />);
    const moduleCount = Number(withoutOverride.container.querySelector("svg")!.getAttribute("data-rebar-module-count"));
    const topLeftBefore = Array.from(withoutOverride.container.querySelectorAll("rect[data-rebar-part='module']"))
      .find((r) => r.getAttribute("x") === "0" && r.getAttribute("y") === "0");
    expect(topLeftBefore).toBeInTheDocument();
    withoutOverride.unmount();

    const pictogram = Array.from({ length: moduleCount }, () => Array<boolean | undefined>(moduleCount));
    pictogram[0]![0] = false;
    const { container } = render(<QRCode value="hi" pictogram={pictogram} />);
    const topLeftAfter = Array.from(container.querySelectorAll("rect[data-rebar-part='module']"))
      .find((r) => r.getAttribute("x") === "0" && r.getAttribute("y") === "0");
    expect(topLeftAfter).toBeUndefined();
  });

  it("recolors a specific module via a string pictogram entry", () => {
    const { container } = render(<QRCode value="hi" pictogram={[[undefined, "#ff0000"]]} />);
    const recolored = container.querySelector("rect[data-rebar-part='module'][fill='#ff0000']");
    expect(recolored).toBeInTheDocument();
  });
});
