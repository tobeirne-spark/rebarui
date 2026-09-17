#!/usr/bin/env tsx
/**
 * Generate construct pages for all blocks that don't have them yet.
 * Reads from catalogueBlocks.ts and creates pages following the pattern
 * of existing component construct pages.
 */

import * as fs from "fs";
import * as path from "path";

// Block tier mapping (using plural route names)
const BLOCK_TIER: Record<string, string> = {
  header: "synthetics",
  banner: "synthetics",
  checklist: "synthetics",
  callout: "synthetics",
  "spin-card": "synthetics",
  "error-block": "synthetics",
  footer: "synthetics",
  "feature-grid": "synthetics",
  "pillar-grid": "synthetics",
  hero: "synthetics",
  "section-header": "synthetics",
  "card-grid": "synthetics",
  "persona-card": "synthetics",
  "data-list": "synthetics",
  "filter-bar": "synthetics",
  "doc-section": "synthetics",
  "props-table": "synthetics",
  heuristic: "synthetics",
  iframe: "synthetics",
  "stats-table": "synthetics",
  gallery: "synthetics",
  "construct-entry": "synthetics",
  "goal-tracker": "opinions",
  "ai-chat": "opinions",
  "card-kanban": "opinions",
  "sticky-kanban": "opinions",
  "nav-bar": "orders",
  "site-header": "orders",
  "nav-index": "orders",
  "page-index": "orders",
  "side-panel": "orders",
  tabs: "orders",
  modal: "orders",
  comparison: "orders",
};

// Block descriptions and shapes from catalogueBlocks.ts
const BLOCK_DATA: Record<string, { description: string; shape: string }> = {
  header: {
    description: "A page-top header with a title, optional subtitle, and optional action buttons. Used as the top chrome for a page or section.",
    shape: `{ type: "header", title: string, subtitle?: string, actions?: Action[] }`,
  },
  banner: {
    description: "A full-width banner with a message, optional icon, and optional dismiss button. Used for announcements, warnings, or status messages.",
    shape: `{ type: "banner", message: string, icon?: string, dismissible?: boolean, tone?: "info" | "warning" | "error" | "success" }`,
  },
  checklist: {
    description: "A vertical list of checkable items with a heading. Each item has a label and optional description. Presentational only — no live state binding.",
    shape: `{ type: "checklist", heading?: string, items: { label: string, description?: string, checked?: boolean }[] }`,
  },
  callout: {
    description: "A highlighted callout box with a title and body text. Used for important notes, tips, or warnings that stand out from regular content.",
    shape: `{ type: "callout", title: string, body: string, tone?: "info" | "warning" | "error" | "success" }`,
  },
  "spin-card": {
    description: "A small, centered card showing a real loading overlay with a spinner and a list of items being loaded. Used to indicate async operations in progress.",
    shape: `{ type: "spin-card", tip?: string, items: string[], width?: number, minHeight?: number }`,
  },
  "feature-grid": {
    description: "A wrapping row of small title+body pairs — no links, no images, just short feature copy. Used for feature lists or capability summaries.",
    shape: `{ type: "feature-grid", items: { title: string, body: string }[] }`,
  },
  "pillar-grid": {
    description: "A row of cards, each with a title, body copy, and a CTA link — the homepage's three-pillars grid. Used for main navigation or value propositions.",
    shape: `{ type: "pillar-grid", items: { title: string, body: string, href: string, cta: string }[] }`,
  },
  hero: {
    description: "A centered page-top hero: optional badge, title, subtitle, action buttons, and an optional code snippet. Badge and subtitle support inline markup.",
    shape: `{ type: "hero", badge?: string, title: string, subtitle: string, actions?: Action[], codeSnippet?: string }`,
  },
  "section-header": {
    description: "A centered kicker/title/subtitle block — used between homepage sections to introduce content areas.",
    shape: `{ type: "section-header", kicker?: string, title: string, subtitle?: string }`,
  },
  "card-grid": {
    description: "A wrapping grid of cards — title, optional body copy, optional status tags, optional link — for an index/directory of many similar named things.",
    shape: `{ type: "card-grid", items: { title: string, body?: string, href?: string, linkLabel?: string, tags?: { label: string, tone?: Tone }[] }[] }`,
  },
  "persona-card": {
    description: "A row of identity cards — avatar + name + optional meta line. Arguably an Avatar+Text composition, not a new primitive — exactly the case for a block.",
    shape: `{ type: "persona-card", items: { name: string, meta?: string, avatarSrc?: string, avatarPlaceholder?: boolean }[] }`,
  },
  "data-list": {
    description: "A vertical stack of title+badge rows — a lighter-weight alternative to table for a simple list of named items.",
    shape: `{ type: "data-list", items: { title: string, badge?: string }[] }`,
  },
  "filter-bar": {
    description: "A search input plus an optional filter select and a trailing primary action button, all in one row. Presentational only — nothing downstream is wired to it.",
    shape: `{ type: "filter-bar", searchPlaceholder?: string, filterLabel?: string, filterOptions?: string[], actionLabel?: string }`,
  },
  "doc-section": {
    description: "A heading (level 1, 2, or 3) plus prose/code/list content — the block type every /docs/* page is built from. Prose text supports inline markup.",
    shape: `{ type: "doc-section", heading?: string, level?: 1 | 2 | 3, body: ProseNode[] }`,
  },
  "props-table": {
    description: "A component's full prop reference — Prop/Type/Required/Default columns — rendered from already-generated PropRow[] data.",
    shape: `{ type: "props-table", heading?: string, rows: PropRow[] }`,
  },
  heuristic: {
    description: "One entry of a heuristics/design-principles page: a heading, a bolded one-line rule, rationale prose, and an optional code sample and/or live example.",
    shape: `{ type: "heuristic", id: string, title: string, rule: string, rationale: ProseNode[], code?: string, exampleBlocks?: Construct[] }`,
  },
  iframe: {
    description: "A real <iframe> — a required, not optional, title (an embed with no accessible name is a real, common accessibility gap). No default height.",
    shape: `{ type: "iframe", src: string, title: string, height?: number }`,
  },
  "stats-table": {
    description: "A small, static, presentational summary table — headers plus a plain grid of string/number cells, no sorting/selection/pagination.",
    shape: `{ type: "stats-table", headers: string[], rows: (string | number)[][] }`,
  },
  gallery: {
    description: "A labeled, single-aspect-ratio image carousel — screenshots named ${prefix}-01.png through ${prefix}-NN.png inside dir.",
    shape: `{ type: "gallery", label: string, dir: string, prefix: string, count?: number }`,
  },
  "construct-entry": {
    description: "An entry in a construct index/directory — a title, optional description, and a link to the construct's full page. Used to build index pages.",
    shape: `{ type: "construct-entry", title: string, description?: string, href: string }`,
  },
  "goal-tracker": {
    description: "A progress tracker with an optional aspiration and a list of focus areas — each with an id, text, and nested goals. Presentational only.",
    shape: `{ type: "goal-tracker", aspiration?: string, focusAreas?: GoalTrackerFocusAreaData[] }`,
  },
  "ai-chat": {
    description: "A chat interface with a title, a list of messages, and an input bar. Messages render with real Avatar components. Presentational only — no send handler.",
    shape: `{ type: "ai-chat", title: string, messages: AiChatMessage[], inputPlaceholder?: string }`,
  },
  "card-kanban": {
    description: "A kanban board with columns, each containing cards. Cards have title, optional body, optional labels, and optional footer. Presentational only.",
    shape: `{ type: "card-kanban", columns: { title: string, cards: KanbanCard[] }[] }`,
  },
  "sticky-kanban": {
    description: "A kanban board with sticky columns that stay visible while scrolling through cards. Same card shape as card-kanban.",
    shape: `{ type: "sticky-kanban", columns: { title: string, cards: KanbanCard[] }[] }`,
  },
  "site-header": {
    description: "A site-wide header with navigation links, optional logo, and optional user menu. Wraps NavBar for the top of a site.",
    shape: `{ type: "site-header", logo?: string, links: { label: string, href: string }[], userMenu?: UserMenuItem[] }`,
  },
  "nav-index": {
    description: "A navigation index — a list of links with optional descriptions, used for site navigation or table of contents.",
    shape: `{ type: "nav-index", items: { label: string, href: string, description?: string }[] }`,
  },
  "page-index": {
    description: "A page index — a list of section links for in-page navigation, like a table of contents for a long page.",
    shape: `{ type: "page-index", items: { label: string, anchor: string }[] }`,
  },
  tabs: {
    description: "A tabbed interface with multiple panels. Each tab has a label and content. Used for organizing related content into switchable views.",
    shape: `{ type: "tabs", tabs: { label: string, content: Construct[] }[] }`,
  },
  modal: {
    description: "A modal dialog with a title, body content, and action buttons. Used for focused tasks or confirmations that require user attention.",
    shape: `{ type: "modal", title: string, body: Construct[], actions?: Action[] }`,
  },
  comparison: {
    description: "A side-by-side comparison of two or more constructs — measures and applies heights automatically. Used for comparing different approaches or versions.",
    shape: `{ type: "comparison", items: { label: string, blocks: Construct[] }[] }`,
  },
};

