---
title: Rebar UI — Architecture
status: living document
---

# Rebar UI — Architecture

Technical decisions supporting [PLAN.md](PLAN.md). See [ASSESSMENT.md](ASSESSMENT.md) for the
reasoning behind the departures from the original brainstorm.

## Package layout

Monorepo (pnpm workspaces + Turborepo, pending confirmation):

```
packages/
  core/            # components + primitives, wraps Radix, ships CSS-var-only styles
  placement/       # @rebar-ui/placement — the placement layer: construct schema + ConstructRenderer, see below
  theme-sketch/    # default sketch theme: fonts, sketchy borders, grayscale tokens
  theme-clean/     # plain production-safe baseline theme
  devtools/        # dev-only floating panel — kept out of prod via a consumer-side dynamic import, see below
  adapters/
    antd/          # @rebar-ui/migrate-antd — prop-map + codemod, first adapter template
apps/
  docs/            # marketing + component reference + migration guide (Next.js + MDX — see MARKETING_SITE.md)
  playground/      # deeper, multi-component live sketch <-> clean toggle demo
```

`core` depends on Radix primitives + React Hook Form (for `Form`). `placement` depends only on
`core` (it renders constructs using `core`'s own components) — it's a separate package specifically so
a consumer who never wants the placement layer (just the atomic components) doesn't pay for it.
`theme-*` packages are pure CSS (custom properties + a stylesheet), no JS. `devtools` depends on
`core`'s internal usage registry but is an entirely separate import — an app that never imports
`@rebar-ui/devtools` pays zero cost
for it.

## The placement layer — `@rebar-ui/placement`

Rebar UI is meant to be built with by an LLM through a small procedural placement layer, not by
hand-authoring `Stack`/`Box` JSX directly: the model writes a compact typed document naming a
handful of pre-built composite archetypes — called **constructs** — and a deterministic renderer
(`ConstructRenderer`, built from `core`'s own components) turns that document into the actual tree. The
model never decides layout — direction, gap, nesting — only which construct and what content.

Two heuristics do the actual layout work, so the model never has to:

- **Anatomical order** — within any one construct, its internal parts always render in the same fixed,
  predetermined sequence, head to toe. A `callout` is always icon → title → subtitle, top to
  bottom, every time; a `banner` is always icon → text → trailing action, left to right. The model
  fills in the slots' content; it never decides which slot comes first.
- **The magnetic heuristic** — at the document level, constructs are simply listed in the order the
  model wants them to appear, and the renderer "snaps" each one into the stack in that sequence —
  like magnets pulling into a line, not a grid the model has to compute coordinates for. Supplying
  order is the only placement decision the model makes; no `x`/`y`, no `flex`/`grid` value, ever.

**Status: shipped as `@rebar-ui/placement`, dogfooded on this project's own marketing site
(`apps/docs`)** — not just a benchmark prototype anymore. `ConstructRenderer` and its construct catalog
(39 types as of this writing — see `packages/core/robot.md`'s own catalog for the full list with
descriptions, and [`CONSTRUCTS.md`](CONSTRUCTS.md) for how they split across Global/Web/Mobile) live in
`packages/placement/src`; the homepage's feature-card row and three-pillars grid
(`apps/docs/src/app/page.tsx`) are real `ConstructRenderer` output, not hand-authored `Stack`/`Card`
JSX — proof-by-existence that the mechanism holds up outside the one benchmark component it was
validated on, per the dogfooding principle already stated in
[MARKETING_SITE.md](MARKETING_SITE.md#what-to-change-and-why).

A third, orthogonal axis classifies both components and constructs by where they sit in a
build-lifecycle — Imitations (static primitives) → Synthetics (static compositions) → Opinions
(real state/reactivity) → Orders (macro/page-level governance) — see
[`TIERS.md`](TIERS.md). Read literally as a four-step ladder it doesn't quite survive contact with
the real construct catalog: "Order" turned out to be a different axis entirely (macro governance vs.
behavioral complexity) than the Imitation→Synthetic→Opinion complexity ladder, so of the 39 constructs
only ~8 are genuine Orders — the rest split across Synthetic (~22, plain static content) and
Opinion (9, constructs that already embed real interactive state in `ConstructRenderer.tsx` despite looking
like static schema data). `TIERS.md` keeps that nuance explicit for whoever maintains the schema;
`robot.md`'s own digest states the four tiers as the clean ascending lifecycle they are for
everyday use, since that's still a genuinely good mental model for an LLM composing new content to
hold, even though "Order" is really the frame the other three render inside rather than a fourth
rung on their ladder. "Opinion" is not a vibe: a construct *is* an Opinion iff its schema type declares
a `source`/`onX` live-data-binding field (`packages/placement/src/opinions.ts`), a mechanical,
compiler-checked fact, not a judgment call.

The evidence for the underlying mechanism lives in
[`/benchmarks`](../apps/docs/src/app/benchmarks/page.tsx): a hand-authored-JSX version of Rebar
lost to AntD by ~54% in token cost; the placement-layer version not only closed that gap but beat
AntD outright — cheaper, faster wall-clock, and with visual output that is (with a properly scoped
prompt) pixel-identical run to run, versus AntD's real run-to-run drift. That result held up again
on an image-driven build (read a screenshot, produce the same document), once the prompt spelled
out the document schema instead of making the agent discover it by reading source files.

What's still open: the three archetypes measured in that benchmark (`banner`/`checklist`/`callout`)
were chosen to fit one benchmark component; `feature-grid`/`pillar-grid` were added to cover this
project's own marketing copy and haven't been measured in isolation the same way. Whether the construct
vocabulary keeps paying off as it grows to cover arbitrary UI, and whether DOM order (and therefore
accessibility — WCAG 2.1 SC 1.3.2) stays correct as more constructs are added, are the honest open
questions, not yet answered by more than "it worked for these six."

**Why this is the intended default rather than an optional mode:** most of the token cost of an
LLM building UI is paid up front, during the early, high-volatility phase of a project — flows,
layouts, and information architecture are still being figured out, and every design decision made
against a fully-styled, opinionated target library has to be re-justified on every iteration. That
is exactly the phase where a low-fidelity, placement-driven build is cheapest and most consistent:
there is nothing visual to re-litigate, so iteration is fast and (per the benchmark above) far more
predictable in cost. Once a project's UI has actually stabilized — the flows are settled, it is
heading to production — the adapter/codemod migration path (see "Migration adapters" below) is the
bounded, one-time cost of moving to a real, brand-customized design system for long-term use. Rebar
is not meant to compete with a production design system on visual fidelity; it is meant to be the
cheapest way to iterate before you need one.

## Mobile skew: a second print, chosen automatically (planned, not yet built)

**Status: architecture doc only, per an explicit user request to write down the concept before
building it — nothing described in this section is implemented yet.** Tracked as `ref/TOM.md`
prompt-queue item 4.

The idea: every web component and web diagram the Packer prints gets *two* prints from the same
source data, not one — a desktop print (what exists today) and a mobile print, generated
alongside it, not as a separate authoring step. At render time, the client picks which one to show
based on the viewport actually in front of the user: a phone or a small tablet gets the mobile
print; a large tablet gets the full desktop app, same as a laptop. The practical result: a site
built through the Packer gets a mobile-optimized version of itself automatically, the same way it
already gets a consistent, low-fidelity visual baseline automatically — no separate mobile design
pass, no second document for the model (or a human) to author.

**Why this is a placement-layer problem, not a per-component one.** A component built and used
directly (hand-authored `Stack`/`Card` JSX, not through `@rebar-ui/placement`) can only get this
via the conventional route — container queries or breakpoint-gated CSS baked into that one
component, decided once at build time, the same as any other component library. That works, but it
means every component re-solves "what does this look like small" on its own, and a hand-authored
page combining several components has no single place that could look at the *whole* page and
decide to restructure it for a small screen (reorder sections, promote/demote content, collapse
what a desktop layout affords space for). The Packer already is that single place: it already owns
every layout decision for a page built through it (anatomical order, the magnetic heuristic — see
above) precisely so the model never has to. A second render path inside the same renderer, given
the same `Construct[]` document, is a natural extension of a decision this system already centralizes,
not a new architectural seam — for a component used *directly*, a container-query-based mobile
adjustation is still the right fallback, just narrower in scope (that one component's own layout,
not the page around it).

**What "mobile print" should mean, concretely** (a first-pass sketch, not committed): denser
vertical stacking in place of a desktop row's horizontal arrangement (the same content, `anatomical
order` still deciding internal sequence, just without a desktop row's width to spend); larger
touch targets by default, consistent with ref/HEURISTICS.md #19 (44×44px minimum) rather than a
separate rule; overflow-prone chrome (a `nav-bar`'s collapsed items, a `table` construct's named
filters) collapsing more aggressively, since a phone's viewport hits those overflow thresholds far
sooner than a laptop's; anything genuinely desktop-only (a hover-triggered `HoverCard`, a
drag-and-drop `Kanban` board without `useLongPress`'s touch pairing) either gaining its already-
required touch equivalent (see ref/HEURISTICS.md #48) or being deliberately simplified for the
mobile print rather than rendered unusably.

**Where diagrams fit in.** The user's original framing was "every web component *and every web
diagram*" — diagrams (flowcharts, sequence diagrams, org charts) are a separate, not-yet-built
archetype family for `@rebar-ui/placement` (see the removed `/diagrams` "coming soon" placeholder
for the prior state of that intent — the concept is unchanged, just no longer a stub page in the
nav). Whenever diagram archetypes are actually built, they inherit this same two-print mechanism
for free, for the same reason components do: they'd already be `Construct[]`-described and rendered by
the same Packer, not a bespoke SVG each diagram type invents its own responsive behavior for.

**Detection.** Chosen by real viewport/device signals at render time (not, e.g., a user-agent
string sniff alone — those are unreliable and don't track a foldable or a resized window), matching
the breakpoint tokens ref/HEURISTICS.md already defines (`### Breakpoints`) rather than inventing a
second set. The exact mechanism (a `matchMedia` listener driving which print `ConstructRenderer`
returns, vs. two static builds selected server-side) is an open implementation question, not
resolved by this doc on purpose — this section exists to state the *shape* of the commitment before
committing to one specific technical path.

Core API uses its own consistent conventions rather than mimicking one specific target library
(see [ASSESSMENT.md](ASSESSMENT.md#keep-but-change) for why):

- Controlled visibility: `open` / `onOpenChange` (converged convention across Radix, MUI, AntD —
  safe to use natively, not a library-specific borrowing).
- Emphasis: `variant="primary" | "secondary" | "tertiary" | "destructive"` (not AntD's `danger`
  boolean — `variant` is the more universal term across Radix-based and Chakra-style libraries).
- Sizing: `size="sm" | "md" | "lg"`.
- Loading: `loading={boolean}` on interactive components.
- Every component accepts and forwards arbitrary `data-*` and `aria-*` props to its root DOM node
  — required so `data-rebar-*` and any project-specific test IDs survive both styling changes and
  future adapter codemods.

### The `data-rebar-*` namespace

```tsx
<button
  data-rebar-component="button"
  data-rebar-variant="primary"
  data-rebar-state={loading ? "loading" : "idle"}
>
```

- `data-rebar-component`: stable identity of which Rebar component rendered this node. Never
  changes across theme or variant.
- `data-rebar-part`: for compound components, which internal part this node is (e.g. `dialog`'s
  `title`, `trigger`, `content`).
- `data-rebar-state`: current interaction state (`open`/`closed`, `checked`/`unchecked`,
  `loading`/`idle`), mirroring Radix's own `data-state` where Radix already provides one (don't
  duplicate — read Radix's `data-state` directly when it exists).

Playwright guidance shipped in docs: prefer `getByRole` first (works identically pre- and
post-migration because Radix/AntD are both fully ARIA-compliant); fall back to
`[data-rebar-component="..."]` only when a role-based query is ambiguous or the target library's
role output can't be trusted yet.

## Theming mechanism

All visual values are CSS custom properties, scoped under a `--rebar-` prefix, defined once in
`theme-sketch`/`theme-clean` and consumed by `core`'s stylesheets — never written as literal
values inside a component's CSS. Theme switching is:

```html
<html data-rebar-theme="sketch" data-theme="dark">
```

A single attribute toggle on the root element; no per-component JS re-render needed for a theme
change, no runtime style mutation. Dark mode is an orthogonal attribute so it composes with either
theme.

**Theme rules must scope to their own attribute selector only — never also to bare `:root`.**
An earlier version of `theme-sketch` matched `:root, [data-rebar-theme="sketch"]` in one rule, to
make sketch "the default" even with no attribute set. That meant sketch's tokens always applied
at the root regardless of which theme was actually active, and switching to
`data-rebar-theme="clean"` on the same element came down to an equal-specificity, source-order
tiebreak between `theme-sketch`'s and `theme-clean`'s CSS — which broke in practice (clicking
"Clean" didn't change the font; Turbopack's CSS bundling doesn't guarantee the import-order
assumption that tiebreak depended on). Fixed by scoping every theme rule to only its own explicit
`[data-rebar-theme="..."]` (and `[data-theme="dark"]`) selector, never `:root` — an app with no
theme attribute set at all now falls back to `core`'s own inline `var(--x, fallback)` values
rather than silently becoming "sketch." Getting-started docs already instruct setting the
attribute explicitly, so this doesn't change the documented setup path, only removes an
undocumented, fragile implicit default.

No component ever silently rewrites a developer-authored value (e.g. "rounds" a stray `margin:
13px` to `16px`). Deviations from the token scale are surfaced as **dev-mode console warnings**
(or an optional ESLint rule scanning for raw pixel values in Rebar component usage) — visible,
not corrected out from under the developer. This matches Rebar's own heuristic of "visibility of
system status" instead of contradicting it.

## Migration adapters

v1's officially supported migration target for the web component set is Ant Design v6 — the only
target with a real codemod, not just the generic prompt. Other component sets (mobile, once it
ships) may target something else entirely; a shared component library across sets doesn't imply a
shared migration target.

Pattern, not a one-off: an adapter package (`packages/adapters/<name>`, published as
`@rebar-ui/migrate-<name>`) ships a jscodeshift codemod that partitions a file's `rebar-ui`
imports into "has a target equivalent" (moved to the target library's import, renamed/flattened
as needed) and "doesn't" (left importing from `rebar-ui`, for `MIGRATION_PROMPT.md` or a manual
pass to handle) — never a blind whole-file import-source swap, since not every Rebar component
has a target equivalent.

`@rebar-ui/migrate-antd` is the first instance, built and actually verified, not just sketched:
- `Dialog` → `Modal`: `open`/`title`/`footer` unchanged; `onOpenChange` → `onCancel`, flagged
  with an inline review comment (`AntD's onCancel takes no argument, unlike onOpenChange(open:
  boolean)`) rather than silently assumed compatible — the original plan here was wrong until
  actually built. `description` (a prop `Modal` doesn't have) is promoted into a child instead of
  silently dropped.
- `Button`: `variant="destructive"` → `danger`; `variant="primary"|"secondary"|"tertiary"` →
  `type="primary"|"default"|"text"`; `size="sm"|"md"|"lg"` → `"small"|"middle"|"large"`.
  **A native `type` (e.g. `type="submit"`) is moved to AntD's `htmlType` prop first** — AntD's
  own `type` means visual variant, colliding with Rebar's native pass-through meaning. This was
  found by dogfooding the codemod against `apps/docs/src/app/page.tsx`, not by reasoning about it
  in advance; the synthetic test fixtures alone didn't catch it. Take this as the standing bar:
  run a new adapter against real code before considering it done, not just its own unit tests.
- `FormItem` → `Form.Item`: `required` kept, plus a generated `rules={[{ required: true, message:
  ... }]}` alongside it (AntD's actual validation lives in `rules`). The render-prop children
  pattern (`{(field) => <Input {...field} />}`) is unwrapped to a plain child when it's a single
  arrow function returning one JSX element, since `Form.Item` clones a direct child rather than
  calling a render function.
- Deliberately **not** migrated: `Box`/`Stack`/`Text`/`Heading` (no direct AntD equivalent) and
  `Tabs`/`Tab`/`TabList`/`TabPanel` (AntD's items-array shape isn't a safe syntax-level flatten —
  needs semantic understanding of which panel pairs with which tab). These stay importing from
  `rebar-ui` and get a note pointing at `MIGRATION_PROMPT.md`.

Tested via jscodeshift's own `applyTransform` test helper against inline fixtures (7 tests,
`packages/adapters/antd/src/test/transform.test.ts`), covering every case above including the
`htmlType` regression.

A second adapter (`migrate-mui` or `migrate-shadcn`) is deferred, but the pattern above should
make it a template exercise, not a redesign — that's the test of whether this architecture holds
up.

`MIGRATION_PROMPT.md` (repo root) is the human/agent-facing complement, for components no
codemod exists for yet (or ever will, if the shape is too different to automate safely) and for
resolving the `rebar-migrate:` review comments a codemod like this one leaves behind.

## DevTools panel

Shipped as its own package, `@rebar-ui/devtools` (`<RebarDevTools />`), so an app that never
imports it pays nothing.

**The `NODE_ENV==='development'` check inside the component is not sufficient on its own to keep
it out of production bundles** — verified empirically, not assumed: a production build of
`apps/docs` with a plain `import { RebarDevTools } from "@rebar-ui/devtools"` still shipped the
panel's markup strings and its `MutationObserver`-based counting logic in the client chunks.
Turbopack (and bundlers generally) will fold a literal `process.env.NODE_ENV` comparison in
first-party app code, but does not reliably extend that constant-folding into bundled
`node_modules` code — so the internal early-return never becomes bundler-visible dead code from
the consuming app's side.

The reliable pattern, and the one `apps/docs` actually uses (see
`apps/docs/src/components/DevToolsMount.tsx`): the environment check happens **in the consuming
app's own code**, gating a dynamic `import()` of the package (and its stylesheet) rather than a
static top-level import:

```tsx
"use client";
import dynamic from "next/dynamic";

const RebarDevTools =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@rebar-ui/devtools").then((m) => m.RebarDevTools), { ssr: false })
    : () => null;
```

Because the check is evaluated in code the app's own bundler treats as first-party, the dead
branch (and therefore the `import()` call inside it) is actually eliminated in production —
confirmed by re-grepping the production build afterward and finding nothing. This is the
documented, recommended way to mount `RebarDevTools`; the internal `NODE_ENV` check stays as
defense-in-depth (so `forceEnabled` tests and non-bundled usage still behave correctly), not as
the primary guarantee.

Internally, component counts are **not** tracked via app-level instrumentation (no context
provider every `core` component has to call into) — the panel queries the live DOM for
`[data-rebar-component]` elements via a `MutationObserver`-backed hook
(`useComponentCounts`), scanning only while the panel is open. This is simpler than threading a
usage-registry context through every component and requires zero changes to `packages/core`. The
panel shows:

- Live component-instance counts by type, current page (real, queried — not estimated).
- Sketch/clean theme radio + dark-mode toggle (writes the `data-rebar-theme`/`data-theme`
  attributes described above).
- 8pt-grid overlay (a fixed, pointer-events-none absolutely positioned grid).
- Component inspector (hover any node with `data-rebar-component` to see its metadata in a
  floating tooltip).
- A **bucketed migration-effort estimate** — Low/Medium/High from a weighted score over
  simple/medium/complex component counts (`estimateMigrationEffort`). Explicitly not a token or
  dollar figure (see [ASSESSMENT.md](ASSESSMENT.md#keep-but-change)) — the exported JSON report
  labels it explicitly as "not a measured cost."
- Export report (JSON) — downloads the real counts + effort estimate. No separate "overview page"
  route: a full-page view would require assuming the host app has a route to dedicate to it,
  which doesn't hold across arbitrary consuming apps, so the popover itself is the whole surface
  for v0.1.

## Testing strategy

- Unit tests (`vitest`) for token/theme logic, prop-mapping tables, codemods.
- Component tests (`@playwright/test` component testing or Testing Library) for every component:
  render, keyboard operability, ARIA role/name assertions.
- A dedicated "survives re-skin" test: render a component tree under `theme-sketch`, snapshot its
  `data-rebar-*`/ARIA output, re-render under `theme-clean`, assert the same output — this is the
  automated proof of the core value proposition and should exist before v0.1 ships.
