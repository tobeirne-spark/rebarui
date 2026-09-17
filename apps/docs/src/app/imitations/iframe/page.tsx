import { Heading, Iframe, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [{ kind: "code", code: '<Iframe src="https://example.com" title="Example embed" height={200} />' }],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Iframe"] ?? [] },
  {
    type: "doc-section",
    heading: "A required accessible name",
    body: [
      {
        kind: "text",
        text: '`title` is required, not optional like the native `<iframe>` attribute — an iframe with no accessible name is a real, common accessibility gap (a screen reader has nothing to announce for the embedded content otherwise). Deliberately thin beyond that: no default border/height, since those depend entirely on context — the `comparison` block (see [Orders](/orders#comparison)) wraps this in its own bordered panel and measures a height for it.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: '`data-rebar-component="iframe"` on the element itself.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: "Not codemod-covered — AntD has no dedicated iframe wrapper component; migrating means dropping back to a plain native `<iframe>` with its own required `title`." },
    ],
  },
];

export default function IframePage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Iframe</Heading>
      <Text color="secondary">
        A real <code>&lt;iframe&gt;</code> with one required addition: a real accessible{" "}
        <code>title</code>.
      </Text>

      <LivePreview>
        <Iframe
          src="https://example.com"
          title="Example embed"
          style={{ width: "100%", height: 200, border: "1px solid var(--rebar-color-border)", borderRadius: 4 }}
        />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
