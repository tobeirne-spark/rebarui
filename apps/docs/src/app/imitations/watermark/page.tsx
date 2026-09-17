import { AspectRatio, Box, Card, Heading, Stack, Text, Watermark } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Watermark text="CONFIDENTIAL">\n  <Card title="Q3 roadmap">...</Card>\n</Watermark>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Watermark"] ?? [] },
  {
    type: "doc-section",
    heading: "CSS, not canvas",
    body: [
      {
        kind: "text",
        text: "Built from a plain inline SVG data URI tiled via CSS `background-repeat`, not a canvas-rendered image. Stays crisp at any size (SVG scales natively) and renders correctly during SSR with no `useEffect`/ref measurement pass — the overlay is present in the very first render, not added a frame later.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Also available as a prop",
    body: [
      {
        kind: "text",
        text: "`Card` and `AspectRatio` both take a `watermark` prop that wraps their own content in this component internally — the two most common places a real watermark is needed (a document/content card, a licensed or draft image) don't need the caller to reach for `Watermark` directly.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="watermark"` on the root; the overlay itself carries `data-rebar-part="overlay"` and `aria-hidden="true"` — it never blocks interaction with, or gets announced as part of, the real content.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's own `Watermark` is a close structural match (`content`/`image`/`gap`/`rotate`/`font`) — a migration maps these props across directly.",
      },
    ],
  },
];

export default function WatermarkPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Watermark</Heading>
      <Text color="secondary">
        A repeating diagonal watermark overlaid on its children — real content protection or
        attribution, not decoration.
      </Text>

      <Stack direction="row" gap="lg" style={{ flexWrap: "wrap" }}>
        <Box style={{ width: 280 }}>
          <Watermark text="CONFIDENTIAL">
            <Card title="Q3 roadmap">Internal planning notes — not for distribution.</Card>
          </Watermark>
        </Box>
        <Box style={{ width: 200 }}>
          <AspectRatio ratio={4 / 3} placeholder watermark="© Rebar UI" />
        </Box>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
