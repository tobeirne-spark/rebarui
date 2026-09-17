import { Box, Heading, ResizablePanels, Stack, Text } from "rebar-ui";
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
        code: `<ResizablePanels\n  first={<Text>Left panel</Text>}\n  second={<Text>Right panel</Text>}\n  defaultSplit={0.4}\n/>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["ResizablePanels"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'The divider is a real `role="separator"` with `aria-orientation`/`aria-valuenow`/`aria-valuemin`/`aria-valuemax`, fully keyboard-operable (ArrowLeft/ArrowRight when horizontal, ArrowUp/ArrowDown when vertical, Home/End to jump to the min/max split) — not a drag-only control (ref/HEURISTICS.md #38, #48). Its real touch/click hit area is 44px wide even though the visible line is 4px, via padding.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="resizable-panels"`; `data-rebar-part="first-panel"|"divider"|"divider-line"|"second-panel"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD has no built-in resizable-panels/split-pane primitive of its own — a migration typically reaches for a small dedicated library (e.g. `react-resizable-panels` or `allotment`) rather than an antd component.",
      },
    ],
  },
];

export default function ResizablePanelsPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>ResizablePanels</Heading>
      <Text color="secondary">
        Two panels separated by a draggable divider — plain pointer events, no new dependency,
        with full keyboard support.
      </Text>

      <LivePreview>
        <Box style={{ height: 160 }}>
          <ResizablePanels
            defaultSplit={0.4}
            first={
              <Box style={{ padding: "var(--rebar-space-md)", height: "100%" }}>
                <Text size="sm">Left panel</Text>
              </Box>
            }
            second={
              <Box style={{ padding: "var(--rebar-space-md)", height: "100%" }}>
                <Text size="sm">Right panel</Text>
              </Box>
            }
          />
        </Box>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
