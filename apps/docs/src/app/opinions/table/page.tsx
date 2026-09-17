import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A bordered data table with exactly the columns you give it — no hidden 'show all fields' default. Rows may carry a per-row action button. Wraps the real Table component (sortable columns, on by default) — not a bare hand-rolled <table>, an original gap this block has since been fixed to close. searchPlaceholder adds a box matching any cell; filters adds named exact-match dropdowns, collapsing past 2 into a 'More filters' popover (the same bounded-then-collapse convention nav-bar's own overflow uses). addable/exportable/copyable add a real, working Add-row form, Export-CSV download, and clipboard Copy button — added rows are local-only (not persisted, the same convention card-kanban's board state already uses)." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "table", columns: string[], rows: { cells: string[], actionLabel?: string }[], sortable?: boolean, searchPlaceholder?: string, filters?: { label: string, columnIndex: number, options: string[] }[], addable?: boolean | { label?: string }, exportable?: boolean, copyable?: boolean }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the table block:" }],
  },
  {
      type: "table",
      columns: [
        "Team",
        "Lead",
        "Status",
      ],
      searchPlaceholder: "Search teams...",
      filters: [
        {
          label: "Status",
          columnIndex: 2,
          options: [
            "Active",
            "Archived",
          ],
        },
      ],
      addable: {
        label: "Add team",
      },
      exportable: true,
      copyable: true,
      rows: [
        {
          cells: [
            "Engineering",
            "Priya Shah",
            "Active",
          ],
          actionLabel: "Select",
        },
        {
          cells: [
            "Design",
            "Marcus Webb",
            "Active",
          ],
          actionLabel: "Select",
        },
        {
          cells: [
            "Platform",
            "Jordan Lee",
            "Archived",
          ],
          actionLabel: "Select",
        },
      ],
    },
];

export default function TablePage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Table</Heading>
      <Text color="secondary">{"A bordered data table with exactly the columns you give it — no hidden 'show all fields' default. Rows may carry a per-row action button. Wraps the real Table component (sortable columns, on by default) — not a bare hand-rolled <table>, an original gap this block has since been fixed to close. searchPlaceholder adds a box matching any cell; filters adds named exact-match dropdowns, collapsing past 2 into a 'More filters' popover (the same bounded-then-collapse convention nav-bar's own overflow uses). addable/exportable/copyable add a real, working Add-row form, Export-CSV download, and clipboard Copy button — added rows are local-only (not persisted, the same convention card-kanban's board state already uses)."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
