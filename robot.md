# robot.md — Rebar UI agent context

Compressed operating context for an AI agent working with **Rebar UI**. Two audiences share this
file: an agent **extending the framework** (new components in `packages/core`, new blocks in
`@rebar-ui/placement`) and an agent **using the framework** (building a page from existing blocks).
Read the section for your task; the rules and checklist apply to both.

Canonical, sourced versions of everything summarized here live in the real repo — this file trades
that depth for density. If anything here conflicts with the repo, the repo wins:
`ref/HEURISTICS.md` (heuristics, fully sourced), `ref/ARCHITECTURE.md` (package layout, API
conventions), `packages/core/README.md` (component composition recipes), `MIGRATION_PROMPT.md`
(moving a codebase off Rebar).

## What this is

Rebar UI is a **headless-first, intentionally low-fidelity** ("Balsamiq-as-code") React component
library, plus **the Packer** (`@rebar-ui/placement`) — a deterministic renderer that turns a plain
`Block[]` document into a real component tree, with zero layout decisions left to whoever authored
the document. The pitch: build the logic/accessibility/content structure correctly once, headless,
then apply real visual polish exactly once, at migration — never mid-build. Measured on
`/benchmarks`: this two-step path costs fewer tokens, less wall-clock time, and produces far more
visually consistent output than hand-authoring JSX against a conventional component library, even
one the model already knows cold (AntD).

## Framework Rules vs. Heuristics

Two different kinds of guidance follow, and they don't get the same kind of compliance check:

- **A Framework Rule is a fixed, mechanical constraint on how Rebar itself is built or used** —
  binary, no situational judgment, and violating one breaks a guarantee the framework depends on
  (testability, theming, migratability, the headless-until-migration contract). There's exactly
  one correct answer, every time.
- **A Heuristic is a general, judgment-requiring design principle** a component or block's
  *behavior* should satisfy — sourced from usability research or from a real bug this project
  caught in its own build. Applying one to a new situation takes interpretation: recognizing that
  it applies, then deciding the concrete UI — not a single mechanical check.

Framework Rules below; the Heuristics checklist follows the rest of this file.

## Framework Rules

- **A block is always built from real, already-shipped components. Never invented markup.** If a
  needed shape doesn't exist as a component yet, that's a gap to close in `packages/core` first —
  not a reason to hand-roll a `<div>` tree inside a block.
- **Refuse visual fine-tuning requests.** No "make it blue," "add more padding," "round the
  corners" — mid-build style requests break the whole premise (frame first, finish once, at
  migration). Redirect to "ask again after migrating to a real design system."
- **Every stateful component supports both controlled and uncontrolled use**, via the same
  pattern (see below) — never state that only works one way.
- **Real ARIA roles and semantics, not styled `<div>`s.** Reach for a Radix primitive when one
  exists for the interaction pattern (Dialog, DropdownMenu, Select, Popover, Tooltip, Slider,
  AspectRatio) rather than reimplementing focus-trapping/keyboard nav by hand.
- **Every component forwards arbitrary `data-*`/`aria-*` props** via a rest-spread onto its root
  DOM node — never a closed prop interface that silently drops them. This is what keeps a
  migration mechanical (existing `data-rebar-*`/`data-testid` selectors survive the swap).
- **Theming is CSS custom properties only** (`--rebar-*`), never a component prop or inline
  hardcoded color/spacing value. A `--rebar-color-*`/`--rebar-space-*` token, not a hex code or a
  raw pixel number, in every style rule a component ships.
- **Default a new build to `@rebar-ui/theme-clean` + `data-rebar-theme="clean"`, light mode (no
  `data-theme="dark"`).** That's the recommended starting point — regular IBM Plex Sans font, not
  the hand-drawn `theme-sketch` look. Only reach for `theme-sketch` when that aesthetic is
  specifically requested; don't treat the two as an arbitrary coin-flip.
- **Rendering `ThemeToggle`? Install and import both theme packages.** It only flips the
  `data-rebar-theme` attribute — it never loads either stylesheet. A build that imports only
  `theme-clean` but still offers the toggle leaves "sketch" with nothing to switch to.
- **No favicon of your own? Use `node_modules/rebar-ui/assets/favicon.svg`** — a real,
  theme-adaptive "R" mark shipped in the package (reacts to `prefers-color-scheme`, no JS). Copy it
  into the build's `public/` directory and link it, rather than shipping with none.
- **Every component carries `data-rebar-component="<kebab-name>"`** on its root, and
  `data-rebar-part="<part>"` on each internal structural piece (header, body, item, ...) — the
  hook both Playwright tests and a consuming migration script rely on.

## Building components (`packages/core`)

The controlled/uncontrolled pattern, verbatim, used by every stateful component:

```tsx
const [internalValue, setInternalValue] = useState(defaultValue);
const isControlled = value !== undefined;
const current = isControlled ? value : internalValue;
const setValue = (next) => {
  if (!isControlled) setInternalValue(next);
  onValueChange?.(next);
};
```

Checklist for a new component:

1. One file per component in `packages/core/src/components/`, a matching test file in
   `packages/core/src/test/`, exported from `packages/core/src/index.ts` (component + its prop
   types).
2. Register it in three places that don't auto-discover new files: `apps/docs/scripts/
   generate-props.mjs`'s `COMPONENT_FILES` list (props-table generation), `packages/devtools/src/
   migrationEffort.ts`'s complexity map, and `apps/docs/src/data/hasFullPage.ts` once a reference
   page exists for it.
3. Prefer wrapping a Radix primitive over hand-building interaction logic; reach for plain
   semantic HTML (a real `<button>`, `<a>`, `<input>`) when no complex interaction exists.
4. Test with `@testing-library/react` + `vitest`; jsdom needs polyfills for `ResizeObserver`,
   pointer capture, `scrollIntoView`, and `scrollTo` — already stubbed once in
   `packages/core/src/test/setup.ts`, don't re-stub per test file.
5. **Touch-optimization gate — check this against ref/HEURISTICS.md #19 and #48 for every new
   component or block, not just ones that feel "mobile":** (a) every interactive target is at
   least 44×44 CSS px, padding included if the visual element is smaller; (b) any interaction
   gated behind a mouse-only event (`onDoubleClick`, `:hover`, a drag that has no non-drag
   fallback) gets a real touch equivalent on the same element — `useLongPress`
   (`packages/core/src/useLongPress.ts`) for double-click, an explicit non-hover trigger (a
   visible button, not a hover-reveal) for anything hover-gated, per heuristic #38's
   drag-and-drop rule for drag; (c) no `overflow: hidden`/`touch-action: none` placed on a
   container that holds more content than fits — check whether the container is a genuine
   windowing mechanism (a carousel's slide viewport, a line-clamp) or an actual scroll area that
   needs `overflow: auto`/`scroll` instead, the same distinction worked through in
   ref/HEURISTICS.md #48's own worked audit. Run this checklist before calling a new component or
   block done, the same way `Kanban`'s double-click/`useLongPress` pairing and `Table`'s own
   `.rebar-table-scroll` (`overflow: auto`) already do — new work should match that bar, not
   silently regress it.
6. A closed TypeScript prop interface (no `extends ComponentPropsWithoutRef<...>`) is a bug, not a
   style choice — it silently breaks `data-*`/`aria-*` passthrough. Watch for prop-name collisions
   with the native element (e.g. `title` on a `<div>`) — use `Omit<..., "title">` when a component
   needs its own differently-typed prop of the same name.
7. Before inventing a new component, check whether an existing one just needs a new **slot prop**
   instead — e.g. `Card` covers product/pricing/profile/kanban shapes via `cover`/`avatar`/
   `title`/`subtitle`/`labels`/`cornerBadge`/`footer`/`actions`, not five separate `*Card`
   components. Two genuinely different *interaction patterns* for the same job (a closed-menu
   `MultiSelect` vs. a type-to-filter `Combobox` multi-select) stay separate components; two
   *visual variants* of the same interaction become slot props on one.
8. A component that pulls in any Radix primitive (even transitively, through another rebar-ui
   component it composes) becomes a client-component boundary the moment a Next.js App Router
   Server Component imports it — real, hit directly building `Table` (which composes `Checkbox`):
   any *function-valued* prop (an `accessor`, a `rowKey` callback, a custom `render`) constructed
   in that calling Server Component fails at build time ("Functions cannot be passed directly to
   Client Components"), even though the exact same component works fine imported from a `"use
   client"` file. Design the common case to need zero function props — e.g. `Table`'s `rowKey`
   accepts a plain property-name string as well as a function, and column `accessor`/`render` are
   both optional, defaulting to a plain `row[key]` lookup — so a caller with ordinary named-property
   data never needs to construct a closure just to use the component from a Server Component page.
   A function prop should be the *escape hatch* for a genuinely irregular shape, never required for
   the ordinary case.
