import { describe, expect, it } from "vitest";
import { REBAR_UI_VERSION } from "../index";
import packageJson from "../../package.json";

describe("REBAR_UI_VERSION", () => {
  it("matches package.json's own version field", () => {
    expect(REBAR_UI_VERSION).toBe(packageJson.version);
  });

  // Deferred by a `setTimeout(…, 0)` inside index.ts (not stamped synchronously at import time
  // any more) specifically so it lands after a hydrating consumer's own initial commit, not
  // before it -- see that file's own doc comment. A real macrotask tick, not fake timers, so this
  // exercises the exact same deferral the browser gives it.
  it("is stamped onto the document root shortly after the package is imported", async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.documentElement.getAttribute("data-rebar-ui-version")).toBe(REBAR_UI_VERSION);
  });
});
