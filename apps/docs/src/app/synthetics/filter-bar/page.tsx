import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A search input plus an optional filter select and a trailing primary action button, all in one row." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "filter-bar", searchPlaceholder?: string, filterLabel?: string, filterOptions?: string[], actionLabel?: string }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the filter-bar block:" }],
  },
  {
      type: "filter-bar",
      searchPlaceholder: "Search projects…",
      filterOptions: [
        "All",
        "Active",
        "Archived",
      ],
      actionLabel: "New Project",
    },
];

export default function FilterBarPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Filter Bar</Heading>
      <Text color="secondary">{"A search input plus an optional filter select and a trailing primary action button, all in one row."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
