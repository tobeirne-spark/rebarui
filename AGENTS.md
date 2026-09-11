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

**Never wrap a whole page/screen in `Card`.** The page background is already correct once
`rebar-ui/style.css` is imported — a bare page needs no wrapping container at all. `Card` is for
one bounded piece of content, not the page itself; wrapping everything in one produces a page
that looks like a single giant grey/boxed rectangle. See README.md's "The page background is
already handled" section.

**Default a new build to `@rebar-ui/theme-clean` + `data-rebar-theme="clean"`, light mode (no
`data-theme="dark"`).** That's the recommended starting point — regular IBM Plex Sans font, not
the hand-drawn `theme-sketch` look. Only reach for `theme-sketch` when that aesthetic is
specifically requested.
