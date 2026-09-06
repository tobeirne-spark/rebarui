import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { WordCloud } from "../components/WordCloud";

afterEach(cleanup);

describe("WordCloud", () => {
  const words = [
    { text: "React", weight: 100 },
    { text: "Sankey", weight: 50 },
    { text: "Balsamiq", weight: 10 },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<WordCloud words={words} title="Popular terms" />);
    expect(screen.getByRole("img", { name: "Popular terms" })).toBeInTheDocument();
  });

  it("falls back to a default accessible name when no title is set", () => {
    render(<WordCloud words={words} />);
    expect(screen.getByRole("img", { name: "Word cloud" })).toBeInTheDocument();
  });

  it("renders one text element per word", () => {
    const { container } = render(<WordCloud words={words} title="Popular terms" />);
    expect(container.querySelectorAll("text")).toHaveLength(words.length);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Sankey")).toBeInTheDocument();
    expect(screen.getByText("Balsamiq")).toBeInTheDocument();
  });

  it("renders the title as a visible figcaption", () => {
    const { container } = render(<WordCloud words={words} title="Popular terms" />);
    const caption = container.querySelector("figcaption");
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveTextContent("Popular terms");
  });

  it("renders no figcaption when title is omitted", () => {
    const { container } = render(<WordCloud words={words} />);
    expect(container.querySelector("figcaption")).not.toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<WordCloud words={words} title="Popular terms" />);
    expect(container.querySelector('[data-rebar-component="word-cloud"]')).toBeInTheDocument();
  });

  it("scales font size with weight — very different weights render very different sizes, both within the 12-48px clamp", () => {
    render(
      <WordCloud words={[{ text: "Tiny", weight: 1 }, { text: "Huge", weight: 1000 }]} title="Contrast check" />,
    );
    const tiny = screen.getByText("Tiny");
    const huge = screen.getByText("Huge");
    const tinySize = Number(tiny.getAttribute("font-size"));
    const hugeSize = Number(huge.getAttribute("font-size"));

    expect(tinySize).not.toBeNaN();
    expect(hugeSize).not.toBeNaN();
    expect(tinySize).not.toBeCloseTo(hugeSize);
    expect(hugeSize).toBeGreaterThan(tinySize);

    for (const size of [tinySize, hugeSize]) {
      expect(size).toBeGreaterThanOrEqual(12);
      expect(size).toBeLessThanOrEqual(48);
    }
  });
});
