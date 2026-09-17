"use client";

import { Ellipsis, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const LONG_TEXT =
  "Rebar UI is a headless-first, intentionally low-fidelity component library, built to be re-skinned into a real design system later without rewriting component structure or breaking tests.";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Ellipsis content={longText} rows={2} expandText="More" collapseText="Less" />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Ellipsis"] ?? [] },
  {
    type: "doc-section",
    heading: "Real measurement, not plain CSS text-overflow",
    body: [
      {
        kind: "text",
        text: 'A binary search against a hidden, off-screen measurer clone (same width/font as the real content) finds the longest substring that fits within `rows` lines — this is what makes `direction="start"`/`"middle"` truncation and an inline expand/collapse affordance possible at all, neither of which plain CSS `text-overflow`/`-webkit-line-clamp` can do. `direction="end"` (the default) is the one case CSS could mostly approximate on its own.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="ellipsis"`; `data-rebar-part="content"|"expand"|"collapse"`.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Ant Design (web) has no direct equivalent — `Typography.Text`'s own `ellipsis` prop only truncates, with no expand/collapse and no `middle`/`start` direction. This ports antd-**mobile**'s `Ellipsis` instead, the closest real match.",
      },
    ],
  },
];

export default function EllipsisPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Ellipsis</Heading>
      <Text color="secondary">
        Truncates text to a fixed number of lines with a real, measured &quot;…&quot; — not plain
        CSS <code>text-overflow</code> — with optional expand/collapse text and a choice of where
        the ellipsis goes.
      </Text>

      <LivePreview>
        <Stack gap="lg">
          <div style={{ maxWidth: 320 }}>
            <Ellipsis content={LONG_TEXT} rows={2} expandText="More" collapseText="Less" />
          </div>
          <div style={{ maxWidth: 320 }}>
            <Ellipsis content={LONG_TEXT} rows={1} direction="middle" />
          </div>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
