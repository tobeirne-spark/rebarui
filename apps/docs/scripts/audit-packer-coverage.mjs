// Measures how much of each marketing/docs page is actually printed by the Packer
// (@rebar-ui/placement's BlockRenderer) versus hand-authored rebar-ui component JSX — see
// ref/PACKER_COVERAGE.md for the write-up this feeds. Every block BlockRenderer renders carries
// data-rebar-placement-block on its root (verified directly against BlockRenderer.tsx, not
// assumed) — that attribute is this project's "maker's mark." A real rebar-ui component
// (data-rebar-component) counts as Packer-printed if it sits inside such a marked subtree,
// hand-authored otherwise. Run against a live dev server: `node scripts/audit-packer-coverage.mjs`.
import { chromium } from "@playwright/test";

const BASE_URL = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";

const ROUTES = [
  "/", "/about",
  "/benchmarks", "/benchmarks/scenarios", "/benchmarks/receipts", "/benchmarks/claude",
  "/benchmarks/qwen", "/benchmarks/kimi", "/benchmarks/tiers", "/benchmarks/iteration",
  "/imitations", "/synthetics", "/opinions", "/orders", "/about/agent",
  "/synthetics/aspect-ratio", "/imitations/avatar", "/imitations/badge",
  "/orders/breadcrumb", "/imitations/button", "/synthetics/card", "/imitations/carousel",
  "/opinions/cascader", "/opinions/color-picker", "/opinions/combobox",
  "/synthetics/descriptions", "/opinions/dialog", "/imitations/divider", "/opinions/editable",
  "/synthetics/empty", "/opinions/form", "/opinions/hover-card", "/opinions/kanban",
  "/opinions/multi-select",
  "/orders/nav-bar", "/orders/nav-index", "/imitations/number-input",
  "/imitations/pagination", "/imitations/pin-input", "/opinions/popover", "/imitations/rate",
  "/synthetics/result", "/orders/section-nav", "/imitations/segmented-control",
  "/imitations/skeleton", "/imitations/spin", "/imitations/statistic", "/synthetics/steps",
  "/synthetics/sticky", "/opinions/scatter-chart", "/opinions/line-chart",
  "/opinions/stacked-bar-chart", "/opinions/table", "/imitations/qr-code",
  "/imitations/watermark",
  "/imitations/tag", "/synthetics/timeline", "/opinions/tree-view", "/opinions/wizard",
  "/synthetics/bar-chart", "/opinions/area-chart", "/synthetics/sparkline",
  "/synthetics/pie-chart", "/synthetics/gauge-chart", "/synthetics/funnel-chart",
  "/synthetics/waterfall-chart", "/opinions/radar-chart", "/opinions/box-plot",
  "/opinions/drawer", "/opinions/bottom-sheet", "/opinions/action-sheet",
  "/orders/mobile-tab-bar", "/imitations/scroll-area", "/opinions/split-button",
  "/opinions/calendar", "/opinions/time-picker", "/opinions/resizable-panels",
  "/opinions/transfer", "/opinions/command-palette", "/imitations/barcode",
  "/opinions/date-picker", "/opinions/image", "/opinions/lightbox",
  "/opinions/file-upload", "/opinions/bubble-chart", "/opinions/heatmap",
  "/opinions/rich-text-editor", "/opinions/pull-to-refresh", "/opinions/picker-wheel",
  "/opinions/swipe-actions", "/synthetics/treemap", "/synthetics/candlestick-chart",
  "/synthetics/geo-chart", "/synthetics/gantt-chart", "/synthetics/sankey-diagram",
  "/synthetics/word-cloud", "/opinions/node-link-graph",
  "/opinions/data-grid", "/synthetics/pivot-table", "/opinions/org-chart",
  "/opinions/mind-map", "/opinions/flowchart", "/synthetics/diagram-minimap",
  "/opinions/popconfirm", "/opinions/tree-select", "/opinions/tour",
  "/opinions/mentions", "/synthetics/back-top", "/synthetics/affix",
  "/synthetics/avatar-group",
  "/synthetics/button-group", "/opinions/speed-dial", "/synthetics/masonry",
  "/opinions/collapsible", "/imitations/toggle", "/imitations/toggle-group",
  "/opinions/context-menu", "/opinions/menubar",
  "/synthetics/git-graph", "/opinions/version-history", "/synthetics/chat-thread",
  "/opinions/waveform-audio-player", "/opinions/upload-queue", "/synthetics/infinite-scroll-grid",
  "/opinions/text-to-speech-bar", "/opinions/floating-selection-toolbar",
  "/opinions/slash-command-menu", "/opinions/voice-composer", "/opinions/shape-gallery",
  "/opinions/file-manager", "/opinions/layers-panel",
  "/docs", "/docs/contributing", "/docs/design-philosophy", "/docs/devtools",
  "/docs/getting-started", "/about/agent", "/docs/mobile-skew",
  "/docs/migration", "/docs/packer-coverage", "/docs/agents-md", "/docs/theming", "/docs/token-estimate",
  "/status",
];

const browser = await chromium.launch();
const page = await browser.newPage();
const rows = [];

for (const route of ROUTES) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
  const result = await page.evaluate(() => {
    const components = Array.from(document.querySelectorAll("[data-rebar-component]"));
    let printed = 0;
    const handDrawn = [];
    for (const el of components) {
      if (el.closest("[data-rebar-placement-block]")) printed++;
      else handDrawn.push(el.getAttribute("data-rebar-component"));
    }
    const blocks = new Set(
      Array.from(document.querySelectorAll("[data-rebar-placement-block]")).map((el) =>
        el.getAttribute("data-rebar-placement-block"),
      ),
    );
    return {
      total: components.length,
      printed,
      handDrawn: handDrawn.length,
      handDrawnKinds: [...new Set(handDrawn)],
      blockTypes: [...blocks],
    };
  });
  const pct = result.total > 0 ? Math.round((result.printed / result.total) * 100) : null;
  rows.push({ route, ...result, pct });
}

await browser.close();

console.log(
  "route".padEnd(32),
  "total".padStart(6),
  "printed".padStart(8),
  "hand".padStart(6),
  "pct".padStart(5),
  " hand-drawn kinds",
);
for (const r of rows) {
  console.log(
    r.route.padEnd(32),
    String(r.total).padStart(6),
    String(r.printed).padStart(8),
    String(r.handDrawn).padStart(6),
    (r.pct === null ? "—" : `${r.pct}%`).padStart(5),
    " " + r.handDrawnKinds.join(", "),
  );
}

console.log("\nJSON:\n" + JSON.stringify(rows, null, 2));
