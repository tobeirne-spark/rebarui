---
title: Packer coverage — an inventory of the marketing site
status: living document, regenerate the numbers with `pnpm --filter docs run audit:packer`
---

# Packer coverage

The marketing site (`apps/docs`) is this project's own workbench for the placement layer
(`@rebar-ui/placement`) — the aim is for it to be printed by the Packer end to end, not
hand-authored `rebar-ui` component JSX, so that adding a component or construct to the framework
dogfoods itself immediately on the site that documents it. This doc is a measured inventory of how
close each page actually is, not an assertion — same discipline as `/benchmarks`.

## The maker's mark

Every construct `ConstructRenderer` renders already carries `data-rebar-placement-construct="<type>"` on its
root (checked directly against `packages/placement/src/ConstructRenderer.tsx` — present on all 39
current construct cases, not assumed). That attribute *is* this project's maker's mark: any
`[data-rebar-component]` element (a real, rendered `rebar-ui` component) sitting inside a
`[data-rebar-placement-construct]` subtree was printed by the Packer; one that isn't was hand-authored
JSX. No new attribute was needed — this one already existed for a different reason (giving
`ComponentInspector` a DSL address to show on hover) and turns out to be exactly the audit signal
needed here too.

## The audit

`apps/docs/scripts/audit-packer-coverage.mjs` crawls every real route against a live dev server,
and for each one counts real `rebar-ui` components (`[data-rebar-component]`) split into
Packer-printed (inside a `[data-rebar-placement-construct]` subtree) versus hand-authored. Run it with
`pnpm --filter docs run audit:packer` — the table below is its output as of this write-up, not
hand-maintained.

**A shrinking, no-longer-unconditional floor on every page**: the site header used to be hand-authored
`NavBar`/`Box`/`Stack` on literally every route — now it's a real `site-header` construct (see below),
so it counts as printed everywhere instead. The `DevTools` panel is the one piece of chrome that
stays a genuine, permanent exception (a live dev tool, not static content) — it alone remains part
of the unavoidable floor on every route. Read every percentage below as "of this page's own
content, plus whatever DevTools costs it."

