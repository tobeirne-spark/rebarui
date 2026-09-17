import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [{ kind: "code", code: "<Heading level={2}>Section title</Heading>" }],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Heading"] ?? [] },
  {
    type: "doc-section",
    heading: "A real semantic heading, not a styled Text",
    body: [
      {
        kind: "text",
        text: '`level` (1-3) renders a real `<h1>`/`<h2>`/`<h3>` — a genuine document-outline element, not `Text` with bigger font-size, so screen-reader heading navigation and browser outline tools see it correctly. Every page on this site uses exactly one `level={1}` (the page title) and nests `level={2}`/`level={3}` for its own sections, the same convention this component\'s own docs pages follow.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="heading"`, `data-rebar-level` set to the current level.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: 'Not codemod-covered — AntD\'s `Typography.Title` covers the same role with a `level` prop (1-5).',
      },
    ],
  },
];

export default function HeadingPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Heading</Heading>
      <Text color="secondary">
        A real semantic heading element — <code>level</code> renders a genuine{" "}
        <code>&lt;h1&gt;</code>/<code>&lt;h2&gt;</code>/<code>&lt;h3&gt;</code>, not styled text.
      </Text>

      <LivePreview>
        <Stack gap="sm">
          <Heading level={1}>Level 1</Heading>
          <Heading level={2}>Level 2</Heading>
          <Heading level={3}>Level 3</Heading>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
