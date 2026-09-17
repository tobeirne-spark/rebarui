import { Box, Heading, NavIndex, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const ITEMS = [
  { label: "All components", href: "#" },
  { label: "Avatar", href: "#", category: "web" },
  { label: "Button", href: "#", category: "web" },
  { label: "Carousel", href: "#", category: "web" },
  { label: "Dialog", href: "#", category: "web" },
  { label: "Divider", href: "#", category: "web" },
  { label: "Empty", href: "#", category: "web" },
  { label: "Action Sheet", href: "#", category: "mobile", status: "Planned" },
  { label: "Bottom Sheet", href: "#", category: "mobile", status: "Planned" },
  { label: "Pull-to-Refresh", href: "#", category: "mobile", status: "Planned" },
  { label: "Gantt Chart", href: "#", category: "diagram", status: "Planned" },
  { label: "Node-Link Graph", href: "#", category: "diagram", status: "Planned" },
  { label: "Sankey Diagram", href: "#", category: "diagram", status: "Planned" },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<NavIndex items={[{ label: "Avatar", href: "/imitations/avatar", category: "web" }, { label: "Action Sheet", href: "/planned/action-sheet", category: "mobile", status: "Planned" }]} categoryLabels={{ web: "Web", mobile: "Mobile" }} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["NavIndex"] ?? [] },
  {
    type: "doc-section",
    heading: "Two things this component exists to get right",
    body: [
      {
        kind: "list",
        items: [
          "An un-categorized item (no `category` field) always renders above the filterable list, in bold, untouched by search or category state — a real navigation link, not the same thing as the \"All\" category chip beside it, even when the two are worded almost identically (see [Design Heuristics](/about/agent#storage-context) heuristic #4).",
          'A `status` on any item ("Planned", "Deprecated") renders as a real `Tag` pill next to its label — never appended into the label string itself. See [Design Heuristics](/about/agent) heuristic #41: a status is metadata about the item, not part of its name.',
        ],
      },
      {
        kind: "text",
        text: "Search and category chips only appear once the list passes 12 items — a short list doesn't need filter chrome, and showing one anyway is chrome with nothing to justify it (see [Design Heuristics](/about/agent#ia-pyramid), heuristic #11). Try searching or filtering the live example below.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'A real `<nav aria-label>` landmark; category chips are real `<button aria-pressed>` elements, not styled `<div>`s; every item (overview or filtered) is a real link via `renderLink`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="nav-index"`; `data-rebar-part` is `"controls"`, `"search"`, `"chips"`, `"chip"` (with `data-rebar-active` on the selected one), `"overview-item"`, `"item"`, and `"empty"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD has no single direct equivalent; a `Menu` with a controlled `Input.Search` above it and manual filtering is the closest structural match, but the search/category-threshold behavior isn't a prop AntD ships.",
      },
    ],
  },
];

export default function NavIndexPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>NavIndex</Heading>
      <Text color="secondary">
        A vertical index of links — a search box and category chips that only appear once the list
        is long enough to need them, then the filtered list itself. Built after this exact shape
        got hand-rolled independently twice on this site&apos;s own component-catalog and{" "}
        <code>/docs</code> sidebars — now a real component instead of page-local duplication.
      </Text>

      <Box
        style={{
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
          width: 260,
        }}
      >
        <NavIndex
          items={ITEMS}
          categoryLabels={{ web: "Web", mobile: "Mobile", diagram: "Diagram" }}
        />
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
