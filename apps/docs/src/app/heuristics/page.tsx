import { Image, Stack } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const SECTIONS = [
  { id: "recognition", label: "1. Recognition over recall" },
  { id: "consistency", label: "2. Consistency and standards" },
  { id: "proximity", label: "3. Proximity and grouping" },
  { id: "control", label: "4. User control and freedom" },
  { id: "layers", label: "5. Clear layer separation" },
  { id: "nav-overflow", label: "6. Nav overflow" },
  { id: "minimalist", label: "7. Aesthetic and minimalist" },
  { id: "space-dense", label: "8. Space-dense content" },
  { id: "index", label: "9. Long-page navigation" },
  { id: "status-visible", label: "10. Visibility of system status" },
  { id: "ia-pyramid", label: "11. IA as pyramid" },
  { id: "visual-hierarchy", label: "12. Visual hierarchy" },
  { id: "icon-labels", label: "13. Icons need labels" },
  { id: "menu-complexity", label: "14. Menu complexity" },
  { id: "settings-organization", label: "15. Settings organization" },
  { id: "chart-context", label: "16. Chart context" },
  { id: "progressive-disclosure", label: "17. Progressive disclosure" },
  { id: "menu-content-separation", label: "18. Menu-content separation" },
  { id: "touch-targets", label: "19. Touch targets 44×44px" },
  { id: "all-states", label: "20. Design all states" },
  { id: "purposeful-animation", label: "21. Purposeful animation" },
  { id: "natural-mappings", label: "22. Natural mappings" },
  { id: "platform-conventions", label: "23. Platform conventions" },
  { id: "whitespace", label: "24. Whitespace as design element" },
  { id: "button-hierarchy", label: "25. Button hierarchy" },
  { id: "input-constraints", label: "26. Visible constraints" },
  { id: "multiple-input-methods", label: "27. Multiple input methods" },
  { id: "information-scent", label: "28. Information scent" },
  { id: "card-layouts", label: "29. Card layouts" },
  { id: "respect-intelligence", label: "30. Respect user intelligence" },
  { id: "boot-sequences", label: "31. Boot/init sequences" },
  { id: "storage-context", label: "32. Storage context always visible" },
  { id: "grid-and-table-views", label: "33. Icon-grid and table views" },
  { id: "undisambiguated-context", label: "34. Undisambiguated dialog context" },
  { id: "live-preview-commit", label: "35. Live preview, explicit commit" },
  { id: "ellipsis-convention", label: "36. Ellipsis for further-input items" },
  { id: "token-inputs", label: "37. Multi-value inputs as tokens" },
  { id: "drag-and-drop-fallback", label: "38. Drag-and-drop needs a fallback" },
  { id: "copyable-code", label: "39. Copyable code needs confirmation" },
  { id: "internationalization", label: "40. Internationalization (RTL, locale)" },
  { id: "status-pill", label: "41. Lifecycle status is a pill" },
  { id: "filter-dimensions", label: "42. Filter UI matches dimensions" },
  { id: "scroll-mist", label: "43. Scroll mist for overflowing lists" },
  { id: "beacon-point", label: "44. A beacon point stays visible" },
  { id: "bounded-footprint", label: "45. A control's footprint stays bounded" },
  { id: "beacon-pointer-easing", label: "46. Beacon pointer and eased scroll" },
];

const NAV_OVERFLOW_ITEMS = [
  { label: "Docs", href: "#" },
  { label: "Components", href: "#" },
  { label: "Blocks", href: "#" },
  { label: "Benchmarks", href: "#" },
  { label: "About", href: "#" },
];

