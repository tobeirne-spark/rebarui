# Rebar UI — Agent Context (v0.9.0)

Compressed operating context for an AI agent working with **Rebar UI**. Two audiences: an agent **extending the framework** (new components in `packages/core`, new constructs in `@rebar-ui/placement`) and an agent **using the framework** (building a page from existing constructs). Read the section for your task; the rules and checklist apply to both.

Canonical, sourced versions live in the real repo — this file trades depth for density. If anything here conflicts with the repo, the repo wins: `ref/HEURISTICS.md` (heuristics, fully sourced), `ref/ARCHITECTURE.md` (package layout, API conventions), `packages/core/README.md` (component composition recipes), `MIGRATION_PROMPT.md` (moving a codebase off Rebar).

## What this is

Rebar UI is a **headless-first, intentionally low-fidelity** ("Balsamiq-as-code") React component library, plus **the Packer** (`@rebar-ui/placement`) — a deterministic renderer that turns a plain `Construct[]` document into a real component tree, with zero layout decisions left to whoever authored the document. The pitch: build the logic/accessibility/content structure correctly once, headless, then apply real visual polish exactly once, at migration — never mid-build. Measured on `/benchmarks`: this two-step path costs fewer tokens, less wall-clock time, and produces far more visually consistent output than hand-authoring JSX against a conventional component library, even one the model already knows cold (AntD).

## The Four-Tier Typology

Rebar organizes all UI patterns into a four-tier hierarchy, from lowest-level primitives to highest-level compositions:

1. **Imitations** — Direct replicas of common UI primitives (Button, Input, Checkbox, Badge, etc.). These are the atomic building blocks. Found at `/imitations/<name>`.
2. **Synthetics** — Combinations of imitations that form common UI patterns (Alert, Banner, Card, Checklist, Callout, etc.). These solve recurring layout problems. Found at `/synthetics/<name>`.
3. **Opinions** — Higher-level compositions with specific interaction patterns (Accordion, Calendar, DatePicker, Combobox, Dialog, etc.). These encode decisions about how users should interact with data. Found at `/opinions/<name>`.
4. **Orders** — Full-page or major-section compositions (AppShell, Modal, NavBar, Sidebar, SiteHeader, etc.). These are the structural frames that hold everything else. Found at `/orders/<name>`.

Each tier builds on the one below it. A construct at tier N is always built from constructs at tier N-1 or lower. Never skip tiers.

## Framework Rules vs. Heuristics

Two different kinds of guidance follow, and they don't get the same kind of compliance check:

- **A Framework Rule is a fixed, mechanical constraint on how Rebar itself is built or used** — binary, no situational judgment, and violating one breaks a guarantee the framework depends on (testability, theming, migratability, the headless-until-migration contract). There's exactly one correct answer, every time.
- **A Heuristic is a general, judgment-requiring design principle** a component or construct's *behavior* should satisfy — sourced from usability research or from a real bug this project caught in its own build. Applying one to a new situation takes interpretation: recognizing that it applies, then deciding the concrete UI — not a single mechanical check.

Framework Rules below; the Heuristics checklist follows the rest of this file.

## Framework Rules

