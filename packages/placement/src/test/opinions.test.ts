import { describe, expect, it } from "vitest";
import { OPINION_CONSTRUCT_TYPES, isOpinionConstructType } from "../opinions";

describe("opinions", () => {
  it("OPINION_CONSTRUCT_TYPES covers exactly the blocks with a live source/onX binding, and no others", () => {
    expect([...OPINION_CONSTRUCT_TYPES].sort()).toEqual(
      [
        "ai-chat",
        "table",
        "form",
        "goal-tracker",
        "card-kanban",
        "sticky-kanban",
        "wizard",
        "scatter-chart",
        "line-chart",
        "stacked-bar-chart",
      ].sort(),
    );
  });

  it("isOpinionConstructType agrees with OPINION_CONSTRUCT_TYPES", () => {
    expect(isOpinionConstructType("ai-chat")).toBe(true);
    expect(isOpinionConstructType("hero")).toBe(false);
    expect(isOpinionConstructType("site-header")).toBe(false);
  });
});
