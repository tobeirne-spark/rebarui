import { Divider, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Divider />\n<Divider orientation="vertical" />\n<Divider>Or</Divider>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Divider"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: '`role="separator"`. Per the ARIA spec, horizontal is a separator\'s default orientation, so Radix (correctly) omits `aria-orientation` entirely in that case — it only sets it for `orientation="vertical"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="divider"`; `data-rebar-part="line" | "text"` on the with-text variant\'s two line segments and label.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's `Divider` accepts the same orientation values and a similar text-content pattern (`children` renders inline text on the line) — not yet codemod-covered, but a close, low-risk rename.",
      },
    ],
  },
];

export default function DividerPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Divider</Heading>
      <Text color="secondary">
        A real <code>role=&quot;separator&quot;</code> (Radix underneath). Plain rule by default;
        pass children to render a labeled divider instead — two half-width lines flanking the
        text.
      </Text>

      <LivePreview>
        <Stack gap="md">
          <Text size="sm">Above the divider</Text>
          <Divider />
          <Text size="sm">Below the divider</Text>
          <Divider>Or</Divider>
          <Text size="sm">Below the labeled divider</Text>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