| Route | Total | Printed | Hand-drawn | % | Notes |
|---|---:|---:|---:|---:|---|
| `/` | 132 | 91 | 41 | 69% | Hero/section-headers/feature-grid/pillar-grid printed (Part 10); the migration comparison is a `comparison` construct on *both* sides (a real `iframe` construct embeds the separate antd build). `Section` page-chrome, the small `ComparisonDemo` theme-sync wrapper, and the hand-authored "Get started" install snippet (now a real `CodeBlock`, see below) are the remaining exceptions. |
| `/about` | 45 | 30 | 15 | 67% | |
| `/benchmarks` | 36 | 21 | 15 | 58% | Overview page — split from a single ~1,400-line page into 8 routes under a `DocsShell`-style `BenchmarksShell`, the same way `/docs/*` is split. Its own right-hand index (on `/benchmarks/scenarios` only, the one sub-page with enough headings to need one) is a `page-index` construct. **Content itself now prints too** (see below) — the remaining hand-drawn count here is the `BenchmarksShell`'s own left-hand cross-page `NavIndex` plus the DevTools floor, both legitimate page-chrome exceptions, same category as `Section` on the homepage. |
| `/benchmarks/scenarios` | 83 | 63 | 20 | 76% | Prose/headings print via `doc-section`, all seven results tables via `stats-table`, the timesheet cost-composition chart via `stacked-bar-chart`. One `Alert` (the "10.7x more" callout) stays hand-authored, mid-content — the same single-component-passthrough exception as everywhere else on this site. |
| `/benchmarks/receipts` | 37 | 20 | 17 | 54% | All three summary tables now print via `stats-table`; the closing `Alert` stays hand-authored. |
| `/benchmarks/claude` | 127 | 105 | 22 | 83% | Its two scatter plots are bespoke hand-drawn SVGs with hardcoded historical pixel coordinates, deliberately left alone — not the shared chart components (per this same note, unchanged). Everything else — headings, prose, both stats tables, all four galleries, the reference-screenshot image — now prints. |
| `/benchmarks/qwen` | 131 | 110 | 21 | 84% | Both scatter charts now print via the real `scatter-chart` construct; all four stats tables via `stats-table`; all four galleries via `gallery`. Two `Alert`s stay hand-authored. |
| `/benchmarks/kimi` | 78 | 59 | 19 | 76% | Same conversion as Qwen's page. Two `Alert`s stay hand-authored. |
| `/benchmarks/tiers` | 76 | 26 | 50 | 34% | Lowest of the eight — its 12-shot gallery uses distinctly-named images (`claude-antd-simple.png`, etc.), not the `gallery` construct's numbered-sequence shape, so that `Carousel` stays hand-authored; plus two `Alert`s and the bold subsection label above it. Both scatter charts and both stats tables print. |
| `/benchmarks/iteration` | 78 | 39 | 39 | 50% | Same non-numbered-gallery situation as tiers (six distinctly-named final-state screenshots). Three `Alert`s stay hand-authored (the rigidity callout, the crossover summary, the "structural head start" closer). All three cumulative-cost charts print via `line-chart`. |
| `/constructs` | 705 | 250 | 455 | 35% | Per-entry demo boxes are printed (now including `iframe`/`comparison`/`heuristic`/`spin-card`/`site-header`/`scatter-chart`/`line-chart`/`stacked-bar-chart`/`card-kanban`/`sticky-kanban`); the `Entry`/`GroupHeading` chrome (including each entry's "Shape"/"Example" code samples, now real `CodeBlock`s instead of bare `<pre>`, see below) around them isn't. |
| `/components` | 642 | 590 | 52 | 92% | `card-grid`/`nav-index` already carry the grid and sidebar. |
| `/components/*` (88 reference pages) | varies | varies | rest | 6–27% | **Not a gap** — see below. Grew from 37 to 88 in one stretch: ~50 new components shipped from the planned-components gap catalog (charts, mobile gestures, diagramming, data tables, image handling), each with its own reference page the moment it shipped — the planned-components catalog (`componentCatalog.web.ts`/`.mobile.ts`/`.diagrams.ts`) is now fully empty, every originally-catalogued gap has shipped. |
| `/docs` | 46 | 31 | 15 | 67% | Fully printed via `doc-section` — the page's own title/intro now prints via `doc-section`'s new `level: 1` support, not hand-authored. |
| `/docs/contributing` | 72 | 57 | 15 | 79% | Title/intro now printed (`level: 1`), rest via `doc-section`/`props-table`. |
| `/docs/devtools` | 48 | 30 | 18 | 63% | Title/intro printed; a hand-authored `Alert` bionic-reading demo at the end is the one real, deliberate exception left. Its two printed code samples now render via `CodeBlock` (see below), each adding one printed Copy button. |
| `/docs/getting-started` | 40 | 25 | 15 | 63% | Title now printed; no intro paragraph on this page (just a title). Its three printed code samples now render via `CodeBlock`. |
| `/about/agent` | 292 | 275 | 17 | 94% | Fully migrated — all 46 entries print via `heuristic`, title/intro via `doc-section` (`level: 1`, with three `<strong>` term-introductions rendered as `*emphasis*` instead — a `doc-section` deliberately has no bold syntax), and the last two hand-authored inserts from the first pass now print too: entry 5's demo via `spin-card`, entry 6's via `nav-bar`'s `resizable` flag. What's left is exactly the DevTools floor plus `nav-index` (this page's own left-sidebar) — **100% of this page's actual heuristics content** is printed. |
| `/docs/migration` | 40 | 21 | 19 | 53% | Title/intro printed; one hand-authored bold paragraph ("v1's officially supported migration target...") stays as-is — a genuine `<strong>` claim, not a term-introduction, so it wasn't safely approximable as italic the way heuristics' were. |
| `/docs/mobile-skew` | 49 | 34 | 15 | 69% | New page, fully printed via `doc-section` (title, one `list`). Describes a planned mechanism, not a shipped one — the page says so explicitly. |
| `/docs/packer-coverage` | 50 | 35 | 15 | 70% | Title/intro now printed (`level: 1`). |
| `/docs/robot-md` | 27 | 6 | 21 | 22% | Legitimate exception — a specialized file viewer (`RobotMdViewer`), not marketing prose; its non-zero % now is purely the printed site header, not page content. |
| `/docs/theming` | 67 | 52 | 15 | 78% | Title/intro now printed (`level: 1`). |
| `/docs/token-estimate` | 46 | 31 | 15 | 67% | Title/intro now printed; still has a live interactive estimator widget — partly a legitimate exception. |
| `/status` | 53 | 6 | 47 | 11% | Legitimate exception — an internal dev smoke-test page, not public marketing content; its non-zero % is purely the printed site header. |

**Site-wide roll-up (113 routes):** 10,239 components total, 4,395 printed — **42.9% printed** as a
flat average. That number is still misleading on its own: it's diluted by the 88 `/components/*`
reference pages (6–27% each, by design: only each component's own demo, code, props-table, and
accessibility/migration sections print, not the page chrome around them) plus `/status` and
`/docs/robot-md` (both non-zero too, for the site-header reason below, despite their own actual
content staying fully hand-authored by design). Excluding those routes, the remaining core
marketing/docs surface this inventory is meant to move toward 100% comes to **2,983 components,
2,043 printed — 68.5% printed** — essentially flat versus the previous write-up's 68.2%, since this
stretch's growth was almost entirely new `/components/*` reference pages (a legitimate exception
bucket, excluded from this figure) rather than core-surface conversions. That's the number to watch
trend upward; the flat 42.9% isn't a useful target since a large share of its shortfall is by
design, not backlog.

## Legitimate exceptions (not counted as gaps)

- **A component's own `LivePreview` demo**, on every `/components/*` reference page — *possible*
  to print (there's no real dependency cycle: `@rebar-ui/placement` already depends on
  `packages/core` for every construct, the same way a hypothetical one-component demo construct would),
  just not worth it. A construct's value is deciding *layout across components* (`banner` is icon,
  then text, then action, in a fixed order); a construct that's one component with its own props
  forwarded straight through decides nothing, and multiplied across 60 shipped components would
  mean 60 near-duplicate `ConstructRenderer` cases each needing updated in lockstep with the real
  component's own prop interface — a second schema to keep in sync, for no layout-decision
  benefit. This is why every reference page's real percentage sits in the teens/twenties rather
  than near 100%; a cost/benefit call, not an architectural wall. The Code/Props-table/
  Accessibility/Migration sections around that demo already are printed.
