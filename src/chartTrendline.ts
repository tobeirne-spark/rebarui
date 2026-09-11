export interface TrendlinePoint {
  x: number;
  y: number;
}

/**
 * Ordinary least-squares linear regression over (x, y) points — the trendline every chart in this
 * project's "trendline" family draws (`LineChart`, `AreaChart`, `BarChart`, `ScatterChart`,
 * `BubbleChart`, `StepChart`, `IndexChart`), sharing one implementation rather than seven
 * independent copies of the same formula. Returns `null` when there are fewer than 2 points or
 * every x is identical (a vertical "line" has no slope-intercept form) — the caller skips drawing
 * a trendline rather than dividing by zero, the same "no data → no broken geometry" discipline
 * `chartEmptyState.tsx` documents for scale math generally.
 */
export function computeTrendline(points: TrendlinePoint[]): { slope: number; intercept: number } | null {
  const n = points.length;
  if (n < 2) return null;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}
