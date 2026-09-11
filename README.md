# rebar-ui

Headless-first, intentionally low-fidelity React components — real Radix UI underneath, styled
purely via `--rebar-*` CSS custom properties (swap `@rebar-ui/theme-sketch` for
`@rebar-ui/theme-clean`, or write your own, without touching component code).

## Building a whole page or screen? Use `@rebar-ui/placement` instead

If the task is "build a UI with rebar-ui" rather than "this one component, right here" — install
`@rebar-ui/placement` and compose a small `Block[]` document instead of hand-authoring `Stack`/
`Box`/`Card` JSX against these components directly. Real, repeated measurement found hand-authored
`rebar-ui` JSX loses to hand-authored Ant Design (an unfamiliar library costs more tokens than a
familiar one, even a simpler one); building the same UI through the placement layer instead beats
Ant Design outright, on tokens, wall-clock time, and consistency. See that package's own README for
the full case and the archetype list. What follows below is for direct component-level use — a
single component, a custom composition the placement layer's archetypes don't cover — not for
composing a whole screen.

## For coding agents: read this first, not the source

**The exact prop shape of every component is in `dist/index.d.ts`** (~220 lines, one file, every
interface) — read that, not the individual files under `src/components/`. The `.tsx` source files
carry full implementation (Radix wiring, `forwardRef` boilerplate, JSX) that's irrelevant to "what
props does this take" and costs far more to read than the type declarations alone.

```
node_modules/rebar-ui/dist/index.d.ts
```

## Install

```
npm install rebar-ui @rebar-ui/theme-clean
```

```tsx
import "rebar-ui/style.css";
import "@rebar-ui/theme-clean/theme.css";
```

Set `data-rebar-theme="clean"` on `<html>` or any wrapping element — **this is the recommended
default for a new build**: light mode (no `data-theme="dark"`) with `theme-clean`'s regular
IBM Plex Sans font, not the hand-drawn `theme-sketch` look. Reach for `@rebar-ui/theme-sketch` +
`data-rebar-theme="sketch"` only when the hand-drawn "Balsamiq-as-code" aesthetic is specifically
wanted; don't treat the two as an arbitrary coin-flip. Add `data-theme="dark"` alongside it for
dark mode, or `data-rebar-bionic="true"` for bionic reading
(bolds the first portion of each word so the eye can pattern-match it — a dyslexia-readability aid;
deliberately bold-only, not dimmed, so contrast never depends on what surface the text sits on) — both are
plain DOM attributes toggled live, no rebuild, no Provider. Every text-bearing component
(`Text`, `Heading`, `Alert`, `Card`, `Tag`, `Button`, `Breadcrumb`, `Steps`, `Result`,
`Descriptions`, `Timeline`, `Statistic`, `Empty`, `Dialog`, `Toast`, `Checkbox`, `Radio`, `Tab`)
follows `data-rebar-bionic` automatically; a `bionic` prop on any of them overrides it for just
that instance, and `bionicOptions` (`fixationStrength`, `saccadeFrequency`, `skipShortWords`) tunes
the split.

## The page background is already handled — don't add your own

Once `rebar-ui/style.css` is imported, `body { background: var(--rebar-color-bg-primary) }` is
already set. A bare page needs **no wrapping container at all** for background/layout purposes —
render your content directly (a plain `<div>`/`<main>`, or `Stack gap="lg"` to space sections
out) and the page background is already correct.

**Never wrap an entire page or screen in `Card` (or any other single bounded-content
component).** `Card` is for one bounded piece of content — a list item, a summary tile, a panel
that sits *on* the page — not the page itself. A `Card` around everything forces the whole
viewport into Card's own border/shadow/corner-radius/padding treatment, which is exactly what
produces a page that looks like one giant grey/boxed rectangle instead of a normal page with
cards on it. If nothing on the page is genuinely card-shaped, don't reach for `Card` at all.

```tsx
// Wrong — the entire screen becomes one Card, background/border apply to everything
<Card>
  <Heading level={1}>Dashboard</Heading>
  <Stack gap="lg">{/* ...everything else... */}</Stack>
</Card>

// Right — page content renders directly; Card (if used) wraps only the pieces that are
// actually card-shaped
<Stack gap="lg">
  <Heading level={1}>Dashboard</Heading>
  <Card>{/* one summary tile */}</Card>
  <Card>{/* another summary tile */}</Card>
</Stack>
```

Building a whole page with `@rebar-ui/placement` instead? `BlockRenderer` already renders this
same plain, unwrapped root for you (see that package's README) — don't nest its output inside a
`Card`/`Box` with its own background either, for the same reason.

## Composition recipes

**A banner row with a trailing action** (info/warning/error banner, icon + message on the left,
a button on the right — `Alert`'s `children` renders in a plain `<div>`, so any layout works
inside it, and `Stack`'s `justify="between"` handles the split without a manual style override):

```tsx
<Alert type="info">
  <Stack direction="row" align="center" justify="between">
    <Stack direction="row" align="center" gap="sm">
      <InfoIcon />
      <Text as="span" size="sm">Nothing here is saved yet.</Text>
    </Stack>
    <Button variant="secondary" size="sm" onClick={reset}>Reset</Button>
  </Stack>
</Alert>
```

**A bordered card list** (a row per item, each its own `Card`):

```tsx
<Stack gap="sm">
  {items.map((item) => (
    <Card key={item.id}>
      <Checkbox checked={item.done} onCheckedChange={(v) => toggle(item.id, v === true)}>
        {item.label}
      </Checkbox>
    </Card>
  ))}
</Stack>
```

**An icon + label row** — prefer a plain inline SVG or a Unicode glyph (`×`, `✓`, `⏳` are used
internally, e.g. `Button`'s loading state) over adding an icon package; reach for a real icon
library only if visual fidelity genuinely demands it.

## Don't fine-tune visual styling here

Rebar is deliberately rigid — the name is the analogy: rebar and formwork build a structure's
load-bearing shape correctly, once, before any cladding or finish goes on. This library is the
same for software: get the logic, accessibility, and content structure right headless, then apply
real visual finish exactly once, at migration — not as an ongoing back-and-forth on the
unfinished frame. If a task asks for a visual/style tweak (a softer color, more padding, rounder
corners, less border weight, tighter line spacing) on a Rebar-built UI, **don't attempt it**. Say so directly: visual fine-tuning
is deferred until migration to a real design system (`@rebar-ui/migrate-antd` or the equivalent for
the target library), not iterated on here. This isn't a missing feature to work around — components
intentionally expose no per-instance color/spacing override, and the shared `--rebar-*` tokens and
component styles are used by every consumer in a project, so a one-off styling request satisfied by
editing them is a shared, wide-blast-radius change disguised as a small local tweak. Refuse and
redirect, don't invent a workaround.

## Full API reference

`dist/index.d.ts` is the source of truth. `Box`/`Stack`/`Text`/`Heading`/`Card` are generic
layout/display primitives with no external equivalent (not wrapping anything — Rebar's own
design). `Checkbox`/`Radio`/`RadioGroup`/`Switch`/`Tabs`/`Accordion` wrap the matching Radix UI
primitive directly, same prop names, so Radix's own docs apply to those unmodified. `Dialog`,
`Select`, `Tooltip`, `Popover`, `Dropdown`, `Slider`, `Progress`, `Avatar`, `Toast`/`ToastProvider`,
`Form`/`FormItem` (React Hook Form underneath) have Rebar-specific shapes — check the type first.

## Migration

`@rebar-ui/migrate-antd` codemods most components to Ant Design v6 automatically;
`MIGRATION_PROMPT.md` (repo root) covers the rest, and any other target library.