- **`/status`** — an internal dev tool for a quick visual smoke-test, not a page a real visitor
  reaches. Explicitly out of scope for "the marketing site."
- **`/docs/robot-md`** — a specialized file viewer (copy/download affordances over one file's raw
  content), not marketing prose with a natural construct shape.
- **Resolved, no longer an exception: the site header itself, on every route.**
  `apps/docs/src/components/SiteHeader.tsx` used to hand-author its logo/nav/version composition
  directly — exactly the "significant, unavoidable floor on every page" this doc used to describe.
  Closed by a new `site-header` construct (logo, a `NavBar` capped at half the header's width per the
  "Nav overflow" heuristic, and optional trailing content — text, a login action, or a signed-in
  avatar), now used site-wide. `ConstructRenderer`'s lone-constructlock-wrapper-skip (already applied to
  `page-index` for its sticky-positioning need) was extended to `site-header` too, so it still lands
  as a clean top-level `<header>` landmark, not nested inside extra wrapper markup. The one thing
  that stays a genuine, permanent exception is the `DevTools` panel itself — a live dev tool, not
  static content.
- **Each page's own right-hand content index** — `/about/agent`, `/blocks`, and `/benchmarks`
  now all print their nav rail through the `page-index` constructruct instead of a hand-authored
  `<SectionNav sections={...} />` call. `page-index`'s case in `ConstructRenderer.tsx` was always a
  verbatim pass-through to the real `SectionNav` component (forwards `sections`/`searchPlaceholder`,
  adds no logic of its own) — every real behavior (mist, beacon-follow, pointer animation, recenter
  delay, search threshold) lives inside `SectionNav` itself, so nothing about how the rail looks or
  acts changed, only how it's called. The one real gap this surfaced: `page-index` could previously
  only get its `sections` by auto-deriving them from the document's own top-level `doc-section`
  construct headings — exactly right for a plain prose page, but none of these three pages' content is
  `doc-section`-shaped (heuristics entries, construct-type reference entries, and benchmark sections are
  each their own bespoke structure), so naive conversion would have silently produced an empty rail.
  Fixed by giving `page-index` an explicit `sections?: SectionNavItem[]` override (see schema.ts) —
  when set, it wins over auto-derivation, so a page passes exactly the same `{ id, label }[]` array
  it already had, just through the construct instead of straight to the component. The surrounding
  `<Stack direction="row">` layout positioning the rail beside the scrolling main column is
  unchanged, hand-authored page chrome, same precedent as `Section` on the homepage — a construct
  decides content, not where a page puts its own layout regions.

  A second, real regression surfaced by Playwright verification (not assumed away): the rail's own
  `position: sticky` briefly broke on all three pages after conversion. `ConstructRenderer`'s normal
  `<Box><Stack gap="lg">` wrapper is harmless around most constructs, but wrapping a *lone* `page-index`
  construct in a single-child flex column collapses that column's height down to the nav's own height —
  a sticky element needs its containing block to be taller than itself to have any room to stick,
  and a direct flex item of the page's own (much taller) row gets that for free, while a nav nested
  two levels deeper inside its own single-item wrapper doesn't. Fixed in `ConstructRenderer`'s exported
  function: when `blocks` is exactly one `page-index` construct, it skips its own wrapper and returns
  that construct's render directly, so the real `<nav>` lands as a direct child of the caller's row,
  identical to hand-authoring it there. Confirmed via Playwright before and after, on all three
  pages: broken state had `top` moving from `89px` toward a large negative number tracking scroll
  distance 1:1; fixed state holds `top` at a steady `32px` (its real resting sticky offset) through
  a 1200px scroll, on `/about/agent`, `/blocks`, and `/benchmarks` alike.
