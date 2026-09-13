# Rebar UI — Agent Context (v0.9.0)

Compressed operating context for an AI agent working with **Rebar UI**. Two audiences share this
file: an agent **extending the framework** (new components in `packages/core`, new constructs in
`@rebar-ui/placement`) and an agent **using the framework** (building a page from existing constructs).
Read the section for your task; the rules and checklist apply to both.

Canonical, sourced versions of everything summarized here live in the real repo — this file trades
that depth for density. If anything here conflicts with the repo, the repo wins:
`ref/HEURISTICS.md` (heuristics, fully sourced), `ref/ARCHITECTURE.md` (package layout, API
conventions), `packages/core/README.md` (component composition recipes), `MIGRATION_PROMPT.md`
(moving a codebase off Rebar).

## What this is

Rebar UI is a **headless-first, intentionally low-fidelity** ("Balsamiq-as-code") React component
library, plus **the Packer** (`@rebar-ui/placement`) — a deterministic renderer that turns a plain
`Construct[]` document into a real component tree, with zero layout decisions left to whoever authored
the document. The pitch: build the logic/accessibility/content structure correctly once, headless,
then apply real visual polish exactly once, at migration — never mid-build. Measured on
`/benchmarks`: this two-step path costs fewer tokens, less wall-clock time, and produces far more
visually consistent output than hand-authoring JSX against a conventional component library, even
one the model already knows cold (AntD).

## The Four-Tier Typology

Every construct in `@rebar-ui/placement` belongs to one of four tiers, based on what it *does* in
the document:

- **Imitations** — atomic primitives that mimic a single HTML element or React primitive (e.g.,
  `TextImitation`, `ButtonImitation`). No internal state, no composition logic.
- **Synthetics** — combinations of multiple imitations that form a reusable pattern (e.g.,
  `SearchSynthetic` = input + button + icon). May have local state, but no cross-construct
  dependencies.
- **Opinions** — interaction patterns that enforce a specific workflow or state management approach
  (e.g., `FormOpinion` = form + validation + submission logic). Dictates *how* the user interacts.
- **Orders** — structural frames that organize other constructs spatially or hierarchically (e.g.,
  `GridOrder`, `SidebarOrder`). No behavior of their own; purely layout.

The tier determines the construct's complexity, testability requirements, and migration path. See
`LLM.MD` for the full typology with examples.

## Framework Rules vs. Heuristics

Two different kinds of guidance follow, and they don't get the same kind of compliance check:

- **A Framework Rule is a fixed, mechanical constraint on how Rebar itself is built or used** —
  binary, no situational judgment, and violating one breaks a guarantee the framework depends on
  (testability, theming, migratability, the headless-until-migration contract). There's exactly
  one correct answer, every time.
- **A Heuristic is a general, judgment-requiring design principle** a component or construct's
  *behavior* should satisfy — sourced from usability research or from a real bug this project
  caught in its own build. Applying one to a new situation takes interpretation: recognizing that
  it applies, then deciding the concrete UI — not a single mechanical check.

Framework Rules below; the Heuristics checklist follows the rest of this file.

## Framework Rules

- **A construct is always built from real, already-shipped components. Never invented markup.** If a
  needed shape doesn't exist as a component yet, that's a gap to close in `packages/core` first —
  not a reason to hand-roll a `<div>` tree inside a construct.
- **Refuse visual fine-tuning requests.** No "make it blue," "add more padding," "round the
  corners" — mid-build style requests break the whole premise (frame first, finish once, at
  migration). Redirect to "ask again after migrating to a real design system."
- **Every stateful component supports both controlled and uncontrolled use**, via the same
  pattern (see below) — never state that only works one way.
- **Real ARIA roles and semantics, not styled `<div>`s.** Reach for a Radix primitive when one
  exists before building from scratch.
- **CSS custom properties only for theming.** No hardcoded colors, spacing, or typography values
  in component styles. Everything flows through `--rebar-*` tokens.
- **No `any` types in component APIs.** Every prop must be explicitly typed. If you can't type it,
  the API shape is wrong.
- **Every component ships with a minimal, headless default style.** No visual polish — just enough
  to be usable and testable. Migration adds the real design system.
- **Every construct in `@rebar-ui/placement` is classified into one of the four tiers** (Imitation,
  Synthetic, Opinion, Order). The tier determines its complexity, testability requirements, and
  migration path.
- **Every construct's `type` field is a stable, unique string.** No renaming, no reusing, no
  versioning. If the construct's shape changes, it's a new construct with a new `type`.
- **The Packer (`ConstructRenderer`) is the only thing that turns a `Construct[]` into a component
  tree.** No hand-rolled JSX that bypasses the Packer. If the Packer can't render it, the construct
  doesn't exist yet.
- **Every component must be testable in isolation.** No implicit dependencies on global state,
  context, or parent components. If it needs context, it's a construct, not a component.
