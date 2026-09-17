# @rebar-ui/placement

**This is how `rebar-ui` is meant to be used — not by hand-authoring `Stack`/`Box`/`Card` JSX.**
Compose a small, plain-data `Block[]` document (a fixed vocabulary of fifteen named archetypes —
`hero`, `banner`, `checklist`, `form`, `table`, ...) and render it through `BlockRenderer`, which
is the only thing that decides layout, spacing, and nesting. An LLM authoring a page picks which
archetype fits each piece of content and supplies the content; it never decides `direction`,
`gap`, `justify`, or any other layout property, because there is no such prop to set.

## Why this exists — the measured case, not a claim

Real, repeated (n=15) measurement on [rebar-ui's own `/benchmarks` page](https://rebarui.com/benchmarks)
found: building the same UI as **hand-authored JSX against `rebar-ui`'s components directly loses
to hand-authored Ant Design** — an unfamiliar library costs more tokens than a library already
common in training data, even though rebar-ui's components are simpler. Building the exact same
UI as a `Block[]` document through this package instead **beats hand-authored Ant Design
outright** — cheaper, faster, and far more consistent run-to-run (near-zero output variance,
since a deterministic renderer decides every pixel, not the model). The gap is bigger on cheaper
models (Qwen, Kimi) than on frontier ones, in the direction you'd expect: composing raw JSX is a
much harder task to get consistently right than filling in a small typed schema. See
`ref/ARCHITECTURE.md#the-placement-layer` and `/benchmarks` for the full numbers and methodology.

**If a task is "build a UI with rebar-ui," reach for this package first.** Hand-authoring
`packages/core` components directly is not the recommended path any more — see that package's own
README for when it's still the right call (short version: almost never, for a whole page).

## Install

```
npm install rebar-ui @rebar-ui/placement @rebar-ui/theme-clean
```

```tsx
import "rebar-ui/style.css";
import "@rebar-ui/theme-clean/theme.css";
import { BlockRenderer, type Block } from "@rebar-ui/placement";

const blocks: Block[] = [
  { type: "header", title: "Projects" },
  { type: "banner", tone: "info", icon: "info", text: "Nothing here is saved yet." },
  { type: "checklist", heading: "Checklist", items: ["Reviewed", "Approved"] },
];

<BlockRenderer blocks={blocks} />;
```

### The page shell — `BlockRenderer` already is one

Once `rebar-ui/style.css` and a theme are imported, `BlockRenderer` already renders the correct
page root: `<Box data-rebar-placement-root><Stack gap="lg">...blocks...</Stack></Box>`, a plain,
unstyled wrapper on top of the page's own already-correct background (`body`'s
`--rebar-color-bg-primary`). For a bare page, render `<BlockRenderer blocks={blocks} />` directly
as (or as the sole child of) the page's root element — **do not nest it inside a `Card`, or any
other element with its own background/border, "for structure."** It doesn't need one, and
wrapping the entire block sequence in one forces the whole page into that element's border/
shadow/corner-radius/padding treatment — a page that reads as one giant grey/boxed rectangle
instead of a normal page with individual cards on it (`card-grid`/`persona-card`/`pillar-grid`
already render their own, correctly-scoped `Card`s where the content is actually card-shaped).

### Wiring real navigation (`renderLink`)