- **Resolved, no longer an exception: `/about/agent`'s two former hand-authored inserts.**
  Heuristic #5's live demo (a `Spin` inside a `Card`) and heuristic #6's live demo (a real
  hand-resizable `NavBar`) both used to sit between printed `heuristic` constructs rather than inside
  one — neither was because the content was inherently unprintable, just that no construct existed for
  either shape yet. Closed by adding a new, generic `spin-card` construct (not one-off: tip, content
  lines, and card size are all caller-supplied) and a `resizable` flag on `nav-bar` (a bordered,
  real-CSS-`resize`-able demo wrapper, off by default since a real site header should never
  actually be user-resizable). Both are now printed on `/about/agent`, and `/blocks`' own
  `nav-bar` entry was updated to use `resizable` too, replacing what used to be a fixed, misleadingly
  captioned "shrink this box" demo that wasn't actually interactive.
- **Charts, `stats-table`, and `gallery` — the three archetypes `/benchmarks` needed, and the page
  migration itself, now done.** `/benchmarks` used to keep its `ScatterChart`/`LineChart`/
  `StackedBarChart` SVG helpers as one-off local functions in
  `apps/docs/src/components/BenchmarkCharts.tsx`, plus a local `StatsTable` (a thin `Table` wrapper
  over a `headers`/`rows` shape) and `Gallery` (a labeled `Carousel` of numbered screenshots) in the
  same file. The three charts were promoted into real `rebar-ui` components
  (`packages/core/src/components/{ScatterChart,LineChart,StackedBarChart}.tsx`) with matching
  constructs first; `stats-table` and `gallery` were added to `@rebar-ui/placement`'s schema afterward,
  matching the local helpers' exact shapes so no page needed new data, just a new way to print it.
  All 8 `/benchmarks/*` pages were then converted from hand-authored JSX into `Construct[]` documents
  printed through `NextConstructRenderer` — see the table above for the resulting per-page percentages
  and what stays a deliberate exception on each.
- **`CodeBlock`, closing heuristic #39.** Every `doc-section` construct's `code` ProseNode used to
  render as a bare `<Box as="pre"><code>` with no copy affordance — now it renders via a real,
  shipped `CodeBlock` component (a "Copy" button that flips to "Copied!" for 2s), so every printed
  code sample across `/docs/*` picked this up automatically, no page-by-page change needed. The
  homepage's "Get started" install snippet and `/blocks`' per-entry "Shape"/"Example" code samples
  also switched from the same old hand-rolled `<pre>` pattern to `CodeBlock` directly — both stay
  hand-authored call sites (not printed by the Packer), which is why they show up as a small dip in
  those two routes' printed percentage above rather than a gain: the fix is real and applies
  everywhere, it just happens to be more visible as "one more hand-drawn component" on the two pages
  that call it directly instead of through a construct.
