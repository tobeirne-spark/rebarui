"use client";

import { useEffect, useState } from "react";
import { useComponentCounts } from "./useComponentCounts";
import { estimateMigrationEffort } from "./migrationEffort";
import { estimateTokenCost, MODEL_DOCS_PATH, type TokenEstimate } from "./tokenEstimate";
import { GridOverlay } from "./GridOverlay";
import { ComponentInspector } from "./ComponentInspector";

export interface RebarDevToolsProps {
  /**
   * Bypasses the NODE_ENV==='development' gate. For tests/tooling only — never set this
   * in application code, or the panel ships to production.
   */
  forceEnabled?: boolean;
}

// Not exposed as a panel control — it was confusing without the methodology page's context
// (packages/devtools/src/tokenEstimate.ts / /docs/token-estimate) open alongside it. Fixed here
// instead of editable in the UI; still just a stated assumption, documented on that page.
const ASSUMED_LOGIC_ITERATIONS = 5;

function downloadReport(
  counts: ReturnType<typeof useComponentCounts>,
  score: number,
  effort: string,
  tokenEstimate: TokenEstimate,
) {
  const report = {
    generatedAt: new Date().toISOString(),
    totalComponents: counts.total,
    componentsByType: counts.byType,
    migrationEffort: {
      score,
      effort,
      note: "Illustrative heuristic derived from component counts, not a measured cost.",
    },
    tokenEstimate: {
      ...tokenEstimate,
      note: `A documented estimation model with stated, editable assumptions — not a measured cost. Full methodology: ${MODEL_DOCS_PATH}`,
    },
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rebar-devtools-report-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// A hard page refresh serves fresh HTML with none of these attributes baked in — the DevTools
// panel is the only thing that ever sets them, client-side, after mount. Without persisting the
// user's actual choice somewhere that survives a reload, every refresh silently reset theme/dark/
// bionic back to their defaults regardless of what was picked. localStorage read failures (private
// browsing, disabled storage) fall back to the same defaults that shipped before this fix existed —
// never crash the panel over a missing preference.
const STORAGE_KEYS = {
  theme: "rebar-devtools-theme",
  dark: "rebar-devtools-dark",
  bionic: "rebar-devtools-bionic",
} as const;

function readStoredTheme(): "sketch" | "clean" | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.theme);
    return stored === "sketch" || stored === "clean" ? stored : null;
  } catch {
    return null;
  }
}

function readStoredBoolean(key: string): boolean | null {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? null : stored === "true";
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing / storage disabled — the toggle still works for this page load via state,
    // it just won't survive a refresh. Not worth surfacing to the user over a devtools panel.
  }
}