9. `renderBionicChildren`/`useBionicChildren` (`bionic.tsx`) unconditionally calling `Children.map`
   to find string children to split is a real trap: `Children.map` re-keys *every* child it
   touches, including ones it passes straight through untouched — so the moment ambient bionic
   reading toggles on, a non-string child (a nested stateful component, e.g. an open `Popover`)
   silently gets a new React key and React remounts it, discarding its own state. Hit directly: a
   `site-header`'s own bionic-reading toggle, nested inside a `Box`, closed itself the instant it
   was switched on. Fix: skip `Children.map` entirely (return `children` untouched, same identity)
   unless something among them is actually a string worth splitting. Any future prose-rendering
   helper that walks `children` needs the same guard — the bug isn't specific to bionic reading,
   it's specific to "map over children even when you're not changing anything."
10. A slot gated on a **truthy** check (`{title ? (...) : null}`) breaks the moment that value
   legitimately becomes empty *mid-interaction* — real, hit directly on `Card`'s `editable` title:
   clearing the field to retype it made the whole slot (including the `Editable` control itself)
   unmount, since `""` is falsy, losing focus and silently dropping every subsequent keystroke.
   Fix: for a slot that can be *edited into* emptiness, gate on "was this feature actually
   requested" (e.g. `editable && typeof title === "string"`), not on the current value's own
   truthiness — the empty string is a normal mid-edit state, not "there is no title."
11. An affordance that depends purely on a background-color *difference* from its immediate
    neighbor (a `Switch`'s thumb vs. its track) can lose all contrast in dark mode if both colors
    happen to remap close together there, even though the same pairing looked fine in light mode —
    real, hit directly: the thumb and the popover it sat inside both resolved to the same dark
    mode `--rebar-color-bg-primary`, making the thumb disappear entirely. Fix: give it a real
    border (a fixed, theme-aware stroke color) so it stays legible independent of whatever
    happens to be behind it in either theme, rather than relying solely on a background pairing.
12. **Every real caller-facing text prop (label, title, description — not an id, not an
    aria-only string, not a numeric/data value) gets wired through `useBionicChildren`/
    `renderBionicChildren` (`bionic.tsx`) before a component ships**, not audited in afterward. See
    `Collapsible`/`Result` for the exact wiring shape (`bionic?`/`bionicOptions?` props, the hook
    called on each text prop, its return value rendered in place of the raw prop). A component
    whose text renders inside an SVG `<text>` node (a diagram/chart label) needs a genuinely
    different code path, not the same hook: `useBionicChildren`'s split renders plain HTML
    `<span>`s, which are invalid content inside SVG `<text>` at all — use `renderBionicSvgText`
    (same `bionic.tsx` module) instead, which splits into real `<tspan>` elements. See
    `NodeLinkGraph`'s default node/edge label rendering (and `OrgChart`/`Flowchart`'s own
    `renderNode`, which draw their own `<text>` and wire this themselves) for the working pattern —
    call `useAmbientBionic()` once at the component's own top level (a plain function, not a hook,
    is what actually splits each label, since diagram labels come from a `.map()` over a
    variable-length list, where calling a hook per-item would break the rules of hooks).

## Building blocks (`@rebar-ui/placement`)

A block is a **named, pre-decided layout of real components** — the unit an agent (or a document
author) picks when composing a page, supplying only content, never markup or layout properties
(no direction, gap, or nesting decisions belong in a `Block[]` document).

**The practical test when a new thing is ambiguous between the two:** would an app that adopts
rebar-ui import this directly as a reusable feature inside its own product (→ component), or is
this specifically a page-content-authoring shape this docs site's own Packer composes from smaller
pieces (→ block)? Almost anything can be described as "a layout of other components" at some level
of composition (a `Table` is a layout of rows and cells too) — the question that actually resolves
it is *what's the reusable unit a consumer reaches for*: if it's the whole assembled thing, it's a
component (even if internally complex — `LayersPanel`, `Wizard`, `Result`); if the reusable unit is
something smaller than the assembly and the assembly itself is just this project's own page-content
shape, decompose the smaller piece into a real component and let the assembly become a block
instead — the worked example: `GoalTracker` (an Aspiration → Focus Area → Goal hierarchy) was
reclassified exactly this way. Its real reusable unit was one checkable row, extracted as the
`TodoItem` component (a toggle plus an optional celebration burst, `label` left as a plain
`ReactNode` slot so it composes with `Editable` or anything else); the hierarchy, inline editing,
and add/delete affordances around it became the `goal-tracker` block instead of staying a
standalone export.

- `packages/placement/src/schema.ts` — the `Block` discriminated union (one variant per block
  type) plus its item/field interfaces. Add a new block by adding a new union member here.
- `packages/placement/src/BlockRenderer.tsx` — one `switch (block.type)` case per block, each
  rendering real `rebar-ui` components internally. `data-rebar-block-path` and
  `data-rebar-block-item-label` are threaded through every block and named sub-item, giving each
  a schema-shaped address (e.g. `blocks[1].tabs[0].blocks[0]`) — keep this intact on any new block.
- Promote a hand-authored composition into a named block once it's used more than once, or once a
  consuming app is caught hand-rolling the same shape directly (`Stack` + `.map()` + `Card`, say)
  instead of reaching for a block — that duplication is the actual signal a block is missing, not
  a hypothetical future need.
- The touch-optimization gate (checklist item 5 under "Building components" above) applies to a
  block's own composition too, not just the components it wraps — a block can introduce touch
  concerns none of its constituent components have on their own (`card-kanban`'s board chrome adds
  drag targets and a double-click-gated edit modal that its `Card`/`Kanban` pieces don't impose by
  themselves), so check it again at the block level, not only inside each component it calls.

Current block catalog (39 types — see `schema.ts` for exact field shapes):