- **`card-kanban`/`sticky-kanban`, two new archetypes sharing one primitive.** `card-kanban` wraps
  the new `Kanban` component (drag-reorder cards/columns, dividers, per-column/per-section limits,
  native HTML5 drag-and-drop) with board chrome above it — title, shared-with avatars, a Share
  action, a search box, an optional Board settings modal around the caller's own nested constructs.
  `sticky-kanban` is the identical schema shape and chrome, with `Kanban`'s `cardVariant="sticky"`
  swapped in instead: postit-style cards (procedural rotation/shadow, a per-card color) hard-capped
  at 3 per column, click (not drag) opens a built-in edit form. Both constructs share one
  `ConstructRenderer` sub-component (`KanbanBoardBlockView`), parameterized by variant, rather than two
  near-duplicate ones. `/blocks`' own demos of both are real, draggable boards, not static mocks —
  their components count almost entirely as printed. `/components/kanban` is a new reference page
  (the 37th), same "not a gap" bucket as every other component demo above, showing both variants.
- **Genuinely interactive widgets** — `/docs/token-estimate`'s live estimator, `/docs/devtools`'s
  live panel demo — the same reasoning as the component demos above; a construct can't sensibly wrap
  something whose whole point is live, client-side interactivity driven by more than static
  content. (`/`'s migration comparison is *not* an instance of this any more — it used to route
  through a hand-authored `MigrationComparison` component wrapping a `LivePreview` plus a raw
  `<iframe>`; both sides are now a `comparison` construct, the Rebar side and the antd side alike, with
  the antd side embedded via a real `iframe` construct instead of hand-authored markup. The only piece
  that stays a small client component is `ComparisonDemo` — it watches the ambient theme toggle and
  rebuilds the iframe's `src` with a `?theme=` query param, then hands the resulting `Construct[]`
  straight to the Packer; it supplies plain data, not markup, so it isn't a hand-drawn exception in
  the sense the other entries on this list are.)

## Real gaps, prioritized

1. **`/blocks` — 35%.** The `Entry` component's heading/tag/description/shape-code chrome around
   each construct's live demo is hand-authored; the demo itself already is not.

**Resolved this write-up: `/benchmarks/*` (8 routes) — was 3-19%, the previous #1 gap here (over
1,000 combined hand-drawn components), now 34-84%.** Closed exactly as scoped: two new archetypes
(`stats-table` — headers/rows through the real `Table` component, no sorting/filtering, matching
what these pages' summary tables actually need; `gallery` — a labeled, numbered-sequence screenshot
`Carousel`) landed in `@rebar-ui/placement`, then all 8 pages' actual prose/tables/charts/galleries
were converted into `Construct[]` documents printed through `NextConstructRenderer`. What's left hand-drawn
on these routes, by page: each page's `Alert` callouts (a single-component passthrough, the same
established exception used everywhere else on this site); two pages' galleries that use distinctly-
named images rather than a numbered sequence, so they don't fit `gallery`'s shape and stay a plain
`Carousel`; `/benchmarks/claude`'s two bespoke hand-drawn SVG scatter plots (a pre-existing, already-
documented exception, unchanged); and the `BenchmarksShell`'s own cross-page `NavIndex` plus the
DevTools floor, present on every route regardless of content.

**Resolved previously: `/about/agent` (was 19%) — see the table above and the `heuristic` construct
in `@rebar-ui/placement`'s schema.ts. Also resolved: the site header itself, on every route — see
`site-header` in the same file, and the "Legitimate exceptions" section below (the old floor bullet
has been rewritten to reflect this).**

## Working rule this inventory feeds

See `agents.md`'s "Working on the marketing site" section: touching `apps/docs` to add new content
is itself a signal to check this inventory and the construct catalog first — if the needed shape
doesn't exist as a construct yet, the correct order is component (if needed) → construct → printed page,
never a hand-authored shortcut that quietly adds to the hand-drawn count above.
