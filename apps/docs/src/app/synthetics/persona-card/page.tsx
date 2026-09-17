import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A row of identity cards — avatar + name + optional meta line. Catalogued as \"Persona / User Card\" and flagged at catalogue time as \"arguably an Avatar+Text composition, not a new primitive\" — exactly the case for a block: no new component needed, just a fixed layout of two that already ship." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "persona-card", items: { name: string, meta?: string, avatarSrc?: string, avatarPlaceholder?: boolean }[] }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the persona-card block:" }],
  },
  {
      type: "persona-card",
      items: [
        {
          name: "Priya Shah",
          meta: "Engineering lead",
          avatarPlaceholder: true,
        },
        {
          name: "Marcus Webb",
          meta: "Design",
          avatarPlaceholder: true,
        },
      ],
    },
];

export default function PersonaCardPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Persona Card</Heading>
      <Text color="secondary">{"A row of identity cards — avatar + name + optional meta line. Catalogued as \"Persona / User Card\" and flagged at catalogue time as \"arguably an Avatar+Text composition, not a new primitive\" — exactly the case for a block: no new component needed, just a fixed layout of two that already ship."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
