import type { CatalogConstruct } from "./constructCatalog.types";

// Sourced from a cross-reference of 180+ published UI libraries/design systems against
// rebar-ui's current construct set (see ref/research/component-inventories/). Not yet built —
// these are catalogued gaps, not a roadmap commitment. Descriptions are deliberately short;
// "sources" names a few representative libraries, not every one that has it.
//
// Every entry originally catalogued here has shipped as a real `packages/core` construct:
// TimePicker, Calendar, Drawer/Sheet, Transfer, SplitButton, Command Palette, ScrollArea,
// Resizable Panels, DatePicker, Image, Lightbox, FileUpload, and RichTextEditor — see
// /opinions/time-picker, /opinions/calendar, /opinions/drawer, /opinions/transfer,
// /opinions/split-button, /opinions/command-palette, /imitations/scroll-area,
// /opinions/resizable-panels, /opinions/date-picker, /opinions/image,
// /opinions/lightbox, /opinions/file-upload, and /opinions/rich-text-editor.
//
// A second research pass, once the first catalog fully closed: specifically cross-referenced
// against Ant Design's own current construct set (v6), since AntD is this project's own stated
// migration target (see ref/PLAN.md / Agents.md's "Migration" section) — closing a gap here also
// closes a migration-coverage gap, not just a generic "libraries have this" one. That pass's
// seven entries — BackTop, Avatar.Group, Popconfirm, Affix, Tour, TreeSelect, and Mentions — have
// also all shipped now, see /synthetics/back-top, /synthetics/avatar-group,
// /opinions/popconfirm, /synthetics/affix, /opinions/tour, /opinions/tree-select, and
// /opinions/mentions. Building `AvatarGroup` also surfaced and fixed a real, pre-existing
// Framework Rule violation in `Avatar` itself (no `size` prop, no rest-spread for `data-*`/
// `aria-*` passthrough) — see `Avatar.tsx`.
//
// A third research pass, this time anchored on MUI specifically (a different library than AntD,
// to avoid re-covering the exact same ground twice) — checked first that `Progress` had no
// existing circular-variant flag before treating "circular progress" as a real gap (it doesn't,
// but `GaugeChart` already covers a single-value radial dial reasonably well, so it was left off
// this list as already-served rather than added as a near-duplicate). That pass's three entries —
// ButtonGroup, SpeedDial, and Masonry — have also all shipped now, see /synthetics/button-group,
// /opinions/speed-dial, and /synthetics/masonry.
//
// A fourth research pass, anchored on shadcn/ui (built on Radix primitives) — a third distinct
// library after AntD and MUI, chosen because its construct set skews toward interaction
// primitives (menus, toggles, disclosure) rather than more chart/data-display variants, which is
// where the previous two passes' gaps mostly weren't. Checked first that each candidate wasn't
// already served: `Badge`'s `count`/`dot` props already cover the "small overlay indicator on a
// wrapped child" need (Chakra/AntD call this pattern `Indicator`/`Badge` interchangeably) so that
// was left off; `Accordion`/`AccordionItem` require multi-item `value` machinery with no bare
// single-region mode, confirmed by reading both files, so a standalone `Collapsible` is a real gap
// rather than a near-duplicate. That pass's four entries — ContextMenu, Toggle (+ToggleGroup),
// Menubar, and Collapsible — have also all shipped now, see /opinions/context-menu,
// /imitations/toggle, /imitations/toggle-group, /opinions/menubar, and /opinions/collapsible.
export const WEB_CATALOG: CatalogConstruct[] = [];
