import { describe, expect, it } from "vitest";
import { REBAR_UI_VERSION } from "../index";
import packageJson from "../../package.json";

describe("REBAR_UI_VERSION", () => {
  it("matches package.json's own version field", () => {
    expect(REBAR_UI_VERSION).toBe(packageJson.version);
  });

  it("is stamped onto the document root the moment the package is imported", () => {
    expect(document.documentElement.getAttribute("data-rebar-ui-version")).toBe(REBAR_UI_VERSION);
  });
});