export function RebarDevTools({ forceEnabled }: RebarDevToolsProps) {
  const isDev = forceEnabled ?? process.env.NODE_ENV === "development";

  const [isOpen, setIsOpen] = useState(false);
  // Prefer the persisted choice; fall back to the page's actual current theme attribute (helps
  // across a client-side navigation within the same document) rather than hardcoding "sketch" —
  // a hardcoded default would otherwise silently clobber whatever the consuming app really
  // configured (e.g. layout.tsx's "clean") the instant DevTools mounts, before anyone touches the
  // panel, and before either of those, there's nothing stored or set at all.
  const [theme, setThemeState] = useState<"sketch" | "clean">(() => {
    const stored = readStoredTheme();
    if (stored) return stored;
    return typeof document !== "undefined" && document.documentElement.getAttribute("data-rebar-theme") === "sketch"
      ? "sketch"
      : "clean";
  });
  const [dark, setDarkState] = useState(() => readStoredBoolean(STORAGE_KEYS.dark) ?? false);
  const [bionic, setBionicState] = useState(() => readStoredBoolean(STORAGE_KEYS.bionic) ?? false);
  const [showGrid, setShowGrid] = useState(false);
  const [showInspector, setShowInspector] = useState(false);

  const setTheme = (next: "sketch" | "clean") => {
    setThemeState(next);
    writeStored(STORAGE_KEYS.theme, next);
  };
  const setDark = (next: boolean) => {
    setDarkState(next);
    writeStored(STORAGE_KEYS.dark, String(next));
  };
  const setBionic = (next: boolean) => {
    setBionicState(next);
    writeStored(STORAGE_KEYS.bionic, String(next));
  };

  const counts = useComponentCounts(isDev && isOpen);
  const { score, effort } = estimateMigrationEffort(counts);
  const tokenEstimate = estimateTokenCost(counts, ASSUMED_LOGIC_ITERATIONS);

  useEffect(() => {
    if (!isDev) return;
    document.documentElement.setAttribute("data-rebar-theme", theme);
  }, [isDev, theme]);

  useEffect(() => {
    if (!isDev) return;
    if (dark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [isDev, dark]);

  useEffect(() => {
    if (!isDev) return;
    if (bionic) {
      document.documentElement.setAttribute("data-rebar-bionic", "true");
    } else {
      document.documentElement.removeAttribute("data-rebar-bionic");
    }
  }, [isDev, bionic]);

  if (!isDev) return null;

  const sortedTypes = Object.entries(counts.byType).sort((a, b) => b[1] - a[1]);
  // Stamped by rebar-ui's own entry module the moment it's first imported (see
  // `packages/core/src/index.ts`'s `REBAR_UI_VERSION`) — reading it here, rather than importing
  // the constant directly, keeps this package free of a hard dependency on `rebar-ui` itself, and
  // works for any rebar-ui-built page regardless of which package versions devtools itself ships
  // alongside.
  const rebarUiVersion =
    typeof document !== "undefined" ? document.documentElement.getAttribute("data-rebar-ui-version") : null;

  return (
    <>
      <div className="rebar-devtools" data-rebar-component="devtools">
        <button
          type="button"
          className="rebar-devtools-toggle"
          onClick={() => setIsOpen((value) => !value)}
          aria-label="Rebar DevTools"
          aria-expanded={isOpen}
        >
          🔧
        </button>

        {isOpen ? (
          <div className="rebar-devtools-panel" role="dialog" aria-label="Rebar DevTools">
            <div className="rebar-devtools-header">
              <strong>Rebar DevTools</strong>
              {rebarUiVersion ? <span className="rebar-devtools-version">v{rebarUiVersion}</span> : null}
              <button
                type="button"
                className="rebar-devtools-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="rebar-devtools-section">
              <div className="rebar-devtools-stat">
                <span>Components on this page</span>
                <strong>{counts.total}</strong>
              </div>
              {sortedTypes.length > 0 ? (
                <ul className="rebar-devtools-breakdown">
                  {sortedTypes.map(([type, count]) => (
                    <li key={type}>
                      <span>{type}</span>
                      <span>{count}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="rebar-devtools-section">
              <div className="rebar-devtools-stat">
                <span>Migration effort</span>
                <strong>{effort}</strong>
              </div>
              <p className="rebar-devtools-hint">
                Score {score} — a rough, configurable heuristic based on component-type
                complexity, not a measured cost.
              </p>
            </div>

            <div className="rebar-devtools-section">
              <div className="rebar-devtools-stat">
                <span>Token estimate</span>
              </div>
              <ul className="rebar-devtools-breakdown">
                <li>
                  <span>AntD, built directly</span>
                  <span>{Math.round(tokenEstimate.antdDirect).toLocaleString()}</span>
                </li>
                <li>
                  <span>Rebar only</span>
                  <span>{Math.round(tokenEstimate.rebarOnly).toLocaleString()}</span>
                </li>
                <li>
                  <span>Rebar, then migrate once</span>
                  <span>{Math.round(tokenEstimate.rebarThenMigrate).toLocaleString()}</span>
                </li>
              </ul>
              <p className="rebar-devtools-hint">
                {tokenEstimate.breakevenIterations !== null
                  ? `Pays for itself after ~${Math.ceil(tokenEstimate.breakevenIterations)} revisions of this page, migration included.`
                  : "No breakeven for this component mix — antd direct stays cheaper at any iteration count."}
              </p>
              <p className="rebar-devtools-hint">
                A documented model with stated, editable assumptions — not a measured cost. See the
                real measured numbers on the <a href="/benchmarks">benchmarks page</a>.
              </p>
            </div>

            <div className="rebar-devtools-section rebar-devtools-toggles">
              <label>
                <input
                  type="radio"
                  name="rebar-devtools-theme"
                  checked={theme === "sketch"}
                  onChange={() => setTheme("sketch")}
                />
                Sketch theme
              </label>
              <label>
                <input
                  type="radio"
                  name="rebar-devtools-theme"
                  checked={theme === "clean"}
                  onChange={() => setTheme("clean")}
                />
                Clean theme
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={dark}
                  onChange={(event) => setDark(event.target.checked)}
                />
                Dark mode
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={bionic}
                  onChange={(event) => setBionic(event.target.checked)}
                />
                Bionic reading
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(event) => setShowGrid(event.target.checked)}
                />
                Show 8pt grid
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showInspector}
                  onChange={(event) => setShowInspector(event.target.checked)}
                />
                Component inspector
              </label>
            </div>

            <button
              type="button"
              className="rebar-devtools-export"
              onClick={() => downloadReport(counts, score, effort, tokenEstimate)}
            >
              Export report (JSON)
            </button>
          </div>
        ) : null}
      </div>

      <GridOverlay enabled={showGrid} />
      <ComponentInspector enabled={showInspector} />
    </>
  );
}
