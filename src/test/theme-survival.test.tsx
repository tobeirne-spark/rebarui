import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Alert } from "../components/Alert";

/**
 * Proves the core value proposition from ref/ARCHITECTURE.md: components never branch
 * behavior on theme. Rendering the same tree under different `data-rebar-theme` values
 * must produce identical data-rebar-* attributes and ARIA roles — only CSS custom
 * property *values* (defined in theme-sketch/theme-clean, not exercised here) may differ.
 */
describe("survives a theme swap", () => {
  const renderSample = () =>
    render(
      <div>
        <Card>
          <Button variant="primary">Save changes</Button>
          <Alert type="error" title="Email is required" />
        </Card>
      </div>,
    );

  for (const theme of ["sketch", "clean"] as const) {
    it(`produces identical structural output under data-rebar-theme="${theme}"`, () => {
      document.documentElement.setAttribute("data-rebar-theme", theme);
      renderSample();

      const button = screen.getByRole("button", { name: "Save changes" });
      expect(button).toHaveAttribute("data-rebar-component", "button");
      expect(button).toHaveAttribute("data-rebar-variant", "primary");

      expect(screen.getByRole("alert")).toHaveAttribute(
        "data-rebar-component",
        "alert",
      );

      document.documentElement.removeAttribute("data-rebar-theme");
    });
  }
});
