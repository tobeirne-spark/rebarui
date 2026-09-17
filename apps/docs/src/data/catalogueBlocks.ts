/**
 * Structured catalogue of all block types, extracted from inline definitions
 * in the tier catalogue pages (synthetics, opinions, orders).
 * 
 * This data drives:
 * - Individual block detail pages (future)
 * - Catalogue page rendering (refactored to import from here)
 * - Block navigation and filtering
 */

import type { Construct } from "@rebar-ui/placement";

export interface ConstructCatalogueEntry {
  id: string;
  tier: "synthetic" | "opinion" | "order";
  measured: boolean;
  description: string;
  shape: string;
  blocks?: Construct[];
}

export const CATALOGUE_BLOCKS: ConstructCatalogueEntry[] = [
  // ═══════════════════════════════════════════════════════════════════
  // SYNTHETIC TIER (22 blocks)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "header",
    tier: "synthetic",
    measured: false,
    description: "A page-top bar with a title and an optional action button. Presentational only — no navigation, no click handlers wired (see 'orders' for blocks that actually bind to live data).",
    shape: `{ type: "header", title: string, action?: Action }`,
    blocks: [
      {
        type: "header",
        title: "Example header",
        action: { label: "Primary", variant: "primary" },
      },
    ],
  },
  {
    id: "banner",
    tier: "synthetic",
    measured: false,
    description: "A full-width status banner — one of four tones (info, success, warning, error), with an optional title, description, and a single action button. Used for page-level alerts, not inline feedback.",
    shape: `{ type: "banner", tone: "info"|"success"|"warning"|"error", text: string, action?: Action }`,
    blocks: [
      {
        type: "banner",
        tone: "info",
        text: "Heads up — this is an informational banner.",
        action: { label: "Learn more" },
      },
    ],
  },
  {
    id: "checklist",
    tier: "synthetic",
    measured: true,
    description: "A simple vertical list of items with checkmarks — no interactivity, no state, just a static rendering of what's done and what's not. The most basic 'progress' shape in the system.",
    shape: `{ type: "checklist", heading?: string, items: string[] }`,
    blocks: [
      {
        type: "checklist",
        heading: "Example checklist",
        items: ["First item", "Second item", "Third item"],
      },
    ],
  },
  {
    id: "callout",
    tier: "synthetic",
    measured: true,
    description: "A bordered card with a title, optional subtitle, and body text — one of four tones (info, success, warning, error). Used for inline contextual feedback, not page-level alerts (see banner for that).",
    shape: `{ type: "callout", tone: "info"|"success"|"warning"|"error", title: string, subtitle?: string }`,
    blocks: [
      {
        type: "callout",
        tone: "info",
        title: "Example callout",
        subtitle: "With a subtitle",
      },
    ],
  },
  {
    id: "spin-card",
    tier: "synthetic",
    measured: false,
    description: "A small, centered card showing a real loading overlay (Spin) over a few lines of content — for demonstrating a loading state, not a real data-bound card. Generic rather than one-off: tip, content lines, and card size are all caller-supplied, not hardcoded to any one demo.",
    shape: `{ type: "spin-card", tip?: string, items: string[], width?: number, minHeight?: number }`,
    blocks: [
      {
        type: "spin-card",
        tip: "Fetching",
        items: ["Project A", "Project B", "Project C"],
      },
    ],
  },
  {
    id: "error-block",
    tier: "synthetic",
    measured: false,
    description: "A whole-page failure/empty state — status picks a sensible default icon/title/description (default, disconnected, empty, busy), all overridable; action renders a real retry button the same small-secondary way banner/header/callout render theirs. This project's first genuinely Mobile-only block (see ref/BLOCKS.md) — every other antd-mobile-derived pattern shipped so far landed as a packages/core component only, never promoted into a block. fullPage is on by default here, since a dedicated block for this is specifically for the whole-page case; set it false for an inline, one-card failure state.",
    shape: `{ type: "error-block", status?: "default"|"disconnected"|"empty"|"busy", title?: string, description?: string, action?: Action, fullPage?: boolean }`,
    blocks: [
      {
        type: "error-block",
        status: "disconnected",
        action: { label: "Retry" },
      },
    ],
  },
  {
    id: "footer",
    tier: "synthetic",
    measured: false,
    description: "Page-bottom chrome: a 'no more results' label (a real Divider with text), a plain content line, a row of links, and a row of chips — every section independently optional. Mirrors how site-header already wraps NavBar for the top of a page; this project's second Mobile block (see ref/BLOCKS.md). No onLinkClick/onChipClick in the schema — a click handler isn't serializable Construct[] data.",
    shape: `{ type: "footer", label?: string, content?: string, links?: { text: string, href: string }[], chips?: { text: string, type?: "plain"|"link" }[] }`,
    blocks: [
      {
        type: "footer",
        label: "No more results",
        content: "© 2026 Example Inc.",
        links: [{ text: "Terms", href: "#" }, { text: "Privacy", href: "#" }],
        chips: [{ text: "New" }, { text: "Feedback", type: "link" }],
      },
    ],
  },
  {
    id: "feature-grid",
    tier: "synthetic",
    measured: true,
    description: "A wrapping row of small title+body pairs — no links, no images, just short feature copy.",
    shape: `{ type: "feature-grid", items: { title: string, body: string }[] }`,
    blocks: [
      {
        type: "feature-grid",
        items: [
          { title: "Headless", body: "Radix underneath." },
          { title: "Replaceable", body: "CSS-variable theming." },
          { title: "Tested", body: "Playwright-checked on every change." },
        ],
      },
    ],
  },
  {
    id: "pillar-grid",
    tier: "synthetic",
    measured: true,
    description: "A row of cards, each with a title, body copy, and a CTA link — the homepage's three-pillars grid.",
    shape: `{ type: "pillar-grid", items: { title: string, body: string, href: string, cta: string }[] }`,
    blocks: [
      {
        type: "pillar-grid",
        items: [
          { title: "Imitations", body: "Static, standalone primitives.", href: "/imitations", cta: "Browse" },
          { title: "Opinions", body: "Real state, real interactivity.", href: "/opinions", cta: "Browse" },
          { title: "Benchmarks", body: "Measured token, speed, and consistency data.", href: "/about/benchmarks", cta: "Browse" },
        ],
      },
    ],
  },
  {
    id: "hero",
    tier: "synthetic",
    measured: false,
    description: "A centered page-top hero: optional badge, title, subtitle, action buttons, and an optional code snippet. Badge and subtitle support a tiny inline markup (backtick-code, [label](href) links).",
    shape: `{ type: "hero", badge?: string, title: string, subtitle: string, actions?: Action[], codeSnippet?: string }`,
    blocks: [
      {
        type: "hero",
        badge: "v0.5",
        title: "Example Hero",
        subtitle: "A subtitle with `inline code` and a [link](/imitations).",
        actions: [{ label: "Primary action", variant: "primary" }],
      },
    ],
  },
  {
    id: "section-header",
    tier: "synthetic",
    measured: false,
    description: "A centered kicker/title/subtitle block — used between homepage sections.",
    shape: `{ type: "section-header", kicker?: string, title: string, subtitle?: string }`,
    blocks: [
      {
        type: "section-header",
        kicker: "Example kicker",
        title: "Section title",
        subtitle: "Section subtitle.",
      },
    ],
  },
  {
    id: "card-grid",
    tier: "synthetic",
    measured: false,
    description: 'A wrapping grid of cards — title, optional body copy, optional status tags, optional link — for an index/directory of many similar named things (see the tier pages, all built through this block). Distinct from feature-grid (no link, no tags, meant for a handful of short callouts) and pillar-grid (a fixed small set with a mandatory CTA): card-grid is for an open-ended, possibly large list where each item may or may not have a description, a link, or a status yet.',
    shape: `{ type: "card-grid", items: { title: string, body?: string, href?: string, linkLabel?: string, tags?: { label: string, tone?: Tone }[] }[] }`,
    blocks: [
      {
        type: "card-grid",
        items: [
          { title: "Avatar", body: "Illustrated placeholder art.", href: "#", linkLabel: "View reference →" },
          { title: "Accordion", tags: [{ label: "No reference page", tone: "warning" }] },
          { title: "DatePicker", body: "Calendar popup for picking a date.", tags: [{ label: "Planned", tone: "warning" }] },
        ],
      },
    ],
  },
  {
    id: "persona-card",
    tier: "synthetic",
    measured: false,
    description: 'A row of identity cards — avatar + name + optional meta line. Catalogued as "Persona / User Card" and flagged at catalogue time as "arguably an Avatar+Text composition, not a new primitive" — exactly the case for a block: no new component needed, just a fixed layout of two that already ship.',
    shape: `{ type: "persona-card", items: { name: string, meta?: string, avatarSrc?: string, avatarPlaceholder?: boolean }[] }`,
    blocks: [
      {
        type: "persona-card",
        items: [
          { name: "Priya Shah", meta: "Engineering lead", avatarPlaceholder: true },
          { name: "Marcus Webb", meta: "Design", avatarPlaceholder: true },
        ],
      },
    ],
  },
  {
    id: "data-list",
    tier: "synthetic",
    measured: false,
    description: "A vertical stack of title+badge rows — a lighter-weight alternative to table for a simple list of named items.",
    shape: `{ type: "data-list", items: { title: string, badge?: string }[] }`,
    blocks: [
      {
        type: "data-list",
        items: [
          { title: "Marketing Site Redesign", badge: "Active" },
          { title: "Legacy API Migration", badge: "Archived" },
        ],
      },
    ],
  },
  {
    id: "filter-bar",
    tier: "synthetic",
    measured: false,
    description: "A search input plus an optional filter select and a trailing primary action button, all in one row. Presentational only — nothing downstream is wired to it (see 'opinions' for blocks that actually bind to live data).",
    shape: `{ type: "filter-bar", searchPlaceholder?: string, filterLabel?: string, filterOptions?: string[], actionLabel?: string }`,
    blocks: [
      {
        type: "filter-bar",
        searchPlaceholder: "Search projects…",
        filterOptions: ["All", "Active", "Archived"],
        actionLabel: "New Project",
      },
    ],
  },
  {
    id: "form",
    tier: "synthetic",
    measured: false,
    description: "A card containing labeled fields (text/email/date/textarea/select/checkbox, each optionally required) and an optional submit button. Presentational only — no validation, no submit handler wired (see the real Form/FormItem components, or ai-chat/table under 'opinions' for blocks that actually bind to live data). Omit submitLabel when nested inside a modal, which supplies its own action buttons.",
    shape: `{ type: "form", heading?: string, fields: FormField[], submitLabel?: string }`,
    blocks: [
      {
        type: "form",
        heading: "Account Settings",
        fields: [{ kind: "text", label: "Display name", placeholder: "e.g. Jane Doe" }],
        submitLabel: "Save changes",
      },
    ],
  },
  {
    id: "doc-section",
    tier: "synthetic",
    measured: false,
    description: "A heading (level 1, 2, or 3) plus prose/code/list content — the block type every /docs/* page is built from, including each page's own title (level 1) and intro paragraph, not just its subsections. Prose text supports the same tiny inline markup as hero.",
    shape: `{ type: "doc-section", heading?: string, level?: 1 | 2 | 3, body: ProseNode[] }
// ProseNode = { kind: "text", text: string }
//           | { kind: "code", code: string }
//           | { kind: "list", items: string[], ordered?: boolean }`,
    blocks: [
      {
        type: "doc-section",
        heading: "Example",
        body: [
          { kind: "text", text: "A paragraph with `inline code` and a [link](/about)." },
          { kind: "list", items: ["First point", "Second point"] },
        ],
      },
    ],
  },
  {
    id: "props-table",
    tier: "synthetic",
    measured: false,
    description: "A component's full prop reference — Prop/Type/Required/Default columns — rendered from already-generated `PropRow[]` data (see apps/docs/scripts/generate-props.mjs), not read from a file by the Packer itself: this package has no dependency on any one consuming app's build output. Used to build every component reference page's own props table.",
    shape: `{ type: "props-table", heading?: string, rows: PropRow[] }
// PropRow = { name: string, type: string, required: boolean, defaultValue: string | null, description: string | null }`,
    blocks: [
      {
        type: "props-table",
        heading: "Example props",
        rows: [
          { name: "variant", type: '"primary" | "secondary"', required: false, defaultValue: '"secondary"', description: null },
          { name: "onClick", type: "() => void", required: true, defaultValue: null, description: null },
        ],
      },
    ],
  },
  {
    id: "heuristic",
    tier: "synthetic",
    measured: false,
    description: "One entry of a heuristics/design-principles page: a heading, a bolded one-line rule, doc-section-style rationale prose (same tiny inline markup), and an optional code sample and/or a real nested live Construct[] example. Carries its own stable id rather than slugifying one from title, since existing cross-references may already point at a specific hand-picked id. Used to build /about/agent.",
    shape: `{ type: "heuristic", id: string, title: string, rule: string, rationale: ProseNode[], code?: string, exampleBlocks?: Construct[] }`,
    blocks: [
      {
        type: "heuristic",
        id: "example-heuristic",
        title: "Example heuristic",
        rule: "State the rule in one bolded sentence.",
        rationale: [
          { kind: "text", text: "Then explain *why*, with `inline code` and a [link](/about/agent) where useful." },
        ],
        exampleBlocks: [{ type: "checklist", heading: "Applied here", items: ["The rule", "The rationale", "A live example"] }],
      },
    ],
  },
  {
    id: "iframe",
    tier: "synthetic",
    measured: false,
    description: "A real <iframe> — a required, not optional, title (an embed with no accessible name is a real, common accessibility gap most iframe usage in the wild gets wrong). No default height, since that depends entirely on context — set one explicitly, or nest it in a comparison block (see 'orders'), which measures and applies one automatically.",
    shape: `{ type: "iframe", src: string, title: string, height?: number }`,
    blocks: [
      {
        type: "iframe",
        src: "https://example.com",
        title: "Example embed",
      },
    ],
  },
  {
    id: "stats-table",
    tier: "synthetic",
    measured: false,
    description: "A small, static, presentational summary table — headers plus a plain grid of string/number cells, no sorting/selection/pagination. Distinct from table (an Opinion-tier block, since it pairs the real Table component with real search/filters/add-row over live data): this exists for the exact headers-plus-rows-of-cells shape a benchmark results table needs. Renders through the same real Table component underneath, just without the extra props that would invite features this kind of static presentational table doesn't need.",
    shape: `{ type: "stats-table", headers: string[], rows: (string | number)[][] }`,
    blocks: [
      {
        type: "stats-table",
        headers: ["Metric", "antd", "rebar-ui"],
        rows: [
          ["Tokens", 31231, 30211],
          ["Wall clock (s)", 42, 18],
        ],
      },
    ],
  },
  {
    id: "gallery",
    tier: "synthetic",
    measured: false,
    description: "A labeled, single-aspect-ratio image carousel — screenshots named ${prefix}-01.png through ${prefix}-NN.png inside dir (a public/ path), per Design Heuristics' carousel rule (one aspect ratio only, no exceptions). count defaults to 15 to match this project's own standard benchmark sample size.",
    shape: `{ type: "gallery", label: string, dir: string, prefix: string, count?: number }`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // OPINION TIER (9 blocks)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "goal-tracker",
    tier: "opinion",
    measured: false,
    description: "A progress tracker with an optional aspiration and a list of focus areas — each with an id, text, and nested goals (each with text and completed boolean). Presentational only — no live data binding, no add/edit controls.",
    shape: `{ type: "goal-tracker", aspiration?: string, focusAreas?: GoalTrackerFocusAreaData[] }`,
    blocks: [
      {
        type: "goal-tracker",
        aspiration: "Q4 Goals",
        focusAreas: [
          { id: "revenue", text: "Revenue", goals: [{ id: "rev-1", text: "Hit $100k ARR", completed: false }] },
          { id: "customers", text: "New customers", goals: [{ id: "cust-1", text: "Reach 60 customers", completed: false }] },
          { id: "nps", text: "NPS score", goals: [{ id: "nps-1", text: "Achieve 75+ NPS", completed: false }] },
        ],
      },
    ],
  },
  {
    id: "ai-chat",
    tier: "opinion",
    measured: false,
    description: "A chat interface with a title, a list of messages (each with role, content, optional status, and avatar), and an input bar at the bottom. Messages render with real Avatar components (src or placeholder fallback). Presentational only — no send handler, no backend binding (see table/card-kanban for blocks that do bind to live data).",
    shape: `{ type: "ai-chat", title: string, messages: AiChatMessage[], inputPlaceholder?: string }
// AiChatMessage = { id: string, role: "user" | "assistant", content: string, status?: "sending"|"sent"|"streaming"|"error", avatarFallback?: string, avatarSrc?: string, avatarPlaceholder?: boolean }`,
    blocks: [
      {
        type: "ai-chat",
        title: "Support chat",
        messages: [
          { id: "1", role: "assistant", content: "How can I help today?", avatarFallback: "AI" },
          { id: "2", role: "user", content: "My order hasn't arrived yet.", avatarFallback: "JD" },
        ],
      },
    ],
  },
  {
    id: "table",
    tier: "opinion",
    measured: false,
    description: "A bordered data table with exactly the columns you give it. Wraps the real Table component (sortable columns, on by default). searchPlaceholder/filters/addable/exportable/copyable add real, working controls. A literal rows array is static; source/onAddRow/onRowAction bind rows, the add flow, and per-row actions to real backend calls instead — the reason this block is an Opinion. loading forwards straight to the real Table component.",
    shape: `{ type: "table", columns: string[], rows?: { cells: string[], actionLabel?: string }[], source?: string, sortable?: boolean, searchPlaceholder?: string, filters?: { label: string, columnIndex: number, options: string[] }[], addable?: boolean | { label?: string }, onAddRow?: string, onRowAction?: string, loading?: boolean, exportable?: boolean, copyable?: boolean }`,
    blocks: [
      {
        type: "table",
        columns: ["Team", "Lead", "Status"],
        searchPlaceholder: "Search teams...",
        filters: [{ label: "Status", columnIndex: 2, options: ["Active", "Archived"] }],
        addable: { label: "Add team" },
        exportable: true,
        copyable: true,
        rows: [
          { cells: ["Engineering", "Priya Shah", "Active"], actionLabel: "Select" },
          { cells: ["Design", "Marcus Webb", "Active"], actionLabel: "Select" },
          { cells: ["Platform", "Jordan Lee", "Archived"], actionLabel: "Select" },
        ],
      },
    ],
  },
  {
    id: "wizard",
    tier: "opinion",
    measured: false,
    description: "A multi-step form container — Steps for progress, one step's fields shown at a time, a Back/Next/Submit footer. Next/Submit is disabled until the current step's required fields are filled. A wizard's steps are static content, but onSubmit forwards the real Wizard component's own onSubmit (fired with the collected values on completion) — its result is real live output a backend-driven app needs, which is why this block is an Opinion despite having no source of its own.",
    shape: `{ type: "wizard", steps: { label: string, description?: string, fields: FormField[] }[], submitLabel?: string, backLabel?: string, nextLabel?: string, onSubmit?: string }`,
    blocks: [
      {
        type: "wizard",
        steps: [
          { label: "Team", fields: [{ kind: "text", label: "Team name", required: true }] },
          { label: "Details", fields: [{ kind: "textarea", label: "Notes" }] },
        ],
      },
    ],
  },
  {
    id: "card-kanban",
    tier: "opinion",
    measured: false,
    description: "A drag-and-drop card board — title, optional shared-with avatars, a Share action, a search box, and an optional Board settings button, all above the real Kanban component: arbitrary columns, optional dividers, cards/columns draggable, per-column/per-section card limits. Literal columns/cards seed a local-only board; source/onChange bind the whole board state to real backend reads/writes instead — Kanban's own onChange forwarded straight through.",
    shape: `{ type: "card-kanban", title: string, sharedWith?: { name: string, avatarSrc?: string }[], shareUrl?: string, columns?: KanbanColumnData[], cards?: Record<string, KanbanCardData>, source?: string, onChange?: string, searchPlaceholder?: string, settingsBlocks?: Construct[] }
// KanbanColumnData = { id: string, title: string, sections: KanbanSectionData[], limit?: number }
// KanbanSectionData = { id: string, label?: string, cardIds: string[], limit?: number }
// KanbanCardData = { id: string, title: string, description?: string, tags?: string[] }`,
    blocks: [
      {
        type: "card-kanban",
        title: "Sprint board",
        sharedWith: [{ name: "Priya Shah" }, { name: "Jae Kim" }],
        columns: [
          { id: "todo", title: "To do", sections: [{ id: "todo-main", cardIds: ["spec"] }] },
          { id: "done", title: "Done", sections: [{ id: "done-main", cardIds: ["ship"], limit: 1 }] },
        ],
        cards: {
          spec: { id: "spec", title: "Write spec", tags: ["docs"] },
          ship: { id: "ship", title: "Ship it" },
        },
      },
    ],
  },
  {
    id: "sticky-kanban",
    tier: "opinion",
    measured: false,
    description: "The exact same board, chrome, and live-binding shape as card-kanban — with one difference: Kanban's cardVariant=\"sticky\" instead of the default. Postit-style cards capped at 3 per column; click (not drag) opens an edit form for a sticky's title/description/tags/color. A mutation of the same primitive, not a second component.",
    shape: `{ type: "sticky-kanban", title: string, sharedWith?: { name: string, avatarSrc?: string }[], shareUrl?: string, columns?: KanbanColumnData[], cards?: Record<string, KanbanCardData>, source?: string, onChange?: string, searchPlaceholder?: string, settingsBlocks?: Construct[] }
// same KanbanColumnData/KanbanSectionData/KanbanCardData shapes as card-kanban, above`,
    blocks: [
      {
        type: "sticky-kanban",
        title: "Retro board",
        columns: [
          { id: "went-well", title: "Went well", sections: [{ id: "went-well-main", cardIds: ["went1"] }] },
          { id: "improve", title: "To improve", sections: [{ id: "improve-main", cardIds: ["improve1"] }] },
        ],
        cards: {
          went1: { id: "went1", title: "Fast turnaround on reviews" },
          improve1: { id: "improve1", title: "Standup ran long" },
        },
      },
    ],
  },
  {
    id: "scatter-chart",
    tier: "opinion",
    measured: false,
    description: "A distribution scatter plot — each series' individual values plotted as a jittered column of points, with a dashed line marking that series' mean. A filter footer toggles series visibility. A literal series array is static; source binds it to live data instead — read-only, since a chart has no meaningful user-initiated write-back.",
    shape: `{ type: "scatter-chart", title?: string, ariaLabel?: string, height?: number, series: { label: string, color?: string, values: number[] }[], source?: string }`,
    blocks: [
      {
        type: "scatter-chart",
        title: "Token cost, antd vs. rebar-ui",
        series: [
          { label: "antd", values: [31231, 31131, 30891, 31921, 30950] },
          { label: "rebar-ui", values: [30211, 30212, 30149, 30253, 30180] },
        ],
      },
    ],
  },
  {
    id: "line-chart",
    tier: "opinion",
    measured: false,
    description: "A multi-series line chart over an ordered x-axis — for cumulative cost/measurement comparisons where one series may overtake another partway through (crossoverIndex). Same series-toggle filter footer and live source binding as scatter-chart. xLabels stays literal-only for now.",
    shape: `{ type: "line-chart", title?: string, ariaLabel?: string, height?: number, xLabels: string[], labelStep?: number, crossoverIndex?: number, series: { label: string, color?: string, values: number[], dashed?: boolean }[], source?: string }`,
    blocks: [
      {
        type: "line-chart",
        title: "Cumulative cost per round",
        xLabels: ["R0", "R1", "R2", "R3"],
        crossoverIndex: 3,
        series: [
          { label: "antd", values: [10, 20, 30, 42] },
          { label: "rebar-ui + migration", values: [22, 28, 35, 40], dashed: true },
        ],
      },
    ],
  },
  {
    id: "stacked-bar-chart",
    tier: "opinion",
    measured: false,
    description: "A stacked bar chart — each bar broken into labeled cost/quantity segments, with the bar's own total shown above it. A filter footer toggles one distinct segment label across every bar at once. Same live source binding as the other two chart blocks.",
    shape: `{ type: "stacked-bar-chart", title?: string, ariaLabel?: string, height?: number, bars: { label: string, segments: { label: string, value: number, color?: string }[] }[], source?: string }`,
    blocks: [
      {
        type: "stacked-bar-chart",
        title: "Cost composition",
        bars: [
          {
            label: "Hire developers",
            segments: [
              { label: "Build", value: 16800 },
              { label: "Revisions", value: 16800 },
            ],
          },
          {
            label: "AI-assisted",
            segments: [{ label: "Oversight", value: 3500 }],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // ORDER TIER (8 blocks)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "nav-bar",
    tier: "order",
    measured: false,
    description: "A horizontal navigation bar — a leading brand/logo area, a row of nav links (each with label and href), and an optional trailing action area. Presentational only — no router integration, no active-state tracking (see site-header for a block that wraps this with real page-context awareness).",
    shape: `{ type: "nav-bar", items: { label: string, href: string }[], ariaLabel?: string, resizable?: boolean }`,
    blocks: [
      {
        type: "nav-bar",
        items: [
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Contact", href: "/contact" },
        ],
      },
    ],
  },
  {
    id: "site-header",
    tier: "order",
    measured: false,
    description: "A full page header — wraps nav-bar with a real Affix (sticky positioning), adds a search input, and tracks the current route to highlight the active nav link. The top-of-page chrome block; pairs with footer at the bottom.",
    shape: `{ type: "site-header", logo: { label: string, href?: string, iconSrc?: string, iconPath?: string, iconViewBox?: string }, items: { label: string, href: string }[], ariaLabel?: string, trailing?: { kind: "text"|"login"|"avatar", ... }, themeToggle?: boolean }`,
    blocks: [
      {
        type: "site-header",
        logo: { label: "Example", href: "/" },
        items: [
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Contact", href: "/contact" },
        ],
      },
    ],
  },
  {
    id: "nav-index",
    tier: "order",
    measured: false,
    description: "A vertical link index — once the list passes 12 items, a search box appears, plus a real MultiSelect checklist for category and, once items carry more than one distinct status, a second, independent one for status. The cross-page counterpart to page-index below (this one links to other pages; that one links to headings on the current one). A narrow side-rail control, not center-column content — see it working at real scale on any tier page's own sidebar.",
    shape: `{
  type: "nav-index",
  items: { label: string, href: string, category?: string, status?: string }[],
  categoryLabels?: Record<string, string>,
  statusLabels?: Record<string, string>,
  unstatusedLabel?: string,
  searchPlaceholder?: string,
  ariaLabel?: string,
}`,
  },
  {
    id: "page-index",
    tier: "order",
    measured: false,
    description: 'An in-page content index — tracks which heading is currently in view and highlights it (the "beacon"), scrolling itself to keep that highlight visible as you scroll the page. Fades into a scroll "mist" at whichever edge still has more headings below the fold, stays a bounded, fixed-height rail regardless of how many headings exist, and gains its own search box once the list passes 12 headings. By default takes no sections prop: the Packer derives them itself by scanning the document\'s own doc-section blocks for a heading. A narrow, sticky side-rail, not center-column content — see it working for real, at full scale, on /about/agent.',
    shape: `{ type: "page-index", searchPlaceholder?: string, sections?: { id: string, label: string }[] }`,
  },
  {
    id: "side-panel",
    tier: "order",
    measured: false,
    description: "A persistent, non-modal side panel (the Slack 'thread'/'details' pattern) beside a nested main: Construct[] document — no backdrop, the main content stays fully visible and interactive while it's open. Collapses to a slim, always-present rail with a toggle button rather than disappearing entirely. Distinct from modal (a forced-open, backdrop-covering Dialog for static-render contexts only).",
    shape: `{ type: "side-panel", main: Construct[], panel: { title: string, blocks: Construct[], defaultOpen?: boolean } }`,
    blocks: [
      {
        type: "side-panel",
        main: [{ type: "checklist", heading: "Checklist", items: ["Reviewed", "Approved"] }],
        panel: {
          title: "Thread",
          blocks: [{ type: "callout", tone: "info", title: "Alex", subtitle: "Can we ship this Friday?" }],
        },
      },
    ],
  },
  {
    id: "tabs",
    tier: "order",
    measured: false,
    description: "Real Tabs (Radix underneath) — each tab holds its own nested Construct[], rendered recursively, so any other block type can live inside a tab panel.",
    shape: `{ type: "tabs", tabs: { label: string, blocks: Construct[] }[] }`,
    blocks: [
      {
        type: "tabs",
        tabs: [
          { label: "Team", blocks: [{ type: "callout", tone: "info", title: "Team panel" }] },
          { label: "Details", blocks: [{ type: "callout", tone: "info", title: "Details panel" }] },
        ],
      },
    ],
  },
  {
    id: "modal",
    tier: "order",
    measured: false,
    description: "A real Dialog (Radix underneath), holding its own nested Construct[], with confirm/cancel footer actions. Renders forced open — a convention for static-render/screenshot contexts, not for a normal live page. No live example here on purpose: a forced-open modal on a page with other content around it covers the whole page as a fixed overlay. See it live, properly triggered and closable three ways, on the /opinions/dialog Dialog reference page.",
    shape: `{ type: "modal", title: string, blocks: Construct[], confirmLabel?: string, cancelLabel?: string }`,
  },
  {
    id: "comparison",
    tier: "order",
    measured: false,
    description: "The one block whose own layout isn't single-column: two labeled panels side by side, each holding its own nested Construct[], rendered recursively the same way tabs/modal already nest. Measures the left panel's real rendered height and applies it to the right, so an embedded iframe on either side always matches its sibling instead of drifting out of sync.",
    shape: `{ type: "comparison", leftLabel: string, leftBlocks: Construct[], rightLabel: string, rightBlocks: Construct[] }`,
    blocks: [
      {
        type: "comparison",
        leftLabel: "Rebar",
        leftBlocks: [{ type: "checklist", heading: "Checklist", items: ["First item", "Second item"] }],
        rightLabel: "Embedded page",
        rightBlocks: [{ type: "iframe", src: "https://example.com", title: "Example embed" }],
      },
    ],
  },
];

/**
 * Get all blocks for a specific tier
 */
export function getBlocksByTier(tier: "synthetic" | "opinion" | "order"): ConstructCatalogueEntry[] {
  return CATALOGUE_BLOCKS.filter((b) => b.tier === tier);
}

/**
 * Get a specific block by ID
 */
export function getBlockById(id: string): ConstructCatalogueEntry | undefined {
  return CATALOGUE_BLOCKS.find((b) => b.id === id);
}

/**
 * Get all block IDs (useful for navigation, validation)
 */
export function getAllBlockIds(): string[] {
  return CATALOGUE_BLOCKS.map((b) => b.id);
}