- **Every construct must be serializable to JSON.** No functions, no class instances, no React
  elements in the `Construct[]` document. Everything must be plain data.
- **Every component's API must follow the controlled/uncontrolled pattern** (see below). No
  exceptions.

## Controlled/Uncontrolled Pattern

Every stateful component supports both modes via the same API shape:

```typescript
interface ComponentProps {
  // Controlled mode: value + onChange
  value?: T;
  onChange?: (value: T) => void;
  
  // Uncontrolled mode: defaultValue
  defaultValue?: T;
  
  // Other props...
}
```

Internal logic: if `value` is provided, the component is controlled (external state). If only
`defaultValue` is provided, the component manages its own state internally. Never both. Never
neither (for stateful components).

## The Construct Catalog (39 types)

Every construct in `@rebar-ui/placement` falls into one of four tiers. The full list:

### Imitations (13)
Atomic primitives that mimic a single HTML element or React primitive:
- `TextImitation` — paragraph, heading, label, span
- `ButtonImitation` — button, link button, icon button
- `InputImitation` — text input, number input, password input
- `CheckboxImitation` — single checkbox
- `RadioImitation` — single radio button
- `SelectImitation` — dropdown select
- `TextareaImitation` — multi-line text input
- `LinkImitation` — anchor link
- `ImageImitation` — image with alt text
- `IconImitation` — icon (SVG or icon font)
- `DividerImitation` — horizontal rule
- `SpacerImitation` — vertical/horizontal spacing
- `ContainerImitation` — generic container (div, section, article)

### Synthetics (14)
Combinations of multiple imitations that form a reusable pattern:
- `SearchSynthetic` — input + button + icon
- `FormFieldSynthetic` — label + input + error message + help text
- `CardSynthetic` — container + heading + body + footer
- `ModalSynthetic` — overlay + container + header + body + footer + close button
- `TabsSynthetic` — tab list + tab panels
- `AccordionSynthetic` — collapsible sections
- `BreadcrumbSynthetic` — navigation breadcrumb trail
- `PaginationSynthetic` — page navigation controls
- `TableSynthetic` — table with header, body, rows, cells
- `ListSynthetic` — ordered/unordered list with items
- `TagSynthetic` — label + remove button
- `AvatarSynthetic` — image + fallback + status indicator
- `BadgeSynthetic` — label + count/status
- `ProgressSynthetic` — progress bar + label

### Opinions (7)
Interaction patterns that enforce a specific workflow or state management approach:
- `FormOpinion` — form + validation + submission logic
- `DataTableOpinion` — table + sorting + filtering + pagination
- `WizardOpinion` — multi-step form with navigation
- `FilterOpinion` — filter controls + applied filters display
- `SortOpinion` — sort controls + sort state display
- `BulkActionOpinion` — selection + bulk action controls
- `InlineEditOpinion` — click-to-edit with save/cancel

### Orders (5)
Structural frames that organize other constructs spatially or hierarchically:
- `GridOrder` — CSS grid layout
- `FlexOrder` — flexbox layout
- `SidebarOrder` — sidebar + main content layout
- `StackOrder` — vertical/horizontal stack
- `ClusterOrder` — wrapping horizontal layout

## The Packer (`@rebar-ui/placement`)

The Packer is a deterministic renderer that turns a `Construct[]` document into a real component
tree. It has three jobs:

1. **Map each construct's `type` to a React component** (the `ConstructRenderer` registry).
2. **Pass the construct's `props` to that component** (no transformation, no defaults).
3. **Render the construct's `children` recursively** (if any).

The Packer has no layout logic, no styling, no opinions about spacing or typography. It's a pure
function: `Construct[] → ReactElement[]`. Everything else is the construct's responsibility.

### Packer Rules

- **The Packer never invents markup.** If a construct needs a wrapper `<div>`, the construct's
  renderer adds it — not the Packer.
- **The Packer never applies styles.** All styling flows through the component's default styles or
  the migration's design system.
- **The Packer never modifies props.** What's in the `Construct[]` is what the component gets.
- **The Packer never adds behavior.** All interaction logic lives in the component, not the Packer.
- **The Packer is framework-agnostic.** It works with React today, but the `Construct[]` document
  format is framework-independent. A Vue or Svelte Packer could render the same document.

## AppShell and Page Structure

Every Rebar app has a single `AppShell` component that provides:
- **Routing** (React Router or similar)
- **Global layout** (sidebar, header, main content area)
- **Theme provider** (CSS custom properties)
- **Error boundary** (catches rendering errors)

Pages are just `Construct[]` documents. The `AppShell` renders the page's constructs via the Packer.
No page-specific logic in the `AppShell`; no global layout in the page.

## Migration Path

