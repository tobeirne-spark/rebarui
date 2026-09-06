import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CandlestickChart } from "../components/CandlestickChart";

afterEach(cleanup);

describe("CandlestickChart", () => {
  const data = [
    { label: "Mon", open: 10, high: 15, low: 8, close: 12 },
    { label: "Tue", open: 12, high: 14, low: 9, close: 9 },
    { label: "Wed", open: 9, high: 11, low: 7, close: 10 },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<CandlestickChart data={data} title="Weekly price" />);
    expect(screen.getByRole("img", { name: "Weekly price" })).toBeInTheDocument();
  });

  it("falls back to ariaLabel, then a default, for the accessible name", () => {
    render(<CandlestickChart data={data} ariaLabel="Custom label" />);
    expect(screen.getByRole("img", { name: "Custom label" })).toBeInTheDocument();

    cleanup();
    render(<CandlestickChart data={data} />);
    expect(screen.getByRole("img", { name: "Candlestick chart" })).toBeInTheDocument();
  });

  it("renders one wick and one body per data point, plus each label", () => {
    const { container } = render(<CandlestickChart data={data} title="Weekly price" />);
    // Wicks live inside a "candle" group so grid lines (also <line>s) aren't counted.
    expect(container.querySelectorAll('[data-rebar-part="candle"] line')).toHaveLength(data.length);
    // No other rects are drawn on this chart, so a plain count is safe here.
    expect(container.querySelectorAll("rect")).toHaveLength(data.length);
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
  });

  it("renders a real y-axis with tick labels derived from the data's own low/high range", () => {
    const { container } = render(<CandlestickChart data={data} title="Weekly price" />);
    // 5 evenly spaced ticks, same convention as LineChart/ScatterChart.
    const gridLines = container.querySelectorAll('svg > g > line[stroke*="border"]');
    expect(gridLines.length).toBe(5);
    const axisTexts = Array.from(container.querySelectorAll("text")).filter((el) =>
      /^\d+\.\d{2}$/.test(el.textContent ?? ""),
    );
    expect(axisTexts.length).toBeGreaterThanOrEqual(5);
  });

  it("renders the title as a visible caption", () => {
    const { container } = render(<CandlestickChart data={data} title="Weekly price" />);
    const caption = container.querySelector("figcaption");
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveTextContent("Weekly price");
  });

  it("omits the caption when no title is given", () => {
    const { container } = render(<CandlestickChart data={data} />);
    expect(container.querySelector("figcaption")).not.toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<CandlestickChart data={data} title="Weekly price" />);
    expect(container.querySelector('[data-rebar-component="candlestick-chart"]')).toBeInTheDocument();
  });

  it("colors a down candle (close < open) differently from an up candle, using downColor", () => {
    const { container } = render(
      <CandlestickChart
        data={[
          { label: "Up", open: 10, high: 15, low: 8, close: 14 },
          { label: "Down", open: 14, high: 15, low: 8, close: 10 },
        ]}
        title="Up vs down"
        upColor="#2e7d32"
        downColor="#d32f2f"
      />,
    );
    const bodies = container.querySelectorAll("rect");
    expect(bodies).toHaveLength(2);
    expect(bodies[0]).toHaveAttribute("fill", "#2e7d32");
    expect(bodies[1]).toHaveAttribute("fill", "#d32f2f");
    expect(bodies[0]?.getAttribute("fill")).not.toBe(bodies[1]?.getAttribute("fill"));
  });
});
