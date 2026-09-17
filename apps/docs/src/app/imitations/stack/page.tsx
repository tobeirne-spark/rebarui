import { Box, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

function Swatch({ children }: { children: string }) {
  return (
    <Box
      style={{
        padding: "8px 12px",
        background: "var(--rebar-color-bg-secondary)",
        border: "1px solid var(--rebar-color-border)",
        borderRadius: 4,
      }}
    >
      {children}
    </Box>
  );
}

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Stack direction="row" gap="md" justify="between" align="center">\n  <Swatch>One</Swatch>\n  <Swatch>Two</Swatch>\n</Stack>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Stack"] ?? [] },
  {
    type: "doc-section",
    heading: "The layout primitive almost every other component composes with",
    body: [
      {
        kind: "text",
        text: '`direction="column"` (default) or `"row"`; `gap` is a real spacing-token scale (`xs`-`2xl`), never a raw pixel value, so every stack in the library shares the same rhythm. `align`/`justify` map directly onto `align-items`/`justify-content` — `justify="between"` is what every "header row with actions on the right" pattern sitewide uses (see `Box`\'s own docs page above, or any component\'s toolbar).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: '`data-rebar-component="stack"`, `data-rebar-direction` set to the current direction.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD's `Space`/`Flex` are the closest structural equivalents (`Flex` maps almost directly onto `direction`/`gap`/`align`/`justify`), a close, low-risk manual rename.",
      },
    ],
  },
];

export default function StackPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Stack</Heading>
      <Text color="secondary">
        A flexbox row or column with a real spacing-token gap — the layout primitive nearly every
        other component in this library is built from.
      </Text>

      <LivePreview>
        <Stack gap="lg">
          <Stack direction="row" gap="sm">
            <Swatch>Row</Swatch>
            <Swatch>gap=&quot;sm&quot;</Swatch>
          </Stack>
          <Stack direction="row" gap="md" justify="between" style={{ width: "100%" }}>
            <Swatch>justify=&quot;between&quot;</Swatch>
            <Swatch>pushes apart</Swatch>
          </Stack>
          <Stack direction="column" gap="xs">
            <Swatch>Column</Swatch>
            <Swatch>gap=&quot;xs&quot;</Swatch>
          </Stack>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