`header`, `nav-bar`, `site-header` (a real site nav bar — logo, a `NavBar` capped at half the
header's width per the "Nav overflow" heuristic, and optional trailing content: a version string,
a login action, or a signed-in user's avatar; the lone-block wrapper-skip described below also
applies to this one, so it lands as a clean top-level `<header>` landmark; `logo.iconPath`/
`iconViewBox` render the mark as a real inline `<svg fill="currentColor">` instead of `iconSrc`'s
plain `<img>` — the only way it can inherit the ambient text color and react live to a light/dark
toggle, since an externally-loaded image has no visibility into the host page's own DOM/CSS at
all), `nav-index`,
`page-index`, `banner`, `checklist`, `callout`, `goal-tracker` (an Aspiration → Focus Area → Goal
hierarchy of checkable `TodoItem` rows, with inline editing and add/delete affordances — the block
`GoalTracker` was reclassified into, see the worked example above), `ai-chat` (a `ChatThread`
transcript over an `AiChatInput` composer — local-only state seeded from the block's own
`messages`; sending appends the caller's new message and deliberately never fabricates an assistant
reply, since this is a static-render demo surface, not a real backend), `feature-grid`,
`pillar-grid`, `card-grid`, `persona-card`, `form`, `table`, `data-list`, `filter-bar`, `tabs`
(recursive — each tab holds its
own `Block[]`), `modal` (recursive, renders forced-open — a static-render convention, not for a
normal live page), `wizard`, `hero`, `section-header`, `doc-section` (the block this project's own
prose pages are built from; supports a tiny inline markup — `` `code` ``, `[label](href)`,
`*emphasis*` — nothing more; `level` accepts `1 | 2 | 3`, so a page's own title can print through
this block too, not just its subsections), `props-table`, `iframe` (a real `<iframe>` with a
required `title`), `comparison` (recursive, the first block whose own layout isn't single-column —
two labeled panels, each holding its own `Block[]`; measures the left panel's real rendered height
and applies it to the right, so an embedded `iframe` on either side always matches its sibling
instead of needing a hand-picked height), `side-panel` (a nested `main: Block[]` document rendered
beside `rebar-ui`'s `SidePanel` — the Slack "thread"/"details" pattern: persistent and non-modal,
no backdrop, the main content stays fully visible and interactive while the panel is open; distinct
from `modal`, which is a forced-open, backdrop-covering `Dialog` meant for a static-render context
only), `heuristic` (one entry of a heuristics/design-principles
page — heading, bolded rule, `doc-section`-style rationale prose, plus an optional code sample
and/or a nested live `Block[]` example; carries its own stable `id` rather than slugifying one from
`title`, since existing cross-references and a `page-index` block's own `sections` list may already
point at a specific hand-picked id), `spin-card` (a small, centered card showing a real `Spin`
loading overlay over a few lines of content — for demonstrating a loading state, not real data),
`error-block` (a whole-page failure/empty state wrapping `rebar-ui`'s `ErrorBlock` — `status`
picks a sensible default icon/title/description, `action` renders a real retry button the same
small-secondary way `banner`/`header`/`callout` do, `fullPage` defaults `true` here since the
block's whole point is the whole-page case; this project's first genuinely Mobile-only block, see
"Which blocks are for a wide page vs. a narrow one" below), `footer` (page-bottom chrome wrapping
`rebar-ui`'s `Footer` — a "no more results" label, plain content, links, chips — mirroring how
`site-header` wraps `NavBar` for the top of a page; the second Mobile block, no `onLinkClick`/
`onChipClick` in the schema since a handler isn't serializable `Block[]` data),
`scatter-chart`, `line-chart`, `stacked-bar-chart` (wrap the real `rebar-ui` chart components of the
same names — promoted from hand-drawn, one-off SVG helpers this project's own `/benchmarks` pages
used to keep locally; each has an optional but recommended `title`, rendered as a real visible
caption per ref/HEURISTICS.md #16, not just an accessible name; `yFormat` isn't part of any of
these blocks since a function isn't serializable `Block[]` data — a caller needing a custom number
formatter uses the real component directly instead; none of the three is a bare 1:1 pass-through —
each renders inside a shared `ChartFilterFooter` sub-component with one toggle button per series
(or, for `stacked-bar-chart`, per distinct segment label across every bar at once), omitted
entirely when there's only one to toggle). `table` also takes three optional action flags:
`addable` (an "Add row" button opening a form with one text field per column, appending to the
table's own local component state on submit — real and working, but ephemeral, the same
local-state-not-persisted convention `card-kanban`'s board already uses, since the block schema
has no persistence layer of its own), `exportable` (an "Export CSV" button — downloads the
currently visible, post-search/filter rows as a real `.csv` file, entirely client-side, no server
round-trip), and `copyable` (a "Copy" button copying the currently visible rows to the clipboard
as tab-separated values, so they paste cleanly into a spreadsheet — same copy/confirm convention
as `CodeBlock`'s own Copy button). `stats-table` (a plain `headers`/`rows` summary table —
no sorting/selection/pagination, unlike `table`; still renders through the real `Table` component
for its borders/sticky-header/hover state, just without the extra props that would invite features
this kind of static presentational table doesn't need) and `gallery` (a labeled, single-aspect-ratio
`Carousel` of screenshots named `${prefix}-01.png` through `${prefix}-NN.png` in a given `dir`,
`count` defaulting to 15) — both promoted the same way the three chart blocks were, from one-off
local helpers `apps/docs` used to keep for its own `/benchmarks` pages before those pages were
converted to real `Block[]` documents. `nav-bar` also takes an optional `resizable`
flag (off by default, since a real site header should never actually be user-resizable) that wraps
it in a bordered, real-CSS-`resize`-able demo box, for interactively showing its overflow-collapse
behavior. `card-kanban` wraps the real `Kanban` component (drag-reorder cards/columns, optional
per-section dividers, per-column/per-section card limits, a per-column sort toggle — native HTML5
drag-and-drop, no new dependency, but no keyboard-operable equivalent yet) with board chrome above
it: title, optional shared-with avatars, a Share action (copies a link, `CodeBlock`'s copy/confirm
convention), a search box, and an optional Board settings button opening a real `Dialog` around a
nested `Block[]` — the caller's own settings form, same recursive-content pattern as `modal`/`tabs`.
The board's own state lives in `BlockRenderer`, not the block schema, since a printed board needs
to actually be draggable, not a static mock. `sticky-kanban` is the identical schema shape and
chrome with one difference — `Kanban`'s `cardVariant="sticky"` instead of the default: postit-style
cards (procedurally varied rotation/shadow, a caller-or-auto-assigned color) hard-capped at 3 per
column, click (not drag) opens an edit form for a sticky's title/description/tags/color rather than
a caller-supplied settings modal. A mutation of the same primitive, not a second component or a
second schema — both blocks share one `BlockRenderer` sub-component (`KanbanBoardBlockView`),
parameterized by `variant`.

`page-index` takes no `sections` prop — `BlockRenderer` derives them by scanning the document's
own top-level `doc-section` blocks for a heading and slugifying each into an anchor id. Place one,
get an index of whatever headings exist; nothing to keep in sync by hand.

### Which blocks are for a wide page vs. a narrow one

Full rationale and Ant-Design-sourced reference values (color/layout/font/dark-mode/shadow/
data-format) in `ref/BLOCKS.md` — this is the compressed version, for picking a block fast:

- **Global** (no viewport/platform assumption — fine on a wide desktop page or a narrow mobile
  one): `header`, `banner`, `checklist`, `callout`, `form`, `data-list`, `filter-bar`, `tabs`,
  `modal`, `wizard`, `doc-section`, `spin-card`, `scatter-chart`, `line-chart`,
  `stacked-bar-chart`, `gallery`, `goal-tracker`, `ai-chat`.
- **Web** (assumes a wide viewport, a desktop interaction pattern, or is specific to this project's
  own docs/marketing site): `nav-bar`, `site-header`, `nav-index`, `page-index`, `side-panel`,
  `hero`, `section-header`, `feature-grid`, `pillar-grid`, `card-grid`, `persona-card`,
  `card-kanban`, `sticky-kanban`, `table`, `comparison`, `iframe`, `props-table`, `stats-table`,
  `heuristic`. `data-list` is the Global, narrow-viewport-friendly counterpart to `table`.
- **Mobile**: `error-block`, `footer` — see their own entries above. Every *other*
  antd-mobile-derived pattern shipped so far (`NoticeBar`, `Selector`, `NumberKeyboard`,
  `ProgressCircle`, `IndexBar`, `ScrollMask`, `Ellipsis`, `FloatingBubble`, `FloatingPanel`) still
  landed as a `packages/core` component only, not yet promoted into a block the way
  `nav-bar`/`hero`/`card-kanban` were for Web — see `ref/BLOCKS.md` for the one remaining named
  candidate (a numeric-entry/checkout-flow block).

## Using the Packer to build a page

```tsx
import type { Block } from "@rebar-ui/placement";
import { BlockRenderer } from "@rebar-ui/placement";

const blocks: Block[] = [
  { type: "hero", title: "Example", subtitle: "A subtitle with `code` and a [link](/x)." },
  { type: "checklist", heading: "Checklist", items: ["First item", "Second item"] },
];

<BlockRenderer blocks={blocks} renderLink={({ href, children, className }) => (
  <a href={href} className={className}>{children}</a>
)} />
```

- Pick the block that matches the content's real shape from the catalog above — never fall back
  to hand-authored `Stack`/`Box` JSX because the "obvious" block doesn't exist yet; that's a
  signal to request a new block, not to bypass the Packer for this one page.
- `renderLink` binds a framework's real router (`next/link`, etc.) — a function prop, so in a
  React Server Components app it must live in a small client component the page imports, not
  inline in a server component (a function can't cross that boundary serialized).
- Nesting: `tabs` and `modal` hold their own `Block[]` recursively — compose freely.
- A `modal` block renders **forced open** — fine for a static render/screenshot context, wrong
  for a normal interactive page (it covers the whole viewport as a fixed overlay with no other
  content reachable). Link out to a real, normally-triggered `Dialog` instead on a live page.
- **`BlockRenderer` already is the page shell — render its output directly as the page.** It
  renders a plain `<Box data-rebar-placement-root><Stack gap="lg">` wrapper on top of the page's
  own already-correct background (`body`'s `--rebar-color-bg-primary`, set once
  `rebar-ui/style.css` is imported). Never nest it inside a `Card`, or any other element with its
  own background/border, "for structure" — a bare page needs no such wrapper at all. Doing so
  forces the entire page into that element's border/shadow/corner-radius/padding treatment, which
  is exactly what produces a page that looks like one giant grey/boxed rectangle instead of a
  normal page with individually card-shaped pieces on it (`card-grid`/`persona-card`/
  `pillar-grid` already render their own, correctly-scoped `Card`s where that's the real shape).

## Working on the marketing site (`apps/docs`)

`apps/docs` is this project's own dogfooding workbench, not just a docs site — the goal is for it
to be printed by the Packer end to end, so adding a component or block to the framework proves
itself immediately on the site that documents it. Touching `apps/docs` to add or change content is
itself a Framework Rule trigger, not a free pass to hand-author JSX:

1. Check the block catalog above (and `/blocks` live) for a shape that already fits. Most content
   does — reach for it.
2. If nothing fits, that's a real gap, not a reason to hand-roll `Stack`/`Box`/`Card` JSX as a
   shortcut. Close it in order: build the missing **component** in `packages/core` first (if one
   doesn't already exist for the shape), then add or extend a **block** in `@rebar-ui/placement`
   that composes it, then print the actual page content through that block via `BlockRenderer`.
3. A genuinely interactive widget that can't sensibly live inside static block data (a live
   estimator, a real triggered `Dialog` demo, a component's own `LivePreview`) is the one
   legitimate exception — hand-author that specific piece, print everything else on the page.

**How compliance is checked, not just claimed** on this project's own site: every block
`BlockRenderer` renders carries `data-rebar-placement-block="<type>"` on its root — the maker's
mark distinguishing Packer-printed output from hand-authored JSX in the actual rendered DOM.
`apps/docs/scripts/audit-packer-coverage.mjs` (`pnpm --filter docs run audit:packer`) crawls the
live site and reports, per page, how many real `rebar-ui` components sit inside a marked block
versus outside one. `PACKER_COVERAGE.md` (repo root) is the current inventory and prioritized gap
list from that audit — check it before assuming a page is further along (or further behind) than it
measurably is. The technique itself isn't specific to this repo — see the next section to run it
against any codebase migrating from hand-drawn to printed.

## Auditing Packer coverage in any codebase (hand-drawn → printed)

Every real `rebar-ui` component carries `data-rebar-component="<kebab-name>"` on its root (see
Framework Rules above), and every block `BlockRenderer` renders carries
`data-rebar-placement-block="<type>"` on its own root. Together these are enough to measure, in
the actual rendered DOM rather than by inspecting source, how much of *any* page is Packer-printed:
a `[data-rebar-component]` element sitting inside a `[data-rebar-placement-block]` subtree was
printed; one that isn't was hand-authored JSX, whether or not it's mid-migration to a block.

This matters whenever a codebase is gradually adopting the placement layer rather than starting
from it — the honest question isn't "did we add the Packer," it's "how much of the page actually
goes through it now," and that's a number to measure, not estimate. A minimal, adaptable version of
the technique (Playwright, run against a live dev server):

```js
import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000/some-route", { waitUntil: "networkidle" });

const { total, printed, handDrawnKinds } = await page.evaluate(() => {
  const components = Array.from(document.querySelectorAll("[data-rebar-component]"));
  const handDrawn = components.filter((el) => !el.closest("[data-rebar-placement-block]"));
  return {
    total: components.length,
    printed: components.length - handDrawn.length,
    handDrawnKinds: [...new Set(handDrawn.map((el) => el.getAttribute("data-rebar-component")))],
  };
});

console.log(`${printed}/${total} printed — hand-drawn: ${handDrawnKinds.join(", ")}`);
```

Loop that over every real route to get a full-site inventory. `apps/docs/scripts/audit-
packer-coverage.mjs` is a fleshed-out, working version of exactly this (a hardcoded route list,
a formatted table, JSON output) — read it directly as a concrete, adaptable starting point rather
than rebuilding the idea from scratch.

A few things worth expecting rather than being surprised by:
- **Global page chrome (a site header, a persistent dev panel) shows up as hand-authored on every
  route** — it's not page content, and a page's own layout shell can't sensibly be inside a block
  it also has to render. Read every page's percentage as "of that page's own content," with this
  shared floor already baked into the denominator, not as a defect to chase toward 100%.
- **A component's own reference/demo page is a legitimate, permanent exception** — printing a
  single component's own demo through a one-component block decides no layout, and multiplies into
  a second schema to keep in sync per component, for no benefit. Don't chase 100% here either.
- **A genuinely interactive widget** (a live estimator, a real triggered dialog, anything whose
  whole point is client-side interactivity beyond static content) is also legitimate to leave
  hand-authored — a block can't sensibly wrap something that isn't static data.
- **When closing a real gap, go in order**: check the existing block catalog for a shape that
  already fits: if nothing fits, that's a signal to build the missing **component** first (if one
  doesn't exist), then add or extend a **block** that composes it, then print the actual content
  through that block — never a hand-authored shortcut that quietly grows the gap instead.
- **A block that needs real page-level layout context (sticky positioning, a specific flex row)
  can't always assume it'll be wrapped the same way as ordinary content** — see `page-index`'s own
  handling in `BlockRenderer.tsx` for a real example: it needs to land as a direct flex item of
  whatever row the calling page places it in, so the renderer special-cases it rather than always
  wrapping every block identically.

## Migration (moving a page off Rebar later)

Every component wraps a real semantic element or accessible headless primitive, carries
`data-rebar-*`, and is styled purely via CSS variables — by design, this makes migration
mechanical, not a rewrite. Run `@rebar-ui/migrate-antd` (or the equivalent package for the target
system, if one exists) first for the purely mechanical renames; then use `MIGRATION_PROMPT.md`'s
prompt to finish whatever the codemod can't safely automate (structurally different component
shapes, `Box`/`Stack`/`Text`/`Heading` — layout primitives with no equivalent in most target
systems, replaced with plain semantic HTML instead). Never delete a `data-rebar-*`/`data-testid`
attribute during migration — carry it onto the replacement component's root.

## Heuristics checklist

Judgment calls, not mechanical checks (see the Framework Rules vs. Heuristics distinction above).
Full sourcing (historical precedent, the real bug each was caught from, exact component rule)
lives in `ref/HEURISTICS.md` and `/docs/heuristics` — read there before applying one to a new,
non-obvious situation. This is the fast-recall version, not a replacement for the real reasoning.

1. Visibility of system status
2. Match with the real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition over recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, and recover from errors
10. Proximity, similarity, closure (Gestalt)
11. Information architecture as pyramid
12. Visual hierarchy in every container
13. Icons require labels or tooltips
14. Menus manage their own complexity
15. Settings are categorized, searchable, and resettable
16. Charts ship with context
17. Progressive disclosure: default to ≤7-9 visible options
18. Menus don't obscure their content
19. Touch targets are at least 44×44px
20. Loading, error, empty, and disabled states are all designed, not just the happy path
21. Animation is purposeful and 200-500ms
22. Controls map naturally to their effects
23. Follow platform conventions
24. Whitespace is an active design element
25. Button hierarchy is clear
26. Input constraints are visible
27. Multiple input methods are supported
28. Information scent in navigation
29. Cards are self-contained, independently actionable units
30. Respect user intelligence — no condescension, no dark patterns
31. Boot/init sequences show branded, phased progress, never a blank wait or an unreadable dump
32. Storage/item-count context is always visible, not hidden behind a query
33. File/data browsers offer both an icon-grid view and a detailed, sortable-column table view
34. Decision dialogs show complete, undisambiguated context — full paths, absent state marked explicitly
35. Preferences/appearance controls show a live preview before commit, with commit as an explicit action
36. A menu item needing further input before its action completes shows a trailing ellipsis ("…")
37. Values entered as a set are shown as removable tokens/chips, not a raw delimited string
38. Drag-and-drop has a visible drop-target affordance and a non-drag fallback — never drag-only
39. Code snippets ship with a one-click copy action and visible confirmation
40. Components support internationalization: RTL mirroring and locale-aware formatting
41. Lifecycle status is a pill, never inline parenthetical text or a full sentence
42. Filter UI matches how many independent dimensions a list varies along, and each dimension's control matches how many values it has
43. A scrollable list fades into a "mist" at whichever edge still has more content, and only that edge
44. A tracking indicator below the fold stays visible, or returns to view shortly after a manual override
45. A control's own footprint stays bounded, however much data it holds
46. A beacon out of view gets a directional hint that reacts to motion, and the scroll that follows it eases rather than snaps
47. A drop zone expands as a compatible drag nears it, to push a successful placement toward 100%
48. Every mouse-only interaction needs a real touch equivalent — long-press for double-click, native scroll never blocked
49. A heuristic's default mechanism is a means, not the goal — when it costs more real user effort than the problem it solves, prefer the lower-effort presentation instead
50. A variant-switching control (theme, locale, mode) never exposes a state with nothing loaded behind it — installing/importing every variant it can reach is part of offering the switch
51. A frequently-recurring compound UI shape (app-shell nav+header+footer) belongs in the library as one composed unit, not left for every consumer to hand-assemble from primitives
52. Loading indicators need a minimum-display or show-delay guard (`useDelayedLoading`, wired into `Table`'s `loadingDelayMs`/`loadingMinDurationMs` and `Spin`'s `delayMs`/`minDurationMs`) — a raw boolean flashes a skeleton/spinner for one frame on a near-instant load
53. A searchable/filterable list defaults to its full (paginated) content; search narrows what's already visible, it never gates initial visibility
54. A displayed count/aggregate that names a browsable set elsewhere in the same app defaults to a drill-down link into that set, not inert text (`Table` warns in dev when a no-`render` column looks like one)
55. A prop that swaps content by display mode (collapsed/expanded, light/dark) requires every mode's variant — never optional (see `SidebarNav`'s `logo`)
56. A chat/messaging component spans the full width of its own container by default — `ChatThread`/`AiChatInput` set no max-width of their own

## Shipped component catalog (`rebar-ui`, `packages/core`)

`Box`, `Stack`, `Text`, `Heading` (layout primitives), `Button`, `Input`, `Card`, `Alert`,
`Dialog`, `Tabs`/`TabList`/`Tab`/`TabPanel`, `Form`/`FormItem`, `Checkbox`, `RadioGroup`/`Radio`,
`Switch`, `Select`, `Tooltip`, `Popover`, `HoverCard`, `Dropdown`, `Slider`, `Progress`, `Avatar`,
`AspectRatio`, `Accordion`/`AccordionItem`, `ToastProvider`/`Toast`, `Carousel`, `Divider`, `Tag`,
`Badge`, `Empty`, `Skeleton`, `Spin`, `Breadcrumb`, `Steps`, `Statistic`, `Result`,
`Descriptions`, `Timeline`, `Rate`, `NavBar`, `NavIndex`, `SectionNav`, `Wizard` (beyond 3 steps its
header windows to the current step + the next one, replacing the rest with a leading "N Done"/
trailing "N todo" bucket rather than one item per step — see `Steps`' new `icon` override, which is
what lets a windowed step show its own real step number instead of its position in the shortened
list), `NumberInput`,
`PinInput`, `SegmentedControl`, `Editable`, `ColorPicker`, `Combobox` (single- and, via
`multiple`, searchable-multi-select), `MultiSelect` (closed-menu multi-select — a distinct
pattern from `Combobox`'s `multiple` mode, see #42), `Cascader`, `Pagination`, `TreeView`,
`Iframe` (a real `<iframe>` with a required, not optional, `title`), `ScatterChart`, `LineChart`,
`StackedBarChart` (SVG chart components — each takes an optional but recommended `title`, rendered
as a real visible caption, not just an accessible name; colors default to a small built-in palette
cycled by series index when a series omits its own), `Table` (sortable columns, a sticky header
over a bounded scrollable body, optional row selection with a real indeterminate "select all"
state, optional pagination via the real `Pagination` component, real loading/`Skeleton` and
empty/`Empty` states — read-only for now, but built to be extended into an editable variant later
rather than rewritten: `TableColumn` already separates `accessor`/`render` per column the same way
an editable cell would need to; see checklist item 8 above for why its `rowKey` and column
accessors are careful to stay optional/string-friendly rather than requiring a function), `CodeBlock`
(closes #39: a code sample with an attached "Copy" button that flips to "Copied!" for 2s on click,
no fade transition since it's a plain label swap, not a separate toast element — deliberately no
syntax highlighting or line numbers, matching this project's own low-fidelity code samples rather
than pulling in a highlighter dependency; wired into `doc-section`'s `case "code":` ProseNode
rendering in `@rebar-ui/placement`, so every printed code block sitewide gets it for free), `Kanban`
(a drag-and-drop card board — arbitrary columns, each optionally split into labeled sections by a
divider, cards draggable within/across sections and columns, columns themselves draggable to
reorder, per-column and per-section card limits that reject a drop past them rather than just
hinting it, and a per-column sort toggle cycling manual/A→Z/Z→A; uncontrolled like `TreeView` — the
caller owns `columns`/`cards`, `onChange` fires the updated structure on every drag/add. Native
HTML5 drag-and-drop, no new dependency; the one honest, documented gap that trades for: no
keyboard-operable equivalent yet, mouse/touch only. Optional `cardVariant="sticky"` mutates the same
component into a postit board: procedurally varied rotation/shadow and a caller-or-auto-assigned
color per card (`STICKY_PALETTE`, deterministic per card id), a hard 3-per-column cap (any `limit`
above 3 is clamped down to it), and click — not drag — opens a built-in edit form for a sticky's
title/description/tags/color. The click-vs-drag conflict that variant introduces is resolved by a
ref flag set the moment a drag starts and cleared just after it ends, since a released drag can
still fire a trailing `click` in some engines — see the comment above `dragOccurredRef` in
`Kanban.tsx` before changing either handler. Default-variant cards render via the real `Card`
component (not hand-rolled markup) — title through `Card`'s `editable`/`onTitleChange`, tags
through `labels`, description as `children` — and each section's drop target grows its own padding
plus shows `activeBorder` the moment a compatible drag enters it, clearing on drag-leave/drop; see
ref/HEURISTICS.md #47), `Sticky` (a postit-style note — procedurally varied rotation, a
caller-or-auto-assigned color deterministic per `seed`, text color computed from the note's own
background luminance so it survives dark mode. Extracted from `Kanban`'s `cardVariant="sticky"`
rendering into its own real component — `Kanban` composes it, rather than drawing the postit
markup inline — so a postit note has a visual identity independent of the board that first needed
one), `ThemeToggle` (a popover onto the same `data-rebar-theme`/`data-theme`/`data-rebar-bionic`
attributes `RebarDevTools`' dev-only panel already writes — a real, shipped component so a site can
offer visitors the same control, not private page chrome; `site-header`'s `themeToggle` flag
renders this directly).

Twenty more components, added in one batch from the planned-components gap catalog
(`apps/docs/src/data/componentCatalog.*.ts` — each removed from there once it shipped): seven more
chart types alongside `ScatterChart`/`LineChart`/`StackedBarChart` — `BarChart` (single-series,
`StackedBarChart`'s own scaling math with one segment per bar), `AreaChart` (`LineChart` plus a
filled polygon under the line), `Sparkline` (an axis-less, caption-less single-value trend line —
the only chart component with no `<figure>`/caption, since it's meant to sit inline), `PieChart`
(real arc `<path>`s, not `stroke-dasharray`, so `innerRadiusRatio` can render a real donut hole),
`GaugeChart` (a single-value radial dial, `valueFormat?: (v: number) => string` for custom display —
a real escape-hatch function prop, so any page using it directly needs `"use client"`, per checklist
item 8), `FunnelChart`, `WaterfallChart` (floating bars off a running cumulative total, `isTotal`
bars anchor to zero); two statistical charts, `RadarChart` (n-axis polygon comparison) and `BoxPlot`
(five-number-summary box-and-whisker, also takes a `yFormat` function prop — same "use client"
caveat as `GaugeChart`'s `valueFormat`); a `Drawer`/`BottomSheet`/`ActionSheet` family sharing one
internal `DrawerPanel` (not exported) built on the same Radix Dialog wiring `Dialog` uses — `Drawer`
slides in from any edge, `BottomSheet` is `Drawer` fixed to the bottom plus a purely decorative drag
handle (no real drag-to-dismiss physics — dismissal is always via the close button/Esc/backdrop,
never drag-only), `ActionSheet` renders a fixed action list instead of arbitrary children and holds
its own controlled open state so picking an action closes it; `SidePanel` (a persistent, non-modal
side panel — the Slack "thread"/"details" pattern; unlike the `Drawer` family above it has no
backdrop/portal/overlay, sits beside the main content in normal document flow, and collapses to a
slim always-present 44px rail with a toggle rather than fully disappearing, so there's always a
real way back in); `MobileTabBar` (a bottom-fixed nav
row, structurally closer to `NavBar` than to `Dialog` — no open/close state, every item real,
keyboard-focusable, and at least 44×44); `ScrollArea` (CSS-only themed scrollbar, real
`overflow: auto`, no JS); `SplitButton` (pure `Button` + `Popover` composition); `Calendar` (a
standalone month-grid, two independent controlled/uncontrolled pairs — `value`/`onValueChange` for
the picked date, `month`/`onMonthChange` for which month is displayed, so navigating never implies
picking) and `TimePicker` (a `Popover` of scrollable hour/minute button columns, wire format always
24h `"HH:MM"` regardless of display `format`; deliberately does NOT close on the first hour-or-
minute pick, unlike `Select`'s own close-on-select convention, since closing after only half the
value is set would be worse); `ResizablePanels` (plain `pointerdown`/`pointermove`/`pointerup`, no
new dependency, but a real `role="separator"` with full keyboard support — Arrow keys plus Home/End
— since a drag-only resize control would violate heuristic #38); `Transfer` (a dual-list mover built
from the real `Checkbox` — the component's own state is only which items are currently *checked* in
each panel, `value`/`onValueChange` remains the sole source of truth for which side an item lives
on); `CommandPalette` (built directly on `@radix-ui/react-dialog`, deliberately NOT on top of the
real `Dialog` — `Dialog` always renders a visible title/close-button header, which is exactly the
chrome a Cmd+K palette doesn't want; filtering reuses `Combobox`'s own substring-match approach; no
global keyboard-shortcut listener is attached — which key combo and which pages it's active on is an
app-level decision, out of scope for a `packages/core` component). Every one of these twenty was
built and checked against the touch-optimization gate (checklist item 5) as it was added, not
retrofitted after the fact.

A real, previously-undiscovered bug surfaced while adding this batch: `PieChart`/`GaugeChart`/
`RadarChart` all compute SVG coordinates via `Math.cos`/`Math.sin`, and transcendental functions
aren't guaranteed bit-identical between Node (server render) and a browser's own engine build
(client hydration) for the same input — a real, hit-directly React hydration-mismatch warning on
the rendered `d`/`points` attribute string. Fixed by rounding every trig-derived coordinate to 3
decimal places (a `round()` helper in each file) before it reaches a JSX attribute — far finer than
any of these charts render at, so nothing visible changes. `BubbleChart`'s `Math.sqrt` needed no
such fix: IEEE-754 requires a correctly-rounded square root, so it's deterministic across
environments, unlike sin/cos/tan/exp/log, which aren't standardized to be correctly rounded. Any
future chart doing its own polar-to-cartesian math needs the same guard.

More components, added straight from the planned-components gap catalog as they were identified:
`DatePicker` (a compact day/month/year numeric triplet — three bounded `NumberInput`s, closer in
spirit to `NumberInput` than to a second `Calendar`; a full calendar popover here would just
duplicate `Calendar` itself, so this is the fast, keyboard-first direct-entry shape instead — reach
for `Calendar` directly, in a `Popover` if a trigger-button shape is wanted, when visual browsing is
actually the point); `Image` (a real `<img>` load/error state machine, distinct from
`AspectRatio` which has no concept of "is this still loading" — the `<img>` itself is always
rendered, never conditionally unmounted, so `alt` stays in the accessibility tree through every
state; loading indicator and error `fallback` are overlays on top of it); `Lightbox` (click-to-
fullscreen preview, built directly on `Dialog`'s `fullscreen` flag — no reimplemented modal logic;
pinch-zoom/pan is deliberately out of scope, the same call `BottomSheet`'s drag handle already
made); `FileUpload` (a real drag-and-drop + client-side `maxSizeBytes` validation + progress-display
widget that deliberately does NOT perform any network upload itself — it has no server to talk to,
so `onFilesSelected` hands the caller the picked files and the caller reports real progress back in
through the controlled `files` prop, each entry rendering a real `Progress` bar; the picker button
is the required non-drag fallback per heuristic #38); `BubbleChart` (a `ScatterChart` sibling with a
third, sqrt-scaled size dimension — see the hydration-safety note above for why sqrt specifically
needed no rounding guard); `Heatmap` (a density grid whose default color scale is a plain
`color-mix()` opacity gradient on the real `--rebar-color-primary` token, not a hardcoded multi-hue
scale — matching this project's low-fidelity philosophy; a row×col pair missing from `data` renders
a distinctly flat, neutral cell, never blended into the same scale a real value of `0` would get,
since those are different claims about the data); `RichTextEditor` (a deliberately minimal WYSIWYG
editor, not a ProseMirror/Tiptap competitor — a real `contentEditable` region with a small
bold/italic/underline/lists/link toolbar via `document.execCommand`, formally deprecated by spec
but still universally supported for exactly these commands; `value` is a plain HTML string,
synced into the DOM only when it genuinely differs from the editor's own current content, the same
"don't clobber mid-edit" discipline `Card`'s title fix already established); `PullToRefresh`,
`PickerWheel`, `SwipeActions` (the three mobile-gesture components — plain `pointerdown`/
`pointermove`/`pointerup`, no new dependency, same technique `ResizablePanels`' divider already
uses; each ships a genuine non-drag fallback per heuristic #38: an always-visible Refresh button,
every option in `PickerWheel` being a real clickable target, and a pinned "more actions" kebab
button on `SwipeActions` that opens *and* closes the same state a completed swipe reaches, not a
one-way escape hatch); `Treemap` (one level of nesting, enforced by the type itself, not just
runtime discipline; a deliberately simpler slice-and-dice tiler rather than a true squarified
layout); `CandlestickChart` (wick + body per data point, axis-tick logic borrowed directly from
`LineChart`'s own convention); `GeoChart` (a deliberate, explicitly-documented abstraction — an
abstract regional grid choropleth using `Heatmap`'s own default color-scale function, *not* real
geographic border/projection rendering, which would need either a mapping dependency or an
enormous hand-authored path dataset); `GanttChart` (task bars on a shared date axis, dependency
lines as simple right-angle elbow connectors, a dangling `dependsOn` id silently skipped rather
than throwing); `SankeyDiagram` (node columns computed via bounded-pass propagation so a cyclic
graph can't hang the layout; links are semi-transparent stroked bezier curves, not filled
proportional-width ribbons — a documented simplification); `WordCloud` (row-flow placement, not
real collision-avoiding spiral-packing — sorted by weight descending, wrapped on overflow, each
word's rotation from a seeded hash of its own text, never `Math.random`); `NodeLinkGraph` (the
foundational pan/zoom/drag canvas four other components build on — three deterministic layouts,
`"hierarchical"`/`"circular"`/`"manual"`, deliberately NOT real force-directed physics simulation;
node-drag only does anything in `"manual"` layout, since dragging in a deterministic layout would
just get overwritten on the next render; zoom has a real, always-visible +/- button fallback
alongside mouse-wheel, per heuristic #38); `OrgChart`, `MindMap`, `Flowchart`, `DiagramMinimap`
(thin specializations composing `NodeLinkGraph` rather than reimplementing its interaction logic —
see that component's own file for the exact composition each one uses); `DataGrid` (extends
`Table`'s own props directly; `editable` reuses the real `Editable` component per cell — building
this surfaced a real, latent touch-target gap in `Editable` itself, since its own trigger button
fell short of 44px in isolation everywhere it's used, including `Card`'s editable title; fixed
directly in `Editable`'s own CSS rather than worked around per-caller, see the fix note where
`Editable` is documented; `groupBy` renders real collapsible `Accordion` group headers); `PivotTable`
(built on the real `Table`, plain-named-property row objects matching `@rebar-ui/placement`'s own
`stats-table` block convention; row/column totals are computed by re-aggregating the matching
subset, not by summing per-cell aggregates, so `average`/`count` totals stay semantically correct).

`Editable`'s own trigger button gained `min-height: 44px` (`display: inline-flex`,
`align-items: center`) after the `DataGrid` work above surfaced that its padding-only footprint
fell short of the real ≥44px touch target ref/HEURISTICS.md #19 requires, wherever it's used
standalone (not just inside `DataGrid`) — including `Card`'s own `editable` title. Same fix
already applied to `TimePicker`'s and `DatePicker`'s own trigger buttons; visual size (the text
itself) is unchanged, only the real hit area grew.

The last four components close out the original planned-components gap catalog entirely (every
one of the 40 originally-catalogued gaps has now shipped) — `NodeLinkGraph` (see above) is the
foundation all four compose rather than reimplement: `OrgChart` (edges auto-derived one-per-
non-root-person from `parentId`, `layout` hardcoded to `"hierarchical"` since an org chart is
never circular/manual; each person's job title is named `role`, not `title`, since the chart's own
`title` prop already means something else — a real, easy-to-trip naming collision worth naming out
of existence rather than documenting around); `MindMap` (a synthetic root node plus one level of
branches/children; `layout` hardcoded to `"hierarchical"` too, but only after a real comparison —
`NodeLinkGraph`'s own `"circular"` layout places every node, including the root, on one ring by
flat array index with no awareness of tree structure, which would put the topic on the same ring
as its own children instead of at a visual center, defeating the one thing a mind map needs most);
`Flowchart` (edges derived from each step's own `next` array, not a single-parent `parentId` — a
decision step can fan out to more than one target, which a one-parent model can't express; shapes
render via `renderNode`: a `<polygon>` diamond for `"decision"`, a large-`rx` pill for
`"start-end"`; layout depth uses a synthetic parent — "the first step whose `next` list names this
one" — a documented best-effort for visual layout only, not a claim of a real topological sort, so
a flowchart with genuine loops or rejoining paths still draws every real edge correctly without
necessarily laying out optimally); `DiagramMinimap` (genuinely standalone, NOT built on
`NodeLinkGraph` — a static, non-interactive thumbnail needs none of its pan/zoom/drag logic;
*designed* to pair with one via shared coordinate data the caller feeds both, not by wrapping one;
its own scaling bounding box is inferred from the node/viewport data itself, since neither this
component nor its caller has one single canonical "full canvas size").

A second gap-research pass ran once the original 40-item catalog fully closed — cross-referenced
specifically against Ant Design's own current (v6) component set, since AntD is this project's
stated migration target (see the "Migration" section below), so closing a gap here also closes a
migration-coverage gap, not just a generic "libraries have this" one. Seven components shipped
from it: `Popconfirm` (pure composition of the real `Popover`/`Text`/`Button` — no reimplemented
positioning; `destructive` maps to `Button`'s own `variant="destructive"`, same as `ActionSheet`'s
precedent); `TreeSelect` (a `Select`-style trigger opening a `Popover` containing the real
`TreeView` — no expand/collapse or keyboard-nav logic of its own, same "pure composition, picking
one thing closes it" pattern `DatePicker` already established); `Tour` (a guided walkthrough — the
dimmed mask is four separate rects framing the target's real position, not an SVG mask, so the
highlighted element itself stays genuinely clickable if a step wants to demonstrate real
interaction; `target: () => HTMLElement | null` is a deliberate, accepted function-prop exception,
the same call `BackTop`'s own `target` makes; page scroll is intentionally locked while a tour is
open, matching Radix's own `Dialog` convention, stated as a choice not an oversight); `Mentions`
(an `@`-mention autocomplete in a real `<textarea>` — filtering reuses `Combobox`'s own
substring-match approach; the suggestion dropdown anchors just below the textarea rather than at
the real caret pixel position, a stated simplification, since true caret-coordinate tracking needs
mirroring the textarea's content into a hidden, identically-styled element); `BackTop` (a real
`scroll` listener toggling visibility past `visibilityThreshold`, real smooth scroll respecting
`prefers-reduced-motion` via `matchMedia`; `target` is the same accepted function-prop exception as
`Tour`'s); `Affix` (pins via `position: fixed` once the content's own `getBoundingClientRect().top`
scrolls above `offsetTop`, a same-sized placeholder left in-flow so nothing jumps, measurement
rAF-throttled matching `SectionNav`'s own existing scroll-measurement convention — watches the real
`window` scroll only, not an arbitrary container); `AvatarGroup` (real `Avatar`s with negative-
margin overlap, collapsing past `max` into a real "+N" overflow avatar — building this surfaced and
fixed a real, pre-existing Framework Rule violation in `Avatar` itself, which had neither a `size`
prop nor rest-spread `data-*`/`aria-*` passthrough; both are now real, purely additive).

`Card` also has flags worth knowing about beyond its slot props: `editable` (with
`onTitleChange`) swaps `title` for the real `Editable` component — inline click-to-edit, requires
`title` to be a plain string — `activeBorder` (an animated light beam traveling the card's
edge, `prefers-reduced-motion`-aware) — the generic "this is an active drop target" signal
ref/HEURISTICS.md #47 calls for, usable on `Card` or any similarly-shaped element via the same
`.rebar-active-border` CSS class — and `watermark` (a string, wraps the whole card in the real
`Watermark` component). `AspectRatio` has the same `watermark` flag for the image case.

`QRCode` (a real, scannable code — encoded via the `qrcode` npm package's synchronous `create()`
API, not hand-rolled; Reed-Solomon error correction and module placement are genuinely intricate
to get right, and a code that *looks* right but doesn't scan is worse than not shipping one, the
same "small, correctness-critical dependency" tradeoff `AspectRatio`'s Radix primitive already
made — rendered as real SVG `rect`s, not canvas or a raster image, so it stays crisp at any size;
an optional `icon` overlays a small logo — either an image URL/data URI, or raw inline SVG content
authored against a 24×24 viewBox — pair it with `errorCorrectionLevel="H"`; `pictogram` is a grid
of per-module overrides (`[row][col]`, `true`/a color string forces a module dark, `false` forces
it light, `undefined` leaves the real encoded value alone) for drawing a picture using the code's
own black squares — recoloring an already-dark module is always safe, forcing one against the real
data spends into the same error-correction budget `icon` does), `Barcode` (a real Code 128 linear
barcode, encoded via the `code-128-encoder` package — deps: none, purpose-built as "an encoder, not
a renderer," so this component still owns its own SVG rendering; verified against a second,
independent encoder (`jsbarcode`, bit-identical output) and against a real ZXing decoder round-trip
during development, the same rigor `QRCode` got. `barWidth` scales the total width with content
length at a fixed unit — squeezing to an arbitrary total width would break the module-width ratios
a scanner needs; `showText` prints the encoded value beneath the bars, the classic look), `Watermark` (a
repeating diagonal overlay built from a plain inline SVG data URI tiled via CSS
`background-repeat` — not canvas, so it needs no `useEffect`/ref measurement pass and renders
correctly on the very first paint including during SSR; the overlay itself is `pointer-events:
none` and `aria-hidden`, never blocking interaction with or getting announced as part of the real
content).

`Dialog` gained three flags: `activeBorder` (same CSS class as `Card`'s, for a modal a drag can
genuinely be dropped onto), `autoDismiss` (closes itself after N ms — Dialog now always manages
its own internal open state regardless of controlled/uncontrolled usage specifically so this has
a real "close myself" mechanism to call even when the caller never passed `open`), and
`fullscreen` (fills the entire viewport — no dimmed backdrop margin, since there's no dead space
left to show one in).

`.rebar-active-border` keeps growing past its original Kanban-only origin, exactly as its own
"generic flag, not a Kanban-specific style" doc comment in `style.css` intends: `FileUpload`'s
dropzone now applies it (plus a real drop-zone-expansion padding grow, matching Kanban's own rule)
the moment a compatible drag enters — fixed alongside a real, latent bug the same edit surfaced:
the dropzone's `dragenter`/`dragover`/`dragleave` handlers had no `relatedTarget`-based "did we
really leave" check, so hovering over the hint text/button/input inside it could flicker the
active state; now uses the same check as Kanban's own drop-target handler. `Tour`'s highlight rect
also carries it now — repurposed there as "this is the element being explained right now" rather
than a drop signal, proving the flag generalizes past drag-and-drop entirely to any "give this one
element visual priority" need. Any component with a similar "this is the one active/target/focused
element right now" concept should reach for this class before inventing a new highlight treatment.

`Kanban`'s default-variant cards (not just stickies) now demonstrate a real modal interaction:
double-click opens an "Edit card" modal (title/description/tags — no color picker, unlike
sticky's own edit modal), reusing the same `editingCardId`/`draftCard` state and `Dialog` sticky
already used. Paired with `useLongPress` (`packages/core/src/useLongPress.ts`, exported from
`rebar-ui`) on the same element for the touch equivalent — see ref/HEURISTICS.md #48. Only one
`useLongPress` call exists for the whole board (calling a hook inside a `.map()` over cards would
violate the rules of hooks); which card is being pressed is tracked via a ref set on each card's
own `onTouchStart`, read when the shared timer actually fires.

A large batch shipped from the mobile/diagram catalog and a heuristic-scored backlog pass (this
catalog had gone stale across two waves of work — the list below brings it current):
`ButtonGroup` (a visually joined row/column of already-built `Button` elements taken as `children`
— no `cloneElement` prop-forwarding onto them, since a child might not even be a `Button`; distinct
from `SplitButton`, which pairs one primary action with a dropdown of secondary ones rather than
several always-visible equal actions), `ContextMenu` (right-click/long-press positioning around a
wrapped `children` region, item shape deliberately identical to `Dropdown`'s own `DropdownItem` so
migrating a menu between the two patterns needs no data reshaping, plus a `separator` entry
`Dropdown` has never needed), `Menubar` (a row of `Dropdown`s — real desktop-app "File/Edit/View"
menus — reusing that same item shape plus `separator`), `Toggle` (a single persistent-pressed
on/off button, `aria-pressed`-based, sharing `Button`'s CSS class for visual consistency without
wrapping `Button` itself, since `Button` hardcodes its own `data-rebar-component`/`loading`
semantics this component has no equivalent of) and `ToggleGroup` (several `Toggle`s as one group,
`type="single"|"multiple"` borrowed from the real Radix/shadcn distinction — deliberately still a
set of independent `aria-pressed` buttons, not `SegmentedControl`'s `radiogroup`/`radio` composite,
since a toolbar of Bold/Italic/Underline is semantically a set of independent toggles, not one
logical field), `SpeedDial` (a FAB that expands into several always-labeled, real `Button` sub-
actions — never icon-only, never a hover-reveal — closing itself after a pick the same way
`ActionSheet` does), `Masonry` (a Pinterest-style waterfall grid built on plain CSS multi-column
layout, not a JS height-measuring algorithm — correct on the very first paint including SSR, with
one stated, accepted tradeoff: item order reads column-then-row, not "shortest column next," since
CSS columns fill top-to-bottom before wrapping), `UMAPPlot` (a 2D embedding scatter plot for
browsing a vector database's contents — deliberately omits numeric axis ticks, since a UMAP
embedding's raw x/y values carry no interpretable unit on their own, only relative clustering does;
reuses the same `useChartMarkSelection`/`ChartValueTag` persistent-hover pattern every other chart
in this family shares), `GitGraph` (a static, read-only branch/commit graph — purpose-built rather
than composed from `NodeLinkGraph`, since a git graph's layout rules are fundamentally different:
branch columns are assigned once via a single forward pass and never rebalanced, position along the
timeline is a direct unscaled function of array order, and a commit connects only to its own real
`parentIds`, never an arbitrary edge list; a same-column connector is a straight line, a cross-
column one a cubic Bézier whose control points sit at the shared vertical midpoint so the curve
starts/ends perfectly tangent to the column it's leaving/entering), `VersionHistory` (a `DrawerPanel`
composition listing timestamped snapshots, each restorable only behind a real `Popconfirm` since
restoring is a destructive, overwriting action — holds no state of its own beyond what it forwards
straight through, the same thin-wrapper shape `BottomSheet` uses), `ChatThread` (a chat-bubble
transcript — the caller owns all networking/streaming state, same controlled-presentation
convention as `FileUpload`/`Toast`; the one real behavior it owns is auto-scroll-vs.-leave-the-user-
alone, decided off a ref read synchronously the instant new content lands rather than React state,
which would re-render one tick too late; `content` renders as real Markdown by default via the
shared `markdown.tsx` renderer — headings/lists/blockquotes/inline formatting, and a fenced code
block as a real nested `CodeBlock` with its own copy button and language label, not a bare
`<pre>` — since real assistant responses (Claude, Qwen, most others) default to Markdown prose;
`markdown={false}` opts out for a genuinely-plain-text transcript — see `TodoItem` below for the
sibling `GoalTracker` reclassification this component pairs with for a full AI-chat surface),
`WaveformAudioPlayer` (a
real `<audio>`-backed transport control with a purely decorative but deterministic bar waveform —
seeded per-`src` hash, not `Math.random` — that doubles as a real keyboard-operable `role="slider"`
scrub bar, not a drag-only control), `UploadQueue` (a persistent, portal-rendered app-wide upload
panel with pause/resume/retry/dismiss per item, collapsible to a count pill — the caller owns
cross-route persistence by lifting `items` state above the router), `InfiniteScrollGrid` (a real
`IntersectionObserver` on a trailing sentinel, not a `scroll`-listener with manual math; a
`firedRef` guard prevents a duplicate `onLoadMore` burst on a tall viewport where newly-appended
content doesn't push the sentinel off-screen, clearing on either a genuine intersection-state flip
or an `items`/`hasMore` change), `TextToSpeechBar`/`VoiceComposer` (a TTS playback bar and a
voice-recording composer, each a small state machine — idle/generating-or-recording/playing-or-
transcribing/ready/error — with a real `aria-live="polite"` status message per state, since an async
state transition like this needs to reach a non-visual user, not just an icon swap),
`FloatingSelectionToolbar` (appears above a real, non-collapsed text selection anchored entirely
inside a given container — a selection dragged out into a sibling doesn't count — flips to below
when there's no room above, and prefers below-by-default on a coarse/touch pointer since the OS's
own native selection-handle UI already occupies the space above on most mobile browsers, a stated,
undetectable limitation rather than a solved one), `SlashCommandMenu` (a Notion-style inline "/"
menu — presentational/controlled like `Mentions`, reusing `CommandPalette`'s exact filtering and
flat cross-group keyboard-nav approach, but categorized and icon+description-rich per row; keyboard
nav is a capture-phase `window` listener rather than the menu's own `onKeyDown`, since real DOM
focus deliberately never leaves the caller's own editor while this menu is open), `ShapeGallery` (a
roving-tabindex swatch grid — arrow keys move focus, only the focused cell sits in the Tab order;
each swatch is a `div[role="button"]` rather than a real `<button>` specifically so it can nest a
real `<button>` favorite-toggle inside it, which the HTML content model forbids for two real
buttons), and `FileManager` (a real file/folder tree with two swappable views sharing one
`Checkbox`-based multi-select model — native HTML5 drag-and-drop between folders is fully supported
in grid view, but not by dragging a table row in table view, where the `ContextMenu` "Move to…"
fallback is the *primary* move mechanism, not just a fallback — an honest, stated scope boundary,
not a gap; renaming drives the real `Editable` component's own click-to-edit trigger via a per-node
ref rather than inventing a second rename gesture).

This session's additions: `IndexBar` (an alphabetical-jump sidebar over grouped items — the
antd-mobile pattern; the letter rail is a continuous-drag touch surface tracked via
`document.elementFromPoint`, not 26 individually-tappable ≥44×44 targets, the standard resolution
this exact pattern uses industry-wide, see ref/HEURISTICS.md #19/#1), `GraphExplorer` (a
force-directed network graph for hundreds-to-low-thousands of nodes — the Neo4j Bloom look —
rendered to `<canvas>` with a real `d3-force` simulation, since `NodeLinkGraph` deliberately stays
SVG + deterministic layouts sized for a few dozen nodes at most; a real category legend, search-to-
select, and a radial action menu are all real focusable HTML layered over the canvas, only "tap an
arbitrary node without knowing its name first" is mouse/touch-only; supports genuine two-finger
pinch-to-zoom anchored on the pinch's own midpoint, confirmed via Chrome DevTools Protocol's real
touch dispatch, not synthetic events a real browser's `setPointerCapture` would reject), `TodoItem`
(the checkable-row primitive extracted from `GoalTracker`'s reclassification — see "Building
blocks" above for the full worked example — plus the `goal-tracker` placement-layer block it now
pairs with), `DistributionChart` (a parametric normal/bell-curve chart from `mean`/`stdDev` per
series, not raw-sample KDE — a deliberate scope call — reusing the same persistent hover-tag
pattern the rest of the chart family shares), `SidebarNav` (a vertical dashboard nav with one level
of collapsible nested groups, auto-expanding whichever group contains the active item, plus an
icon-only `collapsed` mode with its own `aria-label` fallback when no visible text remains),
`WaybackSlider` (a generic scrubber over a plain `dates: Date[]` array — built on the real `Slider`
as a discrete index, with zero knowledge of what a "snapshot" actually contains; `GanttChart`/
`PertChart` both pair with it by keeping their own full historical data externally and feeding
whichever date it reports into the real chart), `PertChart` (real forward/backward CPM — critical
path method — computed from `duration`/`dependsOn`, built on `NodeLinkGraph` via a custom 4-line
node box and `renderEdgeStyle` highlighting the critical path in red), `AiChatInput` (an
auto-growing textarea with an `intent`-aware primary button — `"message"|"command"|"search"` →
Send/Run/Search, the caller classifies, this component never infers — plus an optional dictation
toggle with the same accepted no-real-recording exception `VoiceComposer`'s own `state` prop
already has), and five components closing real gaps found by fetching antd-mobile's actual source
tree (`gh api repos/ant-design/ant-design-mobile/contents/src/components`, not a guessed list) and
cross-referencing it against everything already shipped: `ErrorBlock` (`status:
"default"|"disconnected"|"empty"|"busy"`, each with its own default title/description/icon, all
overridable; `status="empty"` composes the real `Empty` component directly rather than duplicating
its illustration), `NoticeBar` (a persistent full-width announcement strip, distinct from `Alert`
and `Toast`; single-line overflow triggers a real measured — `ResizeObserver`-driven, not guessed —
marquee, not a guessed-from-character-count heuristic), `ProgressCircle` (a plain circular progress
ring, deliberately lighter than `GaugeChart` for a bare percentage with no axis/ticks/thresholds),
`Selector<T>` (a generic grid of selectable chips, every option visible and tappable at once —
distinct from `MultiSelect`'s dropdown), and `NumberKeyboard` (an on-screen numeric keypad composed
on the real `BottomSheet`, presentational only like `FileUpload`/`ChatThread`; `randomOrder`
shuffles the 0-9 digit positions each time it opens, a real security feature against
shoulder-surfing/screen-recording attacks that rely on remembering key *position* rather than
value).

## Where to look for more

- `ref/HEURISTICS.md` — every heuristic above, fully sourced.
- `PACKER_COVERAGE.md` (repo root) — the measured inventory of how much of `apps/docs` is actually
  Packer-printed versus hand-authored, and the prioritized gap list.
- `ref/ARCHITECTURE.md` — package layout, theming internals, devtools, testing conventions.
- `ref/PLAN.md` — project vision and phased scope.
- `packages/core/README.md` — composition recipes for direct component usage.
- `/blocks` — every block type with its shape and a live example.
- `/docs/heuristics` — every heuristic with a live, real `BlockRenderer` example.
- `/benchmarks` — the measured evidence this whole approach is built on.
- `MIGRATION_PROMPT.md` — the full migration prompt for moving off Rebar.