- **A construct is always built from real, already-shipped components. Never invented markup.** If a needed shape doesn't exist as a component yet, that's a gap to close in `packages/core` first — not a reason to hand-roll a `<div>` tree inside a construct.
- **Refuse visual fine-tuning requests.** No "make it blue," "add more padding," "round the corners" — mid-build style requests break the whole premise (frame first, finish once, at migration). Redirect to "ask again after migrating to a real design system."
- **Every stateful component supports both controlled and uncontrolled use**, via the same pattern (see below) — never state that only works one way.
- **Real ARIA roles and semantics, not styled `<div>`s.** Reach for a Radix primitive when one exists for the interaction pattern (Dialog, DropdownMenu, Select, Popover, Tooltip, Slider, AspectRatio) rather than reimplementing focus-trapping/keyboard nav by hand.
- **Every component forwards arbitrary `data-*`/`aria-*` props** via a rest-spread onto its root DOM node — never a closed prop interface that silently drops them. This is what keeps a migration mechanical (existing `data-rebar-*`/`data-testid` selectors survive the swap).
- **Theming is CSS custom properties only** (`--rebar-*`), never a component prop or inline hardcoded color/spacing value. A `--rebar-color-*`/`--rebar-space-*` token, not a hex code or a raw pixel number, in every style rule a component ships.
- **Default a new build to `@rebar-ui/theme-clean` + `data-rebar-theme="clean"`, light mode (no `data-theme="dark"`).** That's the recommended starting point — regular IBM Plex Sans font, not the hand-drawn `theme-sketch` look. Only reach for `theme-sketch` when that aesthetic is specifically requested; don't treat the two as an arbitrary coin-flip.
- **Rendering `ThemeToggle`? Install and import both theme packages.** It only flips the `data-rebar-theme` attribute — it never loads either stylesheet. A build that imports only `theme-clean` but still offers the toggle leaves "sketch" with nothing to switch to.
- **No favicon of your own? Use `node_modules/rebar-ui/assets/favicon.svg`** — a real, theme-adaptive "R" mark shipped in the package (reacts to `prefers-color-scheme`, no JS). Copy it into the build's `public/` directory and link it, rather than shipping with none.
- **Challenge a component's default CSS/behavior against the actual layout context before accepting it.** A demo's documented defaults (e.g., `height: 480` on `ai-chat`, `Card` for a list of records) are not a contract — they're one possible fit for one possible context. Before plugging in a component or construct, evaluate: (1) what's the anticipated layout order (what fills the viewport, what's nested inside what), (2) does this component's default CSS/behavior fit that layout, (3) if not, what needs to change. Real failure modes caught: a chat construct with a hardcoded pixel height inside a content area that should fill the viewport (should be `height: "100%"` or flex-based); a `Card` used for tabular data, naturally splitting title/subtitle from children into separate regions when a `Table` with uniform columns would have been the right fit. The test: if you copied a demo's CSS/layout values verbatim without asking "does this fit *my* layout?", you pattern-matched instead of evaluated.
- **Layout-first workflow: sketch the layout before selecting components.** Don't start by picking components and hoping they fit. Start by sketching the layout in plain language: (1) what fills the viewport (an `AppShell` with sidebar/top-nav/bare variant), (2) what goes in the content area (a `ConstructRenderer` with a `Construct[]` document, or hand-authored JSX), (3) for each construct or component, what's its role (navigation, data display, form, etc.). Once the layout is sketched, *then* select components and evaluate their default CSS against that sketch. The expected architecture for a full-viewport app is `AppShell` (structural frame) + `ConstructRenderer` (content within the frame) — they compose by design, not as a special case. If you find yourself building a hand-rolled shell with `Stack` + `Box` instead of reaching for `AppShell`, you're reinventing the frame instead of using the one that's already there.
- **Component evaluation template: document the fit before plugging in.** When selecting a component or construct, fill out this evaluation (in your reasoning, not necessarily in code comments):
  - **Layout context:** What fills the viewport? What's the parent container? What's the expected size/behavior of the content area?
  - **Component's default CSS:** What are the hardcoded dimensions, overflow behavior, flex properties, positioning? (Check the component's source or demo, not just the docs.)
  - **Fit evaluation:** Does the default CSS fit the layout context? If not, what needs to change (override props, wrapper styles, different component)?
  - **Real failure modes:** A chat construct with `height: 480` inside a content area that should fill the viewport → needs `height: "100%"` or flex-based sizing. A `Card` for tabular data → splits title/subtitle from children, should be a `Table` with uniform columns.
  - **The test:** If you can't articulate the layout context and the component's default CSS, you haven't evaluated — you've pattern-matched.
