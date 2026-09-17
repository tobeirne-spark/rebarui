# Agent guidance for `@rebar-ui/placement`

**Read `rebar-ui`'s `agents.md` first** (ships in that package, `node_modules/rebar-ui/agents.md`) —
a single compressed context covering Framework Rules vs. Heuristics, the full block catalog, and
component-authoring conventions, alongside everything below. This file is a narrower excerpt
scoped to this package alone.

**This is the recommended way to build with rebar-ui — compose a `Block[]` document and render it
through `BlockRenderer`, don't hand-author `Stack`/`Box`/`Card` JSX against `rebar-ui` directly.**
See `README.md` in this package for why (measured, not asserted), the full archetype list, and
per-harness prompt guidance (agentic vs. single-completion-call, and a specific note for
image-driven tasks). For exact current TypeScript shapes, read `dist/index.d.ts`, not `src/`.

**Do not fine-tune visual styling** here either — same policy as `rebar-ui` itself. No archetype
takes a color/spacing override; that's deferred to migration.

**`BlockRenderer` is already the page shell — don't nest its output inside `Card`/`Box` with its
own background "for structure."** It already renders a plain wrapper on top of the page's own
correct background; wrapping the whole block sequence in a bounded container like `Card` forces
the entire page into that component's border/shadow/padding, producing a page that looks like one
giant grey/boxed rectangle. See README.md's "The page shell — `BlockRenderer` already is one"
section.