function generateBlockPage(blockType: string, tier: string): string {
  const data = BLOCK_DATA[blockType];
  if (!data) {
    console.warn(`No data for block: ${blockType}`);
    return "";
  }

  const title = blockType
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  
  const functionName = blockType
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  return `import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [
      {
        kind: "text",
        text: ${JSON.stringify(data.description)},
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [
      {
        kind: "code",
        code: ${JSON.stringify(data.shape)},
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [
      {
        kind: "text",
        text: "A live example of the ${blockType} block:",
      },
    ],
  },
];

export default function ${functionName}Page() {
  return (
    <Stack gap="lg">
      <Heading level={1}>${title}</Heading>
      <Text color="secondary">
        ${data.description}
      </Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
`;
}

// Generate pages for all missing blocks
const missingBlocks = [
  "header",
  "banner",
  "checklist",
  "callout",
  "spin-card",
  "feature-grid",
  "pillar-grid",
  "hero",
  "section-header",
  "card-grid",
  "persona-card",
  "data-list",
  "filter-bar",
  "doc-section",
  "props-table",
  "heuristic",
  "iframe",
  "stats-table",
  "gallery",
  "construct-entry",
  "goal-tracker",
  "ai-chat",
  "card-kanban",
  "sticky-kanban",
  "site-header",
  "page-index",
  "modal",
  "comparison",
];

const appDir = path.join(__dirname, "..", "src", "app");

for (const blockType of missingBlocks) {
  const tier = BLOCK_TIER[blockType];
  if (!tier) {
    console.error(`No tier for block: ${blockType}`);
    continue;
  }

  const pageDir = path.join(appDir, tier, blockType);
  const pageFile = path.join(pageDir, "page.tsx");

  if (fs.existsSync(pageFile)) {
    console.log(`Skipping ${blockType} - page already exists`);
    continue;
  }

  const content = generateBlockPage(blockType, tier);
  if (!content) continue;

  fs.mkdirSync(pageDir, { recursive: true });
  fs.writeFileSync(pageFile, content, "utf-8");
  console.log(`Created ${tier}/${blockType}/page.tsx`);
}

console.log("\nDone!");
