import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A component's full prop reference — Prop/Type/Required/Default columns — rendered from already-generated `PropRow[]` data (see apps/docs/scripts/generate-props.mjs), not read from a file by the Packer itself: this package has no dependency on any one consuming app's build output. Used to rebuild this project's own /components/* reference pages through the Packer." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "props-table", heading?: string, rows: PropRow[] }
// PropRow = { name: string, type: string, required: boolean, defaultValue: string | null, description: string | null }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the props-table block:" }],
  },
  {
      type: "props-table",
      heading: "Example props",
      rows: [
        {
          name: "variant",
          type: "\"primary\" | \"secondary\"",
          required: false,
          defaultValue: "\"secondary\"",
          description: null,
        },
        {
          name: "onClick",
          type: "() => void",
          required: true,
          defaultValue: null,
          description: null,
        },
      ],
    },
];

export default function PropsTablePage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Props Table</Heading>
      <Text color="secondary">{"A component's full prop reference — Prop/Type/Required/Default columns — rendered from already-generated `PropRow[]` data (see apps/docs/scripts/generate-props.mjs), not read from a file by the Packer itself: this package has no dependency on any one consuming app's build output. Used to rebuild this project's own /components/* reference pages through the Packer."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
