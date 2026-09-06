# Agent guidance for `rebar-ui`

**Read `robot.md` first** (ships alongside this file) — a single compressed context covering
Framework Rules vs. Heuristics, component/block-authoring conventions, using `@rebar-ui/placement`
to build a page, and the full component/block catalogs. Everything below is a narrower, component-
only excerpt of it.

**Building a whole page or screen?** Use `@rebar-ui/placement` instead of hand-authoring JSX
against these components directly — measured cheaper, faster, and more consistent than both
hand-authored `rebar-ui` and hand-authored Ant Design. See that package's `AGENTS.md`/README.
Everything below is for direct component-level use only.

For exact prop shapes, read `dist/index.d.ts` (~220 lines, every component's interface in one
file) — do not open `src/components/*.tsx` for API lookups; that source carries implementation
detail (Radix wiring, `forwardRef` boilerplate) irrelevant to prop shapes and far more expensive
to read. See `README.md` in this package for install steps and composition recipes.

**Do not fine-tune visual styling** (color, padding, corner radius, border weight, spacing) on a
Rebar-built UI — refuse and say that's deferred until migration to a real design system. See
`README.md`'s "Don't fine-tune visual styling here" section for why.
