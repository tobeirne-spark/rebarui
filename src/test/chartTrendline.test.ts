import { describe, expect, it } from "vitest";
import { computeTrendline } from "../chartTrendline";

describe("computeTrendline", () => {
  it("returns null for fewer than 2 points", () => {
    expect(computeTrendline([])).toBeNull();
    expect(computeTrendline([{ x: 0, y: 5 }])).toBeNull();
  });

  it("returns null when every x is identical (no slope-intercept form)", () => {
    expect(
      computeTrendline([
        { x: 1, y: 5 },
        { x: 1, y: 10 },
      ]),
    ).toBeNull();
  });

  it("fits a perfect line exactly", () => {
    const trend = computeTrendline([
      { x: 0, y: 2 },
      { x: 1, y: 4 },
      { x: 2, y: 6 },
      { x: 3, y: 8 },
    ]);
    expect(trend).not.toBeNull();
    expect(trend!.slope).toBeCloseTo(2, 10);
    expect(trend!.intercept).toBeCloseTo(2, 10);
  });

  it("fits a real least-squares regression over noisy points", () => {
    const trend = computeTrendline([
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 2 },
      { x: 3, y: 5 },
      { x: 4, y: 4 },
    ]);
    expect(trend).not.toBeNull();
    // Known OLS result for this exact dataset (n=5, sumX=10, sumY=15, sumXY=38, sumXX=30):
    // slope = (5*38 - 10*15) / (5*30 - 10^2) = 40/50 = 0.8; intercept = (15 - 0.8*10)/5 = 1.4.
    expect(trend!.slope).toBeCloseTo(0.8, 10);
    expect(trend!.intercept).toBeCloseTo(1.4, 10);
  });
});
