import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A vertical stack of title+badge rows — a lighter-weight alternative to table for a simple list of named items." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "data-list", items: { title: string, badge?: string }[] }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the data-list block:" }],
  },
  {
      type: "data-list",
      items: [
        {
          title: "Marketing Site Redesign",
          badge: "Active",
        },
        {
          title: "Legacy API Migration",
          badge: "Archived",
        },
      ],
    },
];

export default function DataListPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Data List</Heading>
      <Text color="secondary">{"A vertical stack of title+badge rows — a lighter-weight alternative to table for a simple list of named items."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
