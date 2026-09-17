import { Button, Heading, Popover, Stack, Text } from "rebar-ui";
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
        code: '<Popover trigger={<Button>Filters</Button>}>\n  <p>Filter options</p>\n</Popover>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Popover"] ?? [] },
  {
    type: "doc-section",
    heading: "Popover vs. HoverCard",
    body: [
      {
        kind: "text",
        text: 'Click-triggered, dismissed by an explicit click-outside or Escape — the right choice for something a viewer deliberately opened and is actively using (a filter panel, `NavBar`\'s overflow menu). It never closes just because the pointer drifted off it, which would be a real usability bug for content someone clicked to open. For hover-previewed supplementary content that should auto-dismiss shortly after the pointer leaves, use [HoverCard](/opinions/hover-card) instead — a genuinely different interaction model, not a variant of this one.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: "Real Radix `Popover` underneath: focus moves into the panel on open and returns to the trigger on close, Escape closes it, and a click outside closes it. `role` and focus trapping come from Radix, not reimplemented here.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="popover"` on the content panel.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD's `Popover` takes `content`/`title` props directly rather than a `children`-as-panel-content shape, so mapping this over is a structural change, not a rename.",
      },
    ],
  },
];

export default function PopoverPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Popover</Heading>
      <Text color="secondary">
        A click-triggered floating panel anchored to a trigger element — real Radix Popover
        underneath (focus trap, Escape-to-close, click-outside-to-close).
      </Text>

      <LivePreview>
        <Popover trigger={<Button variant="secondary">Filters</Button>}>
          <Stack gap="sm" style={{ minWidth: 160 }}>
            <Text size="sm" style={{ fontWeight: "var(--rebar-font-weight-semibold)" }}>
              Filter by status
            </Text>
            <Text size="sm" color="secondary">
              Active, Archived, Draft
            </Text>
          </Stack>
        </Popover>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