// All 46 entries print via the `heuristic` block — see @rebar-ui/placement's schema.ts. Two of
// them needed a small schema addition elsewhere before they could print too, rather than staying
// hand-authored: entry 5's live demo (a Spin inside a Card) is now a generic `spin-card` block, and
// entry 6's live demo (a real, hand-resizable NavBar) is now `nav-bar`'s `resizable: true` — both
// added specifically to close these last two gaps, not one-off inline JSX.
const HEURISTIC_BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Design heuristics, applied by the DSL Packer",
    level: 1,
    body: [
      {
        kind: "text",
        text: "Every entry below is a *heuristic* — a general, judgment-requiring design principle, not a mechanical constraint. That's a deliberate distinction from a *Framework Rule* (a fixed, binary constraint on how Rebar itself is built or used — see [Agents.md](/about/agent)): a heuristic takes interpretation to apply to a new situation, where a Framework Rule has exactly one correct answer every time. These aren't just written guidance, though — they're what the *RebarUI DSL Packer* (`@rebar-ui/placement`'s `BlockRenderer`) actually does when it lays a screen out from a plain `Construct[]` document: given a list of named blocks and their content, it packs them onto the screen the way these heuristics say to, every time, without the author making a single layout decision. Each one below shows the real JSON fed in and the real component tree it produces — not a mockup of what it would do. For the complete list of blocks the Packer understands, independent of any one heuristic, see the [tier catalogs](/about/agent). This page groups heuristics by where they show up in the Packer's own output rather than by source — the numbered, sourced list in `ref/HEURISTICS.md` is the canonical one if the two ever seem to disagree on ordering.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "recognition",
    title: "1. Recognition over recall",
    rule: "Labels above inputs, visible options over hidden menus.",
    rationale: [
      {
        kind: "text",
        text: "From Nielsen's usability heuristics: a user shouldn't have to remember what a field expects — the label is always visible, always above the field it describes, in every form the Packer renders, because the form block has no code path that renders it any other way. The same reasoning is why the form block stacks fields in a single column by default: a second column forces a zigzag scan instead of a straight top-to-bottom read, and fields off the natural scan path get skipped (Luke Wroblewski's Web Form Design). Multi-column is opt-in only, for tightly related fields like first/last name.",
      },
    ],
    code: `[
  {
    type: "form",
    heading: "Account Settings",
    fields: [
      { kind: "text", label: "Display name", placeholder: "e.g. Jane Doe" },
      { kind: "email", label: "Email address" },
    ],
    submitLabel: "Save changes",
  },
]`,
    exampleBlocks: [
      {
        type: "form",
        heading: "Account Settings",
        fields: [
          { kind: "text", label: "Display name", placeholder: "e.g. Jane Doe" },
          { kind: "email", label: "Email address" },
        ],
        submitLabel: "Save changes",
      },
    ],
  },
  {
    type: "heuristic",
    id: "consistency",
    title: "2. Consistency and standards",
    rule: "One token set, one spacing scale, applied identically — no per-block one-off values.",
    rationale: [
      {
        kind: "text",
        text: "Two completely different blocks below (a callout and a data-list) share the exact same spacing rhythm and type scale, because neither one specifies its own — the Packer reads all of it from the same --rebar-* custom properties, so nothing here can drift out of sync as content changes.",
      },
    ],
    code: `[
  { type: "callout", tone: "info", title: "Heads up", subtitle: "Archived projects are read-only." },
  {
    type: "data-list",
    items: [
      { title: "Marketing Site Redesign", badge: "Active" },
      { title: "Legacy API Migration", badge: "Archived" },
    ],
  },
]`,
    exampleBlocks: [
      { type: "callout", tone: "info", title: "Heads up", subtitle: "Archived projects are read-only." },
      {
        type: "data-list",
        items: [
          { title: "Marketing Site Redesign", badge: "Active" },
          { title: "Legacy API Migration", badge: "Archived" },
        ],
      },
    ],
  },
  {
    type: "heuristic",
    id: "proximity",
    title: "3. Proximity, similarity, closure (Gestalt)",
    rule: "Related items read as one group; the grouping comes from spacing and repetition, not a manual border or label.",
    rationale: [
      {
        kind: "text",
        text: "A checklist's items are visibly one set purely because of consistent spacing and identical card styling — Gestalt's proximity and similarity principles at work structurally, not left to per-app judgment the way a hand-authored layout could get wrong. Concretely, related items sit --rebar-space-xs (4px) apart; unrelated groups sit --rebar-space-md (16px) or more apart — the gap itself, not a label or border, is what tells a viewer which controls belong together.",
      },
    ],
    code: `[
  {
    type: "checklist",
    heading: "Pre-launch checklist",
    items: ["Design review complete", "Accessibility audit passed", "Staging tested"],
  },
]`,
    exampleBlocks: [
      {
        type: "checklist",
        heading: "Pre-launch checklist",
        items: ["Design review complete", "Accessibility audit passed", "Staging tested"],
      },
    ],
  },
  {
    type: "heuristic",
    id: "control",
    title: "4. User control and freedom",
    rule: "Every modal is closable via a close button, backdrop click, and Esc — never a dead end. Every destructive action is confirmed with the specific consequence named, never silently auto-corrected.",
    rationale: [
      {
        kind: "text",
        text: `The \`modal\` block (shown below as JSON — one of the six added for the [tier benchmarks](/about/benchmarks)) renders a real Dialog underneath (Radix UI), which wires all three closing mechanisms itself. It's deliberately rendered already-open for a static screenshot in a benchmark context, which is exactly wrong for a live documentation page stacked with other examples — a forced-open modal would cover this entire page as a fixed overlay. The [Dialog reference page](/opinions/dialog) shows the real, normally-triggered version live: click it, then try closing it all three ways. The same discipline applies to the confirmation itself: an "Are you sure?" with no other detail isn't a real confirmation — "Delete 3 files permanently?" is. \`Dialog\`'s destructive variant names the action on the confirming button ("Delete", not "OK"), renders it in the danger color, and keeps it visually separated from any safe action nearby.`,
      },
    ],
    code: `{
  type: "modal",
  title: "Confirm onboarding",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  blocks: [
    { type: "callout", tone: "warning", title: "Are you sure?", subtitle: "This will onboard the selected employee." },
  ],
}`,
  },
  {
    type: "heuristic",
    id: "layers",
    title: "5. Clear layer separation",
    rule: "Whenever content renders in front of other content, the two need their own distinct visual surface — not just z-index stacking.",
    rationale: [
      {
        kind: "text",
        text: "This is Material Design's elevation system made explicit: a shadow, a scrim, or a background color change is what tells a viewer which layer is in front — z-index alone is invisible. Found concretely in `Spin`: its loading overlay originally had no background of its own, just a bare icon and label floating directly on top of the dimmed content underneath, with nothing marking it as a separate surface. Fixed by giving the overlay a real background (via `color-mix()` against the existing `--rebar-color-bg-primary` token, so it automatically resolves to the right light/dark shade — component styles reference tokens, themes own the actual colors, never the other way around), the same treatment `Dialog`'s backdrop and `Dropdown`'s panel already had.",
      },
    ],
    code: `<Spin spinning tip="Fetching">
  <Stack gap="sm">
    <Text size="sm">Project A</Text>
    <Text size="sm">Project B</Text>
  </Stack>
</Spin>`,
  },
  { type: "spin-card", tip: "Fetching", items: ["Project A", "Project B", "Project C"], width: 220, minHeight: 120 },
  {
    type: "heuristic",
    id: "nav-overflow",
    title: "6. Nav overflow",
    rule: 'A header\'s nav never consumes more than half the header — items that would cross that line collapse into a trailing "More" popover instead.',
    rationale: [
      {
        kind: "text",
        text: `Mirrors Material Design's app-bar overflow-menu guidance and Carbon's UI Shell header nav, applied as a firm width budget rather than a vague "if it doesn't fit" rule — a header's other content (branding, a version number, account controls) needs guaranteed room too. \`NavBar\` handles the collapse mechanics via real-time measurement; resize the box below (or just narrow your browser — this site's own header, above, follows the identical rule).`,
      },
    ],
  },
  { type: "nav-bar", ariaLabel: "Example", resizable: true, items: NAV_OVERFLOW_ITEMS },
  {
    type: "heuristic",
    id: "minimalist",
    title: "7. Aesthetic and minimalist design",
    rule: "Show only what's relevant by default — a bounded column set, not every possible field at once.",
    rationale: [
      {
        kind: "text",
        text: "The table block takes exactly the columns you give it — there's no 'show all fields' default to opt out of, so a Packer-rendered table never dumps more than the author actually asked for.",
      },
    ],
    code: `[
  {
    type: "table",
    columns: ["Team", "Lead"],
    rows: [
      { cells: ["Engineering", "Priya Shah"], actionLabel: "Select" },
      { cells: ["Design", "Marcus Webb"], actionLabel: "Select" },
    ],
  },
]`,
    exampleBlocks: [
      {
        type: "table",
        columns: ["Team", "Lead"],
        rows: [
          { cells: ["Engineering", "Priya Shah"], actionLabel: "Select" },
          { cells: ["Design", "Marcus Webb"], actionLabel: "Select" },
        ],
      },
    ],
  },
  {
    type: "heuristic",
    id: "space-dense",
    title: "8. Space-dense content on a text-dominant page",
    rule: "More than ~4 non-text elements in a row goes in a space-minimizing container, not an inline grid.",
    rationale: [
      {
        kind: "text",
        text: "This isn't a `Block` block (the Packer doesn't currently lay out photo galleries), but the rule is applied literally everywhere on this site itself that has one — every screenshot gallery on [/about/benchmarks](/about/benchmarks), and the reference examples on the [Carousel](/imitations/carousel) and [AspectRatio](/synthetics/aspect-ratio) pages, use `Carousel` instead of a grid, specifically because a wall of thumbnails works against minimalism (heuristic #7) rather than serving it. One rule for a carousel specifically: every slide inside it shares one aspect ratio, no exceptions — its viewport has one fixed height, so a mixed-ratio slide leaves visible dead space rather than the container resizing per slide. A page that genuinely needs to show many different ratios side by side (a reference catalog of every supported ratio, say) uses a plain wrapping grid instead — that's the one case a carousel can't serve.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "index",
    title: "9. Long text-dominant pages need a section index",
    rule: "More than 3 top-level headings gets an in-page index — on the right, since the left is reserved for cross-page site navigation.",
    rationale: [
      {
        kind: "text",
        text: `This page has enough top-level sections that it needs its own index — look to the right (or, on a narrow screen, notice there's no index nav shown at all, per the same heuristic's own responsive behavior). That's not a coincidence: this page is applying the rule to itself while explaining it, the same "proof by existence" discipline the rest of this site follows. The ~3-heading threshold is a starting default, not a hard rule — judge by whether scrolling past unrelated sections to reach the one you want is actually the friction, not by the raw heading count alone.`,
      },
    ],
  },
  {
    type: "heuristic",
    id: "status-visible",
    title: "10. Visibility of system status",
    rule: "Every async action shows a loading/success/error state within ~300ms of the interaction, and the user never has to guess what's active, selected, or current.",
    rationale: [
      {
        kind: "text",
        text: "Two faces of the same principle, not two separate rules: transient feedback while something is happening, and a persistent cue for whatever's already true — active tabs, selected items, current directory, sort direction — shown via highlight, checkmark, bold, or another persistent visual cue, not just during the action itself. `Tabs` highlights the active tab; `Dropdown` shows checkmarks on toggled items; `Breadcrumb` highlights the current location; `Progress` shows percentage or fraction; a sortable table shows a sort-direction indicator on its active column.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "ia-pyramid",
    title: "11. Information architecture as pyramid",
    rule: "Don't split related content onto different pages where a filter or search could reduce page count. IA should be pointy at the top, broader the further down you go.",
    rationale: [
      {
        kind: "text",
        text: "Start with high-level categories, then progressively reveal detail. A flat list of 30+ options or deep nesting (>2 levels) signals a failed information architecture. A future `Settings` interface (not yet built — forward guidance) uses tabbed categories or sidebar navigation; the `table` block provides search/filter before pagination; deep nesting is avoided in any navigation structure. This is the rule behind this site's own tier catalog pages (e.g. [/opinions](/opinions)) and this page's nav gaining a search bar and category filter once their item count grew past a flat list a reader could scan directly.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "visual-hierarchy",
    title: "12. Visual hierarchy in every container",
    rule: "Every dialog, panel, or card has three zones (title, content, actions) with clearly differentiated visual weight — size, weight, spacing.",
    rationale: [
      {
        kind: "text",
        text: "Users should scan a container's purpose in under a second. A wall of same-sized text is a wall of same-weight text — nothing stands out, nothing is scannable. Dialog titles are ≥1 step larger than body text; action buttons are separated from content by ≥1 spacing unit; primary actions are visually dominant. Components use semantic type tokens (`heading`, `body`, `caption`, `label`), never raw font sizes. [Cards](#card-layouts) are this same zone structure applied to a self-contained unit, not a separate rule.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "icon-labels",
    title: "13. Icons require labels or tooltips",
    rule: "Every icon has an adjacent text label, a tooltip, or both. Icons alone force guesswork; labels remove ambiguity.",
    rationale: [
      {
        kind: "text",
        text: "The only exception is a small set of universally recognized icons (trash = delete, magnifying glass = search, hamburger = menu) in a context where the user has already learned them. An icon-only button requires either an `aria-label`, a visible `label` prop, or a `title` attribute; icon-only buttons trigger a dev-mode warning.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "menu-complexity",
    title: "14. Menus manage their own complexity",
    rule: "A menu with more than ~8 items auto-inserts separators or collapses into submenus. Related items are grouped; destructive actions are separated from safe ones.",
    rationale: [
      {
        kind: "text",
        text: "Deep nesting (>2 levels) is avoided — if a submenu itself needs a submenu, the information architecture is wrong. `Dropdown` (real, Radix-backed) supports a `danger` flag per item today, giving destructive actions real visual separation from safe ones; auto-inserting separators past an item-count threshold isn't built yet (forward guidance, not current behavior) — until it is, keep any one `Dropdown` under the #17 ceiling by hand. See #17 below for the same item-count ceiling applied more generally, outside menus specifically.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "settings-organization",
    title: "15. Settings are categorized, searchable, and resettable",
    rule: "Any preferences or settings interface categorizes options by purpose, provides search for power users, explains what each option does, and offers reset-to-defaults.",
    rationale: [
      {
        kind: "text",
        text: `A flat list of 30+ toggles is a failed settings panel. Users who've made several changes need a safe way to experiment — without reset, they can't undo what they don't remember changing. A future \`Settings\` component (not yet built — forward guidance, like the rest of this section) would provide tabbed or sidebar categories, a label and optional description per setting, and a "Reset to Defaults" button; \`Form\` already supports a \`reset()\` method that restores initial values today.`,
      },
    ],
  },
  {
    type: "heuristic",
    id: "chart-context",
    title: "16. Charts ship with context",
    rule: "Every chart, graph, or data display has a title (what), axis labels or legend (how to read it), and units (in what measure). A chart without context is decoration, not information.",
    rationale: [
      {
        kind: "text",
        text: "Chart components ship with mandatory title, legend, and axis-label slots; they render a visible placeholder when data is absent, never a blank area. If the data can't be shown, the user should know *why* — not wonder whether the chart broke. [/about/benchmarks](/about/benchmarks)'s own `ScatterChart`/`LineChart` helpers are a real, shipped example: title and axis labels are required arguments, not optional ones a caller could forget.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "progressive-disclosure",
    title: "17. Progressive disclosure: default to ≤7–9 visible options",
    rule: "Show essential options first; reveal advanced options on demand. Default state shows 5–9 visible options, respecting Miller's Law — people reliably track 7±2 items at once before missing one or losing their place.",
    rationale: [
      {
        kind: "text",
        text: `A settings panel that shows everything at once overwhelms casual users while not serving power users (who want search or keyboard shortcuts instead). Longer lists need search, filtering, grouping, or an explicit "Advanced"/expand step — not more items crammed into the default view. Multi-step processes (tutorials, wizards, setup) show progress and provide a visible exit. \`Select\`/\`Dropdown\` show a bounded default item count before requiring scrolling or search; \`Steps\` shows current step / total steps with a visible cancel/skip action; a future \`Settings\` interface defaults to ≤7 visible options with an "Advanced" expandable section.`,
      },
    ],
  },
  {
    type: "heuristic",
    id: "menu-content-separation",
    title: "18. Menus don't obscure their content",
    rule: "Dropdowns, popovers, and menus position themselves to avoid permanently obscuring the content they control. A menu that covers the document it's formatting is a failed menu.",
    rationale: [
      {
        kind: "text",
        text: "Backgrounds should be solid or subtly textured, not dithered or noisy — dithering creates visual fatigue and reduces legibility. Background colors should be muted, not aggressively saturated — high-saturation backgrounds cause visual fatigue and reduce legibility of foreground content. `Dropdown`/`Popover`/`HoverCard` position themselves below or above the trigger based on available space, never over the content they relate to — Radix's own collision-aware positioning, not reimplemented here; saturated colors are reserved for accents, alerts, or interactive elements.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "touch-targets",
    title: "19. Touch targets ≥ 44×44 px",
    rule: "Every interactive element has a hit area of at least 44×44 CSS pixels — the Apple HIG minimum — even when the visible glyph is smaller.",
    rationale: [
      {
        kind: "text",
        text: "Fitts's Law: smaller targets take longer to acquire and produce more errors. On touch devices, fat-finger errors are the dominant failure mode. This applies most directly to the forthcoming Mobile Components set, but any web component reachable on a touch device is held to the same bar: `Button`, `Checkbox`, and `Toggle` all enforce a minimum `min-block-size` of 44px via component-level styles; icons inside buttons can be visually smaller, but the clickable area never is.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "all-states",
    title: "20. Design all states — loading, error, empty, disabled",
    rule: `Every component has loading, error, empty, and disabled states designed — not just the "happy path."`,
    rationale: [
      {
        kind: "text",
        text: "Users encounter edge cases regularly; unhandled states break trust and workflows. A table that shows nothing when empty looks broken. A form that silently fails on error loses data. The loading state specifically uses a skeleton matching the content's real layout — a skeleton sets expectations for content structure in a way a spinner can't, and reduces perceived wait time. Every component documents and implements `loading` (`Skeleton`, already shipped, or `Spin` for an in-place indicator), `error` (a specific message with a recovery action), `empty` (`Empty`, already shipped), and `disabled` (visually distinct, with a tooltip explaining why) states.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "purposeful-animation",
    title: "21. Animation communicates, not decorates",
    rule: "Every animation serves a purpose: orient (where did this come from?), feedback (did my action register?), or continuity (what changed?). Purely decorative animation is removed or made optional.",
    rationale: [
      {
        kind: "text",
        text: "From Val Head's *Designing Interface Animation*: animation that doesn't answer one of those three questions is noise — and worse, it slows down users who just want to get things done. All transitions respect `prefers-reduced-motion` — already true today of `Spin`'s illustrated variants; durations are 200–500ms (fast enough to feel responsive, slow enough to be perceived); easing is `ease-out` for entrances, `ease-in` for exits. Components ship with purposeful defaults: `Dialog` fades in, `Dropdown` slides down, `Toast` slides in from the edge.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "natural-mappings",
    title: "22. Natural mappings",
    rule: "Controls are arranged so their spatial layout maps to what they affect — the same principle as stove burners matching their burner positions.",
    rationale: [
      {
        kind: "text",
        text: `From Don Norman's *Design of Everyday Things*: a mapping is "natural" when the relationship between control and effect is spatially obvious. A volume slider that goes up for louder, a brightness control that goes right for brighter, a tab bar whose order matches the content order — these need no labels or instructions. \`Slider\` and other spatial controls position themselves logically relative to their targets; \`Tabs\` render in document order; \`Button\` labels describe the action verb ("Save", "Delete"), not an abstract noun.`,
      },
    ],
  },
  {
    type: "heuristic",
    id: "platform-conventions",
    title: "23. Follow platform conventions",
    rule: "Respect platform-specific patterns: iOS tab bar at bottom, Android at top; macOS menus in the menu bar, Windows in the title bar. Users bring expectations from the platform; violating them increases cognitive load.",
    rationale: [
      {
        kind: "text",
        text: "This rule mostly targets the forthcoming Mobile Components set — rebar-ui today is web-only, and web has its own, looser convention space — recorded now so it's a stated design constraint by the time that set exists, not retrofitted after the fact. Forward guidance: a future mobile tab bar defaults to the bottom on iOS, top on Android, without the app needing to specify it per-platform.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "whitespace",
    title: "24. Whitespace is an active design element",
    rule: "Whitespace separates, groups, and creates hierarchy — it is not wasted space. Adequate margins and padding improve legibility and scannability.",
    rationale: [
      {
        kind: "text",
        text: "Whitespace (negative space) is one of the most powerful tools in visual design. It reduces cognitive load by giving the eye resting points and creating clear visual groups. Components use spacing tokens (`--rebar-space-*`) for all margins and padding; default component margin is `--rebar-space-md` (16px); internal padding is `--rebar-space-sm` (8px) or `--rebar-space-md` (16px). No component ships with `margin: 0` or `padding: 0` unless explicitly overridden by the consumer.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "button-hierarchy",
    title: "25. Button hierarchy is clear",
    rule: "Primary, secondary, and tertiary buttons have distinct visual weight. One primary button per container; secondary for alternatives; tertiary for low-emphasis actions.",
    rationale: [
      {
        kind: "text",
        text: "When every button looks the same, users can't tell which action is the intended one. `Button` has three variants: `primary` (filled, dominant color), `secondary` (outlined or subtle fill), `tertiary` (text-only or ghost). One `primary` button per dialog or form is the convention (a dev-mode warning, not a hard block, if a second one appears).",
      },
    ],
  },
  {
    type: "heuristic",
    id: "input-constraints",
    title: "26. Input constraints are visible",
    rule: "Character limits, required fields, format requirements, and valid ranges are shown before or during input — not after submission.",
    rationale: [
      {
        kind: "text",
        text: "From *Web Form Design*: users should know constraints upfront to avoid errors. Discovering a constraint after submission wastes the user's time and causes frustration. The `form` block shows a `required` indicator before the user ever focuses a field; native `maxLength`/`min`/`max`/`pattern` constraints display as helper text, not just a silent browser rejection; validation errors appear inline on blur, not on submit.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "multiple-input-methods",
    title: "27. Multiple input methods",
    rule: "Forms and data entry support both browsing/selecting and direct input. Users have different preferences — some want to browse a list, others want to type.",
    rationale: [
      {
        kind: "text",
        text: `From *About Face*: power users want keyboard shortcuts and direct manipulation; novice users want visible options and guided workflows. Supporting both in the same component serves everyone. \`Select\` is browsing-only, with no type-to-filter — \`Combobox\` is the shipped answer for that: a real WAI-ARIA combobox (search-as-you-type over its own option list), single-select by default or a multi-select dropdown via its \`multiple\` mode. Dates get the same split across two distinct, already-shipped components rather than one that tries to do both: \`DatePicker\` is the fast, keyboard-first direct-entry shape (a bounded day/month/year numeric triplet — closer to \`NumberInput\` than a calendar), and \`Calendar\` is the browsing/visual-picking shape (a real month grid), reachable in a \`Popover\` when a trigger-button shape is wanted.`,
      },
    ],
  },
  {
    type: "heuristic",
    id: "information-scent",
    title: "28. Information scent in navigation",
    rule: `Navigation labels clearly indicate what's ahead — not vague or clever names. Users follow "information scent": clues that lead them to their goal.`,
    rationale: [
      {
        kind: "text",
        text: `From the Information Foraging theory (Pirolli & Card): users behave like predators following a scent trail. When a link's label doesn't clearly match what the user is looking for, the scent goes cold and they leave. \`NavBar\` and \`Breadcrumb\` labels match destination page titles; labels describe content, not abstract concepts; clever metaphors are avoided unless universally understood (e.g. "Trash" for deletion).`,
      },
    ],
  },
  {
    type: "heuristic",
    id: "card-layouts",
    title: "29. Cards are self-contained units",
    rule: "Card-based layouts for modular, scannable content. Each card has a clear boundary (border, shadow, background), contains related information, and is independently actionable.",
    rationale: [
      {
        kind: "text",
        text: "Cards work because they combine proximity (related info in one container), closure (clear boundary), and the same title/content/actions zone structure as [heuristic #12](#visual-hierarchy) — not a separate rule. `Card` has a visible boundary (border or shadow) and consistent internal padding (`--rebar-space-md`); cards in a grid use consistent sizing or flexible layouts that don't break at any viewport width.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "respect-intelligence",
    title: "30. Respect user intelligence",
    rule: "Treat users as capable problem-solvers, not children who need to be protected from complexity or nudged toward a choice they didn't actually intend.",
    rationale: [
      {
        kind: "text",
        text: `This is Shneiderman's "support internal locus of control" golden rule made concrete, and it earns its own entry rather than folding into heuristic #4 (user control and freedom) because the two fail in different directions: #4 is about *recovering* from an action already taken; this one is about not *manufacturing* the need for that recovery in the first place — by over-confirming trivial actions, hiding real functionality behind "simplified" layers a user can't opt out of, or wording a choice to trick rather than inform. Rebar ships no generic "are you sure?" wrapper a consumer could reach for on a trivial action — the destructive-confirmation pattern in #4 is reserved for actions with a real, named consequence; button and link copy names the actual action plainly in both the accept and decline directions, with no asymmetric styling that makes one path harder to find or click.`,
      },
    ],
  },
  {
    type: "heuristic",
    id: "boot-sequences",
    title: "31. Boot/init sequences show branded, phased progress",
    rule: "A startup sequence is itself a UI: it should communicate what phase is happening, not render a silent blank wait or an unreadable dump of raw state.",
    rationale: [
      {
        kind: "text",
        text: "The app-shell-level analogue of #10 (visibility of system status) and #20 (designed loading states), applied to the one loading state that happens before any component exists yet to show it — the first of ten heuristics this section adds from a much larger research pass (636 raw candidates from historical GUI critiques and framework inventories, de-duplicated down to these ten genuinely distinct ones — see `ref/HEURISTICS.md` for the full accounting of what didn't survive and why). Component rule (forward-looking): no app-shell/splash primitive exists yet; when one does, it should reuse `Progress`/`Spin`'s existing state machine rather than inventing new plumbing, and show a phase label, not just a percentage.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "storage-context",
    title: "32. Storage/item-count context is always visible",
    rule: "Any view over a bounded collection shows its own size context — item count, available capacity — persistently in its own chrome, not only on demand.",
    rationale: [
      {
        kind: "text",
        text: `Users constantly need "how much is here, how much room is left" to decide whether an operation is safe; forcing a separate lookup breaks the flow of the primary task. Component rule: rebar already ships \`Statistic\`, \`Descriptions\`, and \`Progress\` — a future file/folder-browsing block should compose these into a persistent header rather than requiring a separate dialog.`,
      },
    ],
  },
  {
    type: "heuristic",
    id: "grid-and-table-views",
    title: "33. Icon-grid and sortable-table views of the same data",
    rule: "File/data browsers offer both an icon-grid view (fast visual scanning, a small or unfamiliar set) and a sortable-column table view (a large or familiar set) of the same underlying collection.",
    rationale: [
      {
        kind: "text",
        text: "The user chooses per task rather than the tool forcing one. Component rule (forward-looking): no file-browser component exists yet; when built, it should default to the `table` block (`@rebar-ui/placement`, already cited in #11) for the detail view and offer an icon-grid toggle, not the reverse.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "undisambiguated-context",
    title: "34. Decision dialogs show complete, undisambiguated context",
    rule: "Full source and destination paths in a conflict dialog, not just filenames that might collide; an empty slot explicitly labeled, not silently omitted from a list.",
    rationale: [
      {
        kind: "text",
        text: "A distinct failure mode from showing too little too late (#26) or skipping confirmation (#4) — this one is about *silent incompleteness*. Component rule (forward-looking): a future file-conflict `Dialog` variant should render full paths via `Descriptions` (already shipped) rather than bare filename strings.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "live-preview-commit",
    title: "35. Live preview before commit, commit as its own explicit action",
    rule: `A setting affecting appearance or behavior unpredictably from its label alone shows the effect live as it's adjusted, with "try it now," "keep it," and "undo everything" as three distinct actions, not one implicit commit.`,
    rationale: [
      {
        kind: "text",
        text: "Sharpens #15 (settings offer reset-to-defaults) with a distinct nuance — live-preview-then-explicit-commit, not just resettability after the fact. Component rule: rebar's shipped `Slider` and `Switch` already support live `onChange` feedback — a future `Settings` interface should wire that feedback to a visible preview region and expose Apply/Save/Cancel as three distinct actions.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "ellipsis-convention",
    title: "36. Ellipsis marks menu items that need further input",
    rule: `A menu item that opens a dialog before its action completes ("Rename…") is visually distinguished from one that runs immediately ("Delete") with a trailing ellipsis.`,
    rationale: [
      {
        kind: "text",
        text: `Still the standard convention in macOS/Windows/GNOME menus today, solving the blind-click problem with one character. Component rule: \`Dropdown\` (real, Radix-backed, shipped) supports a \`danger\` flag per item (#14) but has no equivalent convention for "opens further input" yet — a small, concrete gap.`,
      },
    ],
  },
  {
    type: "heuristic",
    id: "token-inputs",
    title: "37. Multi-value inputs render as removable tokens, not a raw string",
    rule: "A form field accepting multiple discrete values (tags, recipients) renders each as its own visible, individually-removable chip, rather than a single text box edited as comma-separated text.",
    rationale: [
      {
        kind: "text",
        text: "A raw delimited string is easy to silently mistype and hard to scan. Component rule: a multi-select dropdown renders each selected value as its own removable `Tag` chip inline with the input, not a comma-separated string — `Combobox`'s `multiple` mode is exactly this, already shipped.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "drag-and-drop-fallback",
    title: "38. Drag-and-drop always has a non-drag fallback",
    rule: "A file-upload or reorderable-list interaction that only works by dragging excludes anyone who can't perform a drag gesture, and gives no cue about where a drop will land until mid-drag.",
    rationale: [
      {
        kind: "text",
        text: `A direct extension of Nielsen's flexibility and efficiency of use (full keyboard operability everywhere, see \`ref/HEURISTICS.md\` #7) applied specifically to drag-and-drop, not a new principle on its own — a drop zone needs a persistent, labeled boundary, and every drag-only interaction needs an equivalent non-drag path (a "Browse…" button, or reorder buttons). Component rule (forward-looking): no drag-and-drop component exists yet, matching the \`FileUpload\` gap already noted in the component catalogue.`,
      },
    ],
  },
  {
    type: "heuristic",
    id: "copyable-code",
    title: "39. Copyable code ships with a one-click copy and visible confirmation",
    rule: "Any code block, command, or copyable identifier renders with an attached copy button that gives immediate, visible feedback on click, rather than a silent clipboard write.",
    rationale: [
      {
        kind: "text",
        text: "A small, sharply-scoped pattern this very docs site is a direct, immediate consumer of — every `Code` block on this page is a candidate. Component rule (forward-looking): no dedicated `CodeBlock` component exists yet; its confirmation should reuse `Toast`'s existing timing conventions (#21) for the transition itself, with a deliberately longer dwell time for the confirmation text.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "internationalization",
    title: "40. Internationalization: RTL and locale-aware formatting",
    rule: "Components support right-to-left layout mirroring and locale-aware date/number/currency formatting, not just English left-to-right.",
    rationale: [
      {
        kind: "text",
        text: "Checked directly against source rather than assumed: rebar-ui's stylesheet has no `dir`/RTL handling and no locale-formatting layer today — a genuine, currently-unaddressed gap, not a restatement of an existing rule. Component rule (forward-looking): logical CSS properties (`margin-inline-start` rather than `margin-left`) and a documented locale-formatting hook for `Statistic`/date-bearing components are the concrete first steps; neither exists today.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "status-pill",
    title: "41. Lifecycle status is a pill, never inline parenthetical text",
    rule: `An item's build/lifecycle status (planned, deprecated, unmeasured) renders as its own \`Tag\`, never appended into the name ("Avatar (planned)") or spelled out as a full sentence.`,
    rationale: [
      {
        kind: "text",
        text: "Caught on this project's own component catalog pages, where two different ad hoc string patterns did this same job inconsistently. Component rule: `NavIndex`'s status field, and anywhere else an item's build status needs surfacing, renders via the real `Tag` component — never string concatenation.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "filter-dimensions",
    title:
      "42. Filter UI matches how many independent dimensions a list varies along, and each dimension's control matches how many values it has",
    rule: "A search box alone suffices only when every item shares one category; each further way items differ is a second, independent dimension needing its own filter — and that filter's control scales to its own size, in three real tiers, not two.",
    rationale: [
      {
        kind: "text",
        text: "A small fixed few is a toggle; a larger but still-scannable set where more than one value may need selecting at once is a closed-menu multi-select; a set large enough that scanning it is itself the friction is a searchable multi-select. These are genuinely different, separately-established patterns, not one restyled three ways — using the wrong tier is this same heuristic's failure, one level down. Caught on this project's own tier catalog sidebar (e.g. [/opinions](/opinions)), twice: once for having no status filter at all, and again when the toggle added for it overflowed its column once one label ran longer than its neighbors. Component rule: `NavIndex` picks `SegmentedControl` or `MultiSelect` per dimension based on its real cardinality, never a hand-rolled row of buttons.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "scroll-mist",
    title: `43. A scrollable list fades into a "mist" at whichever edge still has more content`,
    rule: "A hard-cropped, especially hidden-scrollbar, edge on an overflowing list gives no signal that content continues past it — a soft fade-to-transparent gradient at that edge does, tracking real scroll position rather than rendering unconditionally.",
    rationale: [
      {
        kind: "text",
        text: `Reaching the true end of a list is signaled precisely by the mist's *absence* at the bottom, not a separate "you've reached the end" label — a static CSS-only fade that never reacts to scroll position fails this. Component rule: \`SectionNav\` tracks its own scroll position and toggles the top/bottom mist independently; the same treatment is owed to any other fixed-height scrollable region this library ships (several don't have it yet — a real, open gap, not a solved case). This very page's own right-hand index, now 46 entries long, is the live example — scroll it to see the mist react.`,
      },
    ],
  },
  {
    type: "heuristic",
    id: "beacon-point",
    title: "44. A tracking indicator below the fold stays visible, or returns shortly after a manual override",
    rule: `A highlight showing "where you are" in a long, independently-scrollable list is a beacon — it should stay in view as it moves, and yield to (never fight) a deliberate manual scroll of that list, resuming only once the person is done with it.`,
    rationale: [
      {
        kind: "text",
        text: "If the list's own rail scrolls far enough to carry the beacon out of its visible area, that's a silent failure worse than never highlighting anything — it stops working with no sign it has. But a beacon that fights every manual scroll, snapping back the instant someone tries to look elsewhere, is worse than one that disappears — the fix has to yield to that override and resume only once it has genuinely ended. Component rule: `SectionNav` scrolls its own rail to keep the active item in view, deferring for a short pause after a real manual scroll of its own rail before resuming. Try it here — scroll this right-hand rail yourself, then stop scrolling the main page; after 5 idle seconds it recenters on whichever heading is currently in view.",
      },
    ],
  },
  {
    type: "heuristic",
    id: "bounded-footprint",
    title: "45. A control's own footprint stays bounded, however much data it holds",
    rule: "A component whose content depends on open-ended data (a growing selection, a long list) is pinned to a fixed size — a set width/height, or an edge of its container — rather than left to grow indefinitely and push the surrounding layout around.",
    rationale: [
      {
        kind: "text",
        text: `Content that could genuinely be unbounded goes *inside* that fixed footprint via contained scrolling (#43, #44), not by growing the footprint itself. "Infinite scroll" is license for a page-level feed to keep loading, not for an individual control to keep growing with it. Caught live in this project's own first draft of [MultiSelect](/opinions/multi-select), whose trigger summarized a selection by joining every picked label end to end — its own width growing without bound as more got checked, not a hypothetical failure. Component rule: \`MultiSelect\`'s trigger shows a plain count once there's more than one pick, never a growing joined string.`,
      },
    ],
  },
  {
    type: "heuristic",
    id: "beacon-pointer-easing",
    title:
      "46. A beacon out of view gets a directional hint that reacts to motion, and the scroll that follows it eases rather than snaps",
    rule: "#44 established that a beacon should stay visible or return to view — this refines how both halves actually feel: a hint reacts to scroll motion to name the direction to look while it's out of view, and the scroll that brings it back eases smoothly rather than snapping in one frame.",
    rationale: [
      {
        kind: "text",
        text: `A beacon's *absence* alone is a weak signal, but a *static* hint at the edge it's past still blends into static chrome — what actually reads as "something is happening over there" is the hint reacting to motion itself: resting while nothing is scrolling, animating only while a scroll that could be moving the beacon is actually in progress. And the scroll that restores a beacon should ease smoothly toward its new position rather than snap in one frame — a snap reads as the list jumping to a new state, an eased scroll reads as the beacon being *followed*. Component rule: \`SectionNav\` renders a small dot-or-bar marker (sized by recent scroll speed) at whichever edge the beacon sits past, and calls \`scrollTo({ behavior: "smooth" })\` for every follow or recenter rather than assigning scroll position directly. Try it here: scroll this right-hand rail down by hand a little, then keep scrolling the main page — the beacon moves out of the rail's visible area while your manual scroll is still "in effect" (#44), and a marker appears at whichever edge it's past for as long as that lasts; stop scrolling the main page and wait, and once the idle pause elapses the rail eases back to the beacon and the marker disappears.`,
      },
    ],
  },
];

export default function HeuristicsPage() {
  return (
    <Stack gap="lg" style={{ maxWidth: 800, margin: "0 auto", padding: "var(--rebar-space-xl)" }}>
      <Image src="/catalogue-heros/heuristics.jpeg" alt="Heuristics hero" style={{ width: "100%", borderRadius: "8px" }} />
      <Stack direction="row" gap="xl" style={{ alignItems: "flex-start" }}>
        <Stack gap="lg" style={{ flex: 1, minWidth: 0 }}>
          <NextBlockRenderer blocks={HEURISTIC_BLOCKS} />
        </Stack>
        <NextBlockRenderer blocks={[{ type: "page-index", sections: SECTIONS }]} />
      </Stack>
    </Stack>
  );
}
