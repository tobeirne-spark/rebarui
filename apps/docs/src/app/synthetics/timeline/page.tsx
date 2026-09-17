import { Heading, Stack, Text, Timeline } from "rebar-ui";
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
        code: '<Timeline\n  items={[\n    { label: "2026-01-01", children: "Order placed" },\n    { label: "2026-01-03", children: "Shipped" },\n    { label: "2026-01-05", children: "Payment failed", tone: "error" },\n  ]}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Timeline"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'A real ordered list (`<ol>`) — each event is a list item, read in document order. The connecting dot is purely decorative (`aria-hidden="true"`); the tone color is not the only signal an error carries — pair it with a label/description that says so in words too.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="timeline"`, `data-rebar-part="item" | "dot" | "content"`, `data-rebar-tone` on each item.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's `Timeline` uses nested `Timeline.Item` children (with a `color` prop) rather than a flat `items` array — a structural rewrite, not a mechanical rename.",
      },
    ],
  },
];

export default function TimelinePage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Timeline</Heading>
      <Text color="secondary">
        A vertical sequence of dated or labeled events — an order history, an activity log, a
        changelog. Each item can carry its own tone.
      </Text>

      <LivePreview>
        <Timeline
          items={[
            { label: "2026-01-01", children: "Order placed" },
            { label: "2026-01-03", children: "Shipped", tone: "success" },
            { label: "2026-01-05", children: "Payment failed — please update your card", tone: "error" },
          ]}
        />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
