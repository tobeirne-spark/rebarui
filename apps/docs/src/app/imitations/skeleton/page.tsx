import { Heading, Skeleton, Stack, Text } from "rebar-ui";
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
        code: '<Skeleton variant="text" lines={3} />\n<Skeleton variant="avatar" />\n<Skeleton variant="rect" height={120} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Skeleton"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'The whole thing is marked `aria-hidden="true"` — a loading state should be announced once, from an `aria-live` region elsewhere on the page (or via `Spin`\'s own status role), not by making a screen reader read through every placeholder shape.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="skeleton"`, `data-rebar-variant`, `data-rebar-part="line"` on each row of the `text` variant.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD's `Skeleton` composes named sub-components (`Skeleton.Avatar`, `Skeleton.Button`, `Skeleton.Input`) rather than one component with a `variant` prop, so this is a structural rewrite, not a rename.",
      },
    ],
  },
];

export default function SkeletonPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Skeleton</Heading>
      <Text color="secondary">
        A loading placeholder — animated gray shapes standing in for content that hasn&apos;t
        arrived yet. The <code>text</code> variant renders a stack of lines (the last one
        shortened); <code>avatar</code>/<code>button</code>/<code>rect</code> render one shape.
      </Text>

      <LivePreview>
        <Stack direction="row" gap="xl">
          <Stack gap="sm" style={{ width: 200 }}>
            <Skeleton variant="text" lines={3} />
          </Stack>
          <Stack direction="row" gap="sm" style={{ alignItems: "center" }}>
            <Skeleton variant="avatar" />
            <Skeleton variant="button" />
          </Stack>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
