import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      { kind: "code", code: '<Text size="sm" color="secondary" as="span">Helper text</Text>' },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Text"] ?? [] },
  {
    type: "doc-section",
    heading: "The default prose element",
    body: [
      {
        kind: "text",
        text: 'Renders a real `<p>` by default (`as` swaps it for any tag — `span`, `label`, `li`) with two independent scales: `size` (`xs`/`sm`/`md`) and `color` (`primary`/`secondary`). Bionic-reading wired the same way as every other text-bearing component: `bionic`/`bionicOptions` override the ambient `data-rebar-bionic` setting per instance.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="text"`, `data-rebar-size`/`data-rebar-color` set to the current values.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: 'Not codemod-covered — AntD\'s `Typography.Text` covers the same "small, secondary, inline text" role with a similar `type` prop for color.',
      },
    ],
  },
];

export default function TextPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Text</Heading>
      <Text color="secondary">
        The default prose element — a real <code>&lt;p&gt;</code> by default, with a size and color
        scale.
      </Text>

      <LivePreview>
        <Stack gap="xs">
          <Text size="md">Default size, primary color.</Text>
          <Text size="sm" color="secondary">
            Small, secondary — the common helper-text look.
          </Text>
          <Text size="xs" color="secondary" as="span">
            Extra-small, rendered as a real span instead of a paragraph.
          </Text>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