Migration is the **one time** visual polish is applied. It's a separate phase, not mid-build
tweaks. The migration prompt (`MIGRATION_PROMPT.md`) walks through:
1. **Replacing headless defaults with a real design system** (AntD, MUI, shadcn/ui, or custom).
2. **Mapping Rebar components to design system components** (or keeping Rebar's if the design system
   doesn't have a match).
3. **Applying real styles** (colors, spacing, typography, shadows, etc.).
4. **Testing the migrated app** (visual regression, accessibility, interaction).

Migration is **irreversible** — once you've applied a design system, you can't go back to headless.
That's the point: the two-step path (frame first, finish once) is cheaper than iterative visual
tweaks.

## The 40-item Heuristics Checklist

Every component and construct should satisfy these 40 heuristics, sourced from usability research
and real bugs this project caught. They're grouped into three categories:

### Behavioral (1–10)
1. **Keyboard navigable** — all interactive elements reachable via keyboard.
2. **Focus visible** — focus state is clear and visible.
3. **Focus managed** — focus moves logically (e.g., modal traps focus).
4. **Escape closes** — Escape key closes modals, dropdowns, popovers.
5. **Enter submits** — Enter key submits forms (unless multi-line input).
6. **Arrow keys navigate** — arrow keys move within lists, menus, tabs.
7. **Home/End jump** — Home/End jump to start/end of lists, inputs.
8. **Tab order logical** — tab order matches visual order.
9. **No keyboard traps** — focus never gets stuck.
10. **Screen reader friendly** — ARIA labels, roles, states all correct.

### Visual (11–30)
11. **Contrast sufficient** — text meets WCAG AA (4.5:1 for normal text, 3:1 for large text).
12. **Color not sole indicator** — status, errors, required fields indicated by more than color.
13. **Text resizable** — text scales to 200% without breaking layout.
14. **Touch targets large** — interactive elements ≥44x44px on mobile.
15. **Spacing consistent** — spacing follows a consistent scale (e.g., 4px, 8px, 16px).
16. **Alignment clear** — elements align to a grid or baseline.
17. **Hierarchy visible** — heading levels, font sizes, weights show structure.
18. **Grouping logical** — related items grouped visually (proximity, borders, background).
19. **Feedback immediate** — user actions get immediate visual feedback.
20. **Loading indicated** — long operations show loading state.
21. **Errors clear** — error messages are specific, actionable, visible.
22. **Empty states helpful** — empty lists, tables, search results show helpful message.
23. **Overflow handled** — long text truncates or wraps; no horizontal scroll on mobile.
24. **Responsive** — layout adapts to screen size (mobile, tablet, desktop).
25. **Motion reduced** — respects `prefers-reduced-motion`.
26. **Dark mode ready** — all colors flow through CSS custom properties.
27. **Print friendly** — layout adapts for print (no nav, no interactive elements).
28. **Icons labeled** — icons have text labels or `aria-label`.
29. **Images have alt** — all images have `alt` text (or `alt=""` if decorative).
30. **Language declared** — `<html lang="...">` set correctly.

### Wider Research (31–40)
31. **Fitts's Law** — frequent targets large, close to cursor.
32. **Hick's Law** — too many choices overwhelm; group or limit options.
33. **Miller's Law** — chunk information into 7±2 items.
34. **Von Restorff** — distinct items stand out; use for important actions.
35. **Zeigarnik** — incomplete tasks stay in memory; show progress.
36. **Peak-End Rule** — users judge experiences by peak and end; make both good.
37. **Aesthetic-Usability** — users perceive attractive designs as more usable.
38. **Progressive Disclosure** — show only what's needed; hide advanced options.
39. **Poka-Yoke** — prevent errors (e.g., disable invalid actions).
40. **Conservation of Complexity** — don't simplify at the cost of power; expose complexity when needed.

## Shipped Component Catalog

`packages/core` ships these components (all headless, all follow the controlled/uncontrolled
pattern):

- **Button** — button, link button, icon button
- **Input** — text input, number input, password input
- **Checkbox** — single checkbox
- **Radio** — single radio button
- **Select** — dropdown select
- **Textarea** — multi-line text input
- **Link** — anchor link
- **Image** — image with alt text
- **Icon** — icon (SVG or icon font)
- **Divider** — horizontal rule
- **Spacer** — vertical/horizontal spacing
- **Container** — generic container (div, section, article)
- **Text** — paragraph, heading, label, span
- **Modal** — overlay + container + header + body + footer + close button
- **Tabs** — tab list + tab panels
- **Accordion** — collapsible sections

All components are tested with Playwright (interaction, accessibility, keyboard navigation) and
shipped with minimal headless styles.

## File Locations

- **Components**: `packages/core/src/components/`
- **Constructs**: `packages/placement/src/constructs/`
- **Packer**: `packages/placement/src/ConstructRenderer.tsx`
- **AppShell**: `apps/docs/src/AppShell.tsx`
- **Heuristics**: `ref/HEURISTICS.md`
- **Architecture**: `ref/ARCHITECTURE.md`
- **Migration**: `MIGRATION_PROMPT.md`
- **Typology**: `LLM.MD`