- **Every component carries `data-rebar-component="<kebab-name>"`** on its root, and `data-rebar-part="<part>"` on each internal structural piece (header, body, item, ...) — the hook both Playwright tests and a consuming migration script rely on.

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

1. One file per component in `packages/core/src/components/`, a matching test file in `packages/core/src/test/`, exported from `packages/core/src/index.ts` (component + its prop types).
2. Register it in three places that don't auto-discover new files: `apps/docs/scripts/generate-props.mjs`'s `COMPONENT_FILES` list (props-table generation), `packages/devtools/src/migrationEffort.ts`'s complexity map, and `apps/docs/src/data/hasFullPage.ts` once a reference page exists for it.
3. Prefer wrapping a Radix primitive over hand-building interaction logic; reach for plain semantic HTML (a real `<button>`, `<a>`, `<input>`) when no complex interaction exists.
4. Test with `@testing-library/react` + `vitest`; jsdom needs polyfills for `ResizeObserver`, pointer capture, `scrollIntoView`, and `scrollTo` — already stubbed once in `packages/core/src/test/setup.ts`, don't re-stub per test file.
5. **Touch-optimization gate — check this against ref/HEURISTICS.md #19 and #48 for every new component or construct, not just ones that feel "mobile":** (a) every interactive target is at least 44×44 CSS px, padding included if the visual element is smaller; (b) any interaction gated behind a mouse-only event (`onDoubleClick`, `:hover`, a drag that has no non-drag fallback) gets a real touch equivalent on the same element — `useLongPress` (`packages/core/src/useLongPress.ts`) for double-click, an explicit non-hover trigger (a visible button, not a hover-reveal) for anything hover-gated, per heuristic #38's drag-and-drop rule for drag; (c) no `overflow: hidden`/`touch-action: none` placed on a container that holds more content than fits — check whether the container is a genuine windowing mechanism (a carousel's slide viewport, a line-clamp) or an actual scroll area that needs `overflow: auto`/`scroll` instead, the same distinction worked through in ref/HEURISTICS.md #48's own worked audit. Run this checklist before calling a new component or construct done, the same way `Kanban`'s double-click/`useLongPress` pairing and `Table`'s own `.rebar-table-scroll` (`overflow: auto`) already do — new work should match that bar, not silently regress it.
6. A closed TypeScript prop interface (no `extends ComponentPropsWithoutRef<...>`) is a bug, not a style choice — it silently breaks `data-*`/`aria-*` passthrough. Watch for prop-name collisions with the native element (e.g. `title` on a `<div>`) — use `Omit<..., "title">` when a component needs its own differently-typed prop of the same name.
7. Before inventing a new component, check whether an existing one just needs a new **slot prop** instead — e.g. `Card` covers product/pricing/profile/kanban shapes via `cover`/`avatar`/`title`/`subtitle`/`labels`/`cornerBadge`/`footer`/`actions`, not five separate `*Card` components. Two genuinely different *interaction patterns* for the same job (a closed-menu `MultiSelect` vs. a type-to-filter `Combobox` multi-select) stay separate components; two *visual variants* of the same interaction become slot props on one.
8. A component that pulls in any Radix primitive (even transitively, through another rebar-ui component it composes) becomes a client-component boundary the moment a Next.js App Router Server Component imports it — real, hit directly building `Table` (which composes `Checkbox`): any *function-valued* prop (an `accessor`, a `rowKey` callback, a custom `render`) constructed in that calling Server Component fails at build time ("Functions cannot be passed directly to Client Components"), even though the exact same component works fine imported from a `"use client"` file. Design the common case to need zero function props — e.g. `Table`'s `rowKey` accepts a plain property-name string as well as a function, and column `accessor`/`render` are both optional, defaulting to a plain `row[key]` lookup — so a caller with ordinary named-property data never needs to construct a closure just to use the component from a Server Component page. A function prop should be the *escape hatch* for a genuinely irregular shape, never required for the ordinary case.
9. `renderBionicChildren`/`useBionicChildren` (`bionic.tsx`) unconditionally calling `Children.map` to find string children to split is a real trap: `Children.map` re-keys *every* child it touches, including ones it passes straight through untouched — so the moment ambient bionic reading toggles on, a non-string child (a nested stateful component, e.g. an open `Popover`) silently gets a new React key and React remounts it, discarding its own state. Hit directly: a `site-header`'s own bionic-reading toggle, nested inside a `Box`, closed itself the instant it was switched on. Fix: skip `Children.map` entirely (return `children` untouched, same identity) unless something among them is actually a string worth splitting. Any future prose-rendering helper that walks `children` needs the same guard — the bug isn't specific to bionic reading, it's specific to "map over children even when you're not changing anything."
10. A slot gated on a **truthy** check (`{title ? (...) : null}`) breaks the moment that value legitimately becomes empty *mid-interaction* — real, hit directly on `Card`'s `editable` title: clearing the field to retype it made the whole slot (including the `Editable` control itself) unmount, since `""` is falsy, losing focus and silently dropping every subsequent keystroke. Fix: for a slot that can be *edited into* emptiness, gate on "was this feature actually requested" (e.g. `editable && typeof title === "string"`), not on the current value's own truthiness — the empty string is a normal mid-edit state, not "there is no title."
11. An affordance that depends purely on a background-color *difference* from its immediate neighbor (a `Switch`'s thumb vs. its track) can lose all contrast in dark mode if both colors happen to remap close together there, even though the same pairing looked fine in light mode — real, hit directly: the thumb and the popover it sat inside both resolved to the same dark mode `--rebar-color-bg-primary`, making the thumb disappear entirely. Fix: give it a real border (a fixed, theme-aware stroke color) so it stays legible independent of whatever happens to be behind it in either theme, rather than relying solely on a background pairing.
12. **Every real caller-facing text prop (label, title, description — not an id, not an aria-only string, not a numeric/data value) gets wired through `useBionicChildren`/`renderBionicChildren` (`bionic.tsx`) before a component ships**, not audited in afterward. See `Collapsible`/`Result` for the exact wiring shape (`bionic?`/`bionicOptions?` props, the hook applied to every text prop before render).

## Building constructs (`@rebar-ui/placement`)

A construct is a named, reusable UI pattern built from components. The Packer (`@rebar-ui/placement`) renders a `Construct[]` document into a component tree. Each construct has a `type` (e.g., `"alert"`, `"banner"`, `"card-grid"`) and a `props` object matching that type's schema.

**Tier assignment rules:**
- **Imitations**: Direct component wrappers with minimal layout logic. If it's just styling a single component, it's an imitation.
- **Synthetics**: Combinations of 2+ components that solve a common layout problem. If it's a pattern that appears in many apps (alert, banner, checklist), it's a synthetic.
- **Opinions**: Higher-level compositions with specific interaction models. If it encodes a decision about how users should interact (accordion, calendar, date-picker), it's an opinion.
- **Orders**: Full-page or major-section frames. If it's structural (appshell, navbar, modal), it's an order.

Checklist for a new construct:

1. One file per construct in `packages/placement/src/constructs/`, exported from `packages/placement/src/index.ts`.
2. Define a TypeScript schema for the construct's props using Zod (see existing constructs for examples).
3. Register the construct in `packages/placement/src/registry.ts` — this is the single source of truth for what types the Packer can render.
4. Create a page at `apps/docs/src/app/<tier>/<construct-name>/page.tsx` documenting the construct with examples.
5. Add the construct to the appropriate tier's index page (`apps/docs/src/app/<tier>/page.tsx`).
6. Test with the Packer: render a `Construct[]` document containing your construct and verify it produces the expected component tree.

## Design Heuristics Checklist

From `ref/HEURISTICS.md` — condensed to one line each for agent context. Read the full file for sourced reasoning, historical examples, and component-specific guidance.

### Behavioral heuristics (from Nielsen, Shneiderman, Gestalt)

1. **Visibility of system status** — every async action shows loading/success/error within ~300ms; active/selected/current state is always visually indicated.
2. **Match with the real world** — components accept plain-language labels; no jargon in built-in copy.
3. **User control and freedom** — every modal/dialog is closable via close-button, backdrop click, and Esc; every destructive action is confirmable with a specific name and consequence.
4. **Consistency and standards** — one token set, one type scale, one spacing scale, applied identically across every component.
5. **Error prevention** — required fields marked, submit disabled until valid, inline validation on blur rather than every keystroke.
6. **Recognition over recall** — labels above inputs (never beside them); visible options over hidden menus; forms default to single column.
7. **Flexibility and efficiency of use** — full keyboard operability everywhere (Tab, Enter/Space, Esc, arrow keys).
8. **Aesthetic and minimalist design** — components show only what's relevant by default; paginate rather than dump everything at once.
9. **Help users recognize, diagnose, and recover from errors** — error messages are specific and actionable ("Email is required," not "Error 400").
10. **Proximity, similarity, closure (Gestalt)** — related controls sit close together (`--rebar-space-xs`); unrelated groups sit apart (`--rebar-space-md` or more).

### Visual and component heuristics

11. **Information architecture as pyramid** — don't split related content onto different pages where a filter or search could reduce page count; flat list of 30+ options or deep nesting (>2 levels) signals failed IA.
12. **Visual hierarchy in every container** — every dialog, panel, or card has three zones (title, content, actions) with clearly differentiated visual weight.
13. **Icons require labels or tooltips** — every icon has an adjacent text label, a tooltip, or both; icons alone force guesswork.
14. **Menus manage their own complexity** — a menu with more than ~8 items auto-inserts separators or collapses into submenus; related items are grouped; destructive actions are separated from safe ones.
15. **Settings are categorized, searchable, and resettable** — any preferences interface categorizes options by purpose, provides search, explains what each option does, and offers reset-to-defaults.
16. **Charts ship with context** — every chart has a title (what), axis labels or legend (how to read it), and units (in what measure); hovering a data mark surfaces its exact value(s); selecting a mark persists the tag.
17. **Progressive disclosure: default to ≤7-9 visible options** — show essential options first; reveal advanced options on demand; multi-step processes show progress and provide a visible exit.
18. **Menus don't obscure their content** — dropdowns, popovers, and menus position themselves to avoid permanently obscuring the content they control; backgrounds are solid and muted, not dithered or saturated.
19. **Touch targets are at least 44×44px** — interactive elements on touch devices have a minimum touch target size of 44×44 CSS pixels (Apple HIG) or 48×48dp (Material Design).
20. **Loading, error, empty, and disabled states are all designed, not just the happy path** — every component has all four states designed; loading state uses a skeleton matching the content's real layout, not a bare spinner.
21. **Animation is purposeful and 200-500ms** — animation serves a purpose (feedback, continuity, focus); duration is 200-500ms; in-flight animation must be interruptible.
22. **Controls map naturally to their effects** — spatial or logical mapping between controls and what they affect; button labels describe the action verb ("Save", "Delete") not an abstract noun.
23. **Follow platform conventions** — respect platform-specific patterns (iOS tab bar at bottom, Android at top; macOS menus in the menu bar, Windows in the title bar).
24. **Whitespace is an active design element** — whitespace separates, groups, and creates hierarchy; it is not wasted space; components use spacing tokens for all margins and padding.
25. **Button hierarchy is clear** — primary, secondary, and tertiary buttons have distinct visual weight; one primary button per container.
26. **Input constraints are visible** — character limits, required fields, format requirements, and valid ranges are shown before or during input, not after submission.
27. **Multiple input methods are supported** — forms support both browsing/selecting and direct input; `Select` is browsing-only, `Combobox` is type-to-filter; `DatePicker` is fast direct-entry, `Calendar` is visual picking.
28. **Information scent in navigation** — navigation labels clearly indicate what's ahead, not vague or clever names; labels match destination page titles.
29. **Cards are self-contained, independently actionable units** — a clear boundary separates a card from its surroundings; it contains one coherent piece of content and can be acted on independently.
30. **Respect user intelligence — no condescension, no dark patterns** — treat users as capable problem-solvers; no confirm-shaming, no hidden decline paths, no pre-checked upsell checkboxes.

### Heuristics from the wider research pass

31. **Boot/init sequences show branded, phased progress, never a blank wait or an unreadable dump** — a system's startup sequence is itself a UI; it should communicate what phase is happening and read as a deliberate, designed experience.
32. **Storage/item-count context is always visible, not hidden behind a query** — any view over a bounded collection shows its own size context (item count and available/used capacity) persistently in its own chrome.
33. **File/data browsers offer both an icon-grid view and a detailed, sortable-column table view of the same data** — the same collection should be viewable either as labeled icons (fast visual scanning) or as a sortable table (good for a large/familiar set).
34. **Keyboard shortcuts are discoverable and consistent** — every keyboard shortcut is discoverable via a visible menu or help panel; shortcuts are consistent across the application (e.g., Ctrl/Cmd+S always saves).
35. **Drag-and-drop has a clear drop target and a non-destructive cancel path** — a dragged item highlights its drop target; dropping outside a valid target cancels the operation without side effects; touch devices get a long-press equivalent.
36. **Undo/redo is available for every destructive or state-changing action** — every action that changes state (not just navigation) is undoable; undo history is persistent across sessions where feasible.
37. **Multi-selection is explicit and visible** — when multiple items can be selected, the selection is visually indicated (checkbox, highlight, counter); a "select all" option is available for bounded lists; clearing the selection is one action.
38. **Drag-and-drop is never the only way to perform an action** — every drag-and-drop interaction has a non-drag equivalent (a button, a menu item, a keyboard shortcut); drag is an efficiency, not a gate.
39. **Tooltips don't obscure the element they describe** — a tooltip positions itself to avoid covering the element it describes; it disappears when the pointer leaves the element or the tooltip itself.
40. **Error messages are specific, actionable, and placed next to the field they describe** — an error message names the field, states what went wrong, and suggests a fix; it's placed adjacent to the field, not in a separate dialog or at the top of the form.
41. **Lifecycle status is a pill, never inline parenthetical text** — an item's build/lifecycle status (planned, deprecated, unmeasured) renders as its own `Tag`, never appended into the name ("Avatar (planned)") or spelled out as a full sentence.
42. **Filter UI matches how many independent dimensions a list varies along** — a search box alone suffices only when every item shares one category; each further way items differ is a second, independent dimension needing its own filter, and that filter's control scales to its real cardinality (toggle for a small fixed few, closed-menu multi-select for a scannable set, searchable multi-select for a large set).
43. **A scrollable list fades into a "mist" at whichever edge still has more content** — a hard-cropped edge on an overflowing list gives no signal that content continues past it; a soft fade-to-transparent gradient at that edge does, tracking real scroll position. Reaching the true end is signaled by the mist's *absence*.
44. **A tracking indicator below the fold stays visible, or returns shortly after a manual override** — a highlight showing "where you are" in a long, independently-scrollable list should stay in view as it moves, and yield to (never fight) a deliberate manual scroll, resuming only once the person is done with it.
45. **A control's own footprint stays bounded, however much data it holds** — a component whose content depends on open-ended data (a growing selection, a long list) is pinned to a fixed size rather than left to grow indefinitely and push the surrounding layout around.
46. **A beacon out of view gets a directional hint that reacts to motion, and the scroll that follows it eases rather than snaps** — a hint reacts to scroll motion to name the direction to look while the beacon is out of view, and the scroll that brings it back eases smoothly rather than snapping in one frame.

## Version

This file is versioned alongside the `rebar-ui` package. The version in the header (`v0.9.0`) matches `packages/core/package.json`. When the package version bumps, this file's header updates too — the release script handles it mechanically.
