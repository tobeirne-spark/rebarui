import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AspectRatio } from "../components/AspectRatio";
import { resolveRatioPlaceholder } from "../components/ratioPlaceholder";
import { RATIO_PLACEHOLDERS } from "../assets/ratioPlaceholders";

describe("AspectRatio", () => {
  it("carries data-rebar-component on the root", () => {
    render(<AspectRatio />);
    expect(document.querySelector('[data-rebar-component="aspect-ratio"]')).not.toBeNull();
  });

  it("shows an empty placeholder box when neither src nor placeholder is set", () => {
    render(<AspectRatio />);
    expect(document.querySelector('[data-rebar-part="empty"]')).not.toBeNull();
  });

  it("renders a real img when src is set", () => {
    render(<AspectRatio src="https://example.com/photo.jpg" alt="A photo" />);
    const img = screen.getByAltText("A photo");
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
  });

  it("renders a placeholder img when placeholder is set and src is not", () => {
    render(<AspectRatio ratio={16 / 9} placeholder />);
    const img = document.querySelector(".rebar-aspect-ratio-image");
    expect(img).not.toBeNull();
    expect((img as HTMLImageElement).src).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("prefers a real src over placeholder when both are set", () => {
    render(<AspectRatio src="https://example.com/photo.jpg" placeholder alt="Real" />);
    expect(screen.getByAltText("Real")).toHaveAttribute("src", "https://example.com/photo.jpg");
  });

  it("picks a different variant of the same ratio when placeholder is a number", () => {
    render(<AspectRatio ratio={16 / 9} placeholder={0} alt="First" />);
    const first = (screen.getByAltText("First") as HTMLImageElement).src;
    render(<AspectRatio ratio={16 / 9} placeholder={1} alt="Second" />);
    const second = (screen.getByAltText("Second") as HTMLImageElement).src;
    expect(first).not.toBe(second);
  });

  it("wraps the image in a real Watermark overlay when set", () => {
    const { container } = render(
      <AspectRatio src="https://example.com/photo.jpg" alt="Licensed photo" watermark="© Example Co." />,
    );
    const watermark = container.querySelector('[data-rebar-component="watermark"]');
    expect(watermark).toBeInTheDocument();
    expect(screen.getByAltText("Licensed photo")).toBeInTheDocument();
  });

  it("omits the watermark overlay by default", () => {
    const { container } = render(<AspectRatio src="https://example.com/photo.jpg" />);
    expect(container.querySelector('[data-rebar-component="watermark"]')).not.toBeInTheDocument();
  });
});

describe("resolveRatioPlaceholder", () => {
  it("returns one of the embedded placeholders", () => {
    expect(RATIO_PLACEHOLDERS).toContain(
      RATIO_PLACEHOLDERS.find((p) => p.src === resolveRatioPlaceholder(1)),
    );
  });

  it("picks the closest match rather than an exact-only match", () => {
    // 1.7 isn't any embedded ratio exactly, but 16/9 (~1.778) is the closest available.
    const sixteenNine = RATIO_PLACEHOLDERS.find((p) => Math.abs(p.ratio - 16 / 9) < 0.001)!;
    expect(resolveRatioPlaceholder(1.7)).toBe(sixteenNine.src);
  });

  it("is deterministic for the same ratio", () => {
    expect(resolveRatioPlaceholder(4 / 3)).toBe(resolveRatioPlaceholder(4 / 3));
  });

  it("has more than one variant for at least one ratio", () => {
    const counts = new Map<number, number>();
    for (const p of RATIO_PLACEHOLDERS) counts.set(p.ratio, (counts.get(p.ratio) ?? 0) + 1);
    expect(Math.max(...counts.values())).toBeGreaterThan(1);
  });

  it("selects among same-ratio variants by index", () => {
    const a = resolveRatioPlaceholder(16 / 9, 0);
    const b = resolveRatioPlaceholder(16 / 9, 1);
    expect(a).not.toBe(b);
  });
});
