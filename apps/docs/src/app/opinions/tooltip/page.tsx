import { Button, Heading, Stack, Text, Tooltip } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      { kind: "code", code: '<Tooltip content="Saves your changes">\n  <Button>Save</Button>\n</Tooltip>' },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Tooltip"] ?? [] },
  {
    type: "doc-section",
    heading: "A real Radix tooltip",
    body: [
      {
        kind: "text",
        text: '`children` must be a single element (wrapped via `asChild`, not cloned or spread) — the same "wrap, don\'t clone" convention `ContextMenu` uses for its own trigger region. Shows on hover or keyboard focus, not just mouse hover, so a keyboard user reaches the same information a mouse user sees.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: '`data-rebar-component="tooltip"` on the popover content.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: "AntD's `Tooltip` takes the same `content`-as-a-prop-wrapping-children shape (`title` instead of `content`) — a close, low-risk rename." },
    ],
  },
];

export default function TooltipPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Tooltip</Heading>
      <Text color="secondary">
        A real Radix tooltip — shows on hover or keyboard focus, not mouse-only.
      </Text>

      <LivePreview>
        <Tooltip content="Saves your current changes">
          <Button>Save</Button>
        </Tooltip>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