`BlockRenderer`'s default `renderLink` renders a plain `<a href>` for any block with an `href`
(action buttons, `pillar-grid` cards, `doc-section`'s inline `[label](href)` links). In a
framework with client-side routing, pass your own:

```tsx
// Next.js — this must be a Client Component; a function prop can't cross the Server/Client
// boundary directly from a Server Component page, which is why this is its own small file.
"use client";
import Link from "next/link";
import { BlockRenderer, type Block } from "@rebar-ui/placement";

export function NextBlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <BlockRenderer
      blocks={blocks}
      renderLink={({ href, children }) => (
        <Link href={href} className="rebar-link">
          {children}
        </Link>
      )}
    />
  );
}
```

## The archetypes

Exact current TypeScript shapes are in `dist/index.d.ts` (the `Block` union and its part types) —
this is a guide to what each one is for, not the literal source of truth for its fields. **✓
measured** means real, repeated (n=15) data on `/benchmarks` backs it; **unmeasured** means it's
real, tested, and shipped, but hasn't been through that rigor yet — treat it as correct, not yet
as proven cheap.

| Block | For | Status |
|---|---|---|
| `header` | A page/panel title, optional trailing action | ✓ measured |
| `nav-bar` | A horizontal site nav that collapses overflowing items into a trailing popover once they'd cross half the header's width (see `ref/HEURISTICS.md`'s "Nav overflow" rule) | unmeasured |
| `nav-index` | A vertical link index — search + category chips that only appear once the list is long enough to need them | unmeasured |
| `page-index` | An in-page content index — sections derived automatically from the document's own `doc-section` headings, no `sections` prop | unmeasured |
| `banner` | A colored strip: icon + one line + optional trailing action | ✓ measured |
| `checklist` | A heading over a vertical list of checkbox rows | ✓ measured |
| `callout` | A colored box with a bold title line and a secondary line | ✓ measured |
| `hero` | A page's top banner: badge, title, subtitle, actions, code snippet | unmeasured |
| `section-header` | A kicker + title + subtitle above a page section | unmeasured |
| `doc-section` | A heading over prose paragraphs/code/lists (tiny inline markup only — `` `code` ``, `[label](href)`, `*emphasis*`, not full markdown) | unmeasured |
| `feature-grid` | A row of title+body micro-feature cards | unmeasured |
| `pillar-grid` | A grid of title+body+link cards | unmeasured |
| `card-grid` | An open-ended wrapping grid of cards — title, optional body, link, and status tags per item | unmeasured |
| `persona-card` | A row of avatar+name+meta identity cards | unmeasured |
| `props-table` | A component's prop reference table, from already-generated `PropRow[]` data | unmeasured |
| `form` | A labeled field list (text/email/date/textarea/select/checkbox, each optionally `required`) with an optional submit button (omit `submitLabel` when nesting inside a `modal` that has its own footer action) | unmeasured |
| `table` | A column-headed data table, each row optionally ending in an action button | unmeasured |
| `data-list` | A vertical list of rows — title, optional badge, optional avatar/meta/action | unmeasured |
| `filter-bar` | A search input + optional filter dropdown + optional trailing action | unmeasured |
| `tabs` | Tabbed content — each tab holds its own `Block[]` (recursive) | unmeasured |
| `modal` | A real `Dialog`, forced open — for static-render/screenshot contexts only; on a live page with other content around it, a forced-open modal covers the whole page as a fixed overlay, so link to a normally-triggered `Dialog` instead | unmeasured |
| `wizard` | A multi-step form — `Steps` for progress, one step's fields at a time, Next/Submit gated on that step's required fields (wraps the real `Wizard` component) | unmeasured |

`IconName` is a small fixed set (`"close" | "info" | "refresh" | "clock"`) — not an arbitrary icon
library. `Tone` is `"info" | "warning" | "success" | "error"`, shared by every block that has one.

## For coding agents

**If your integration can read files** (an agentic harness — tool calls, a real filesystem): read
`dist/index.d.ts` for the exact `Block`/`Action`/`FormField`/etc. shapes, the same convention as
`rebar-ui` itself. You don't need to read this package's `src/` — same reasoning as `rebar-ui`'s
own README (implementation detail, not API surface).

**If your integration is a single completion call with no file access** (a raw API call, no tool
use): do not write a prompt that says "read `schema.ts`" or "check the `Block` type" — there is
nothing for the model to read, and an instruction pointing at an unreachable file gets silently
guessed around instead of followed. A real test of exactly this (`ref/QWEN_BENCHMARK_PROTOCOL.md`)
found a "read the schema first" prompt scored 0/15 against a non-agentic model — every failure was
the model inventing a plausible-looking but wrong shape (`"info-banner"` instead of `"banner"`,
checklist items as `{ label: string }` objects instead of plain strings). Inlining the exact
archetype shapes it needs directly in the prompt text took the same task to 15/15. Copy the
relevant rows from the table above (or the exact shape from `dist/index.d.ts`) straight into the
prompt rather than describing where to find them.

**Building from an image, specifically:** inline the same archetype/icon vocabulary directly in
the prompt even for an agentic model with file access — a measured test found that leaving a
model to discover the schema by reading `schema.ts` cost extra lookup calls purely from mapping a
picture onto it, enough to erase this package's usual cost advantage on that one task; inlining
the vocabulary directly (so the only remaining job is "read the image, pick archetypes, transcribe
content") closed the entire gap and beat hand-authored Ant Design again. See
`ref/QWEN_BENCHMARK_PROTOCOL.md`'s "rebar-ui-image" prompt for a full worked example of this
pattern.

**Either way:** don't fine-tune visual styling through this package — same policy as `rebar-ui`
itself (see that package's README). No archetype has a color/spacing override prop; a request for
one is deferred to migration, not worked around here.

## Migration

Not codemod-covered by `@rebar-ui/migrate-antd` — that tool targets hand-authored `rebar-ui` JSX,
not a `Block[]` document. Migrating a placement-layer page means rewriting `BlockRenderer`'s
output as equivalent JSX in the target library once, by hand or via an LLM (`MIGRATION_PROMPT.md`,
repo root) — a full rewrite, not a partial pass, and re-measured accordingly on `/benchmarks`
(reported as "rebar-ui + migration").
