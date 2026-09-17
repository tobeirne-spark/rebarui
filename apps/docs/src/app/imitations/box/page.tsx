import { Box, Heading, Stack, Text } from "rebar-ui";
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
        code: '<Box as="section" style={{ padding: 16, border: "1px solid var(--rebar-color-border)" }}>\n  Arbitrary content\n</Box>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Box"] ?? [] },
  {
    type: "doc-section",
    heading: "The generic escape hatch",
    body: [
      {
        kind: "text",
        text: "A plain `<div>` by default, or any tag via `as` — the polymorphic-`as` convention `Text`/`Heading` also use. Every other component (and a consuming app) reaches for this for one-off layout, table cells, or custom prose that doesn't warrant its own named component. Accepts every native attribute for whatever `as` resolves to, plus this library's own bionic-reading support — automatically skipped for code-like tags (`code`/`pre`/`kbd`/`samp`), since bionic-splitting an identifier or keyword doesn't aid reading, it misrepresents the text.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: 'None — `Box` is a bare, unstyled wrapper by design; it carries no `data-rebar-component`.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — `Box` has no direct AntD equivalent; migrating means replacing it with a plain HTML element or AntD's own layout primitives depending on context.",
      },
    ],
  },
];

export default function BoxPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Box</Heading>
      <Text color="secondary">
        The generic layout escape hatch — a plain <code>&lt;div&gt;</code> by default, or any tag
        via <code>as</code>.
      </Text>

      <LivePreview>
        <Stack gap="sm">
          <Box style={{ padding: 16, border: "1px solid var(--rebar-color-border)", borderRadius: 4 }}>
            A plain Box (div)
          </Box>
          <Box as="section" style={{ padding: 16, background: "var(--rebar-color-bg-secondary)", borderRadius: 4 }}>
            A Box rendered as a real &lt;section&gt;
          </Box>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
