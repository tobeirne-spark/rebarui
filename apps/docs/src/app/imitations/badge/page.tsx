import { Badge, Box, Heading, Stack, Text } from "rebar-ui";
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
        code: '<Badge count={5}>\n  <MailIcon />\n</Badge>\n<Badge dot tone="success">\n  <Avatar fallback="AL" />\n</Badge>\n<Badge count={0} showZero>...</Badge>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Badge"] ?? [] },
  {
    type: "doc-section",
    heading: "Emoji/icon badges — one content prop, not a separate mode",
    body: [
      {
        kind: "text",
        text: 'A `content` prop overrides the indicator with any glyph — a plain emoji character (`"🔥"`) or a small icon element from the shared `icons.tsx` set — instead of a numeric count. Deliberately not a separate "emoji mode": once the project had a real icon system (ref/HEURISTICS.md 1.4), any small glyph is just content the same indicator shell renders, matching the precedent (Simple Kanban cards using emoji badges) that originally prompted this ask. `content` takes priority over `count`/`dot` when supplied, and shows regardless of `showZero` — there\'s no "zero" concept for a decorative glyph.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: "The indicator is a plain positioned `<span>`, not announced separately from its wrapped content by default — a count that changes meaningfully (e.g. unread messages) should be paired with an `aria-live` region elsewhere on the page if it needs to be announced, since `Badge` itself doesn't assume that's always wanted.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="badge"`, `data-rebar-part="indicator"` (only on the wrapped-children form), `data-rebar-tone`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD's `Badge` uses `status`/`color` props with different semantics than this `tone` union, and its `count`/`overflowCount` map to this component's `count`/`max` (a rename, not a structural change).",
      },
    ],
  },
];

export default function BadgePage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Badge</Heading>
      <Text color="secondary">
        A small count or status indicator, positioned in the corner of whatever it wraps. With no
        children, renders as a standalone indicator instead — useful inside a list row rather than
        overlaid on an icon.
      </Text>

      <LivePreview>
        <Stack direction="row" gap="xl" style={{ alignItems: "center" }}>
          <Badge count={5}>
            <Box
              style={{
                width: 40,
                height: 40,
                border: "1px solid var(--rebar-color-border, #e0e0e0)",
                borderRadius: 4,
              }}
            />
          </Badge>
          <Badge count={0} showZero>
            <Box
              style={{
                width: 40,
                height: 40,
                border: "1px solid var(--rebar-color-border, #e0e0e0)",
                borderRadius: 4,
              }}
            />
          </Badge>
          <Badge count={150}>
            <Box
              style={{
                width: 40,
                height: 40,
                border: "1px solid var(--rebar-color-border, #e0e0e0)",
                borderRadius: 4,
              }}
            />
          </Badge>
          <Badge dot tone="success">
            <Box
              style={{
                width: 40,
                height: 40,
                border: "1px solid var(--rebar-color-border, #e0e0e0)",
                borderRadius: 4,
              }}
            />
          </Badge>
          <Badge content="🔥">
            <Box
              style={{
                width: 40,
                height: 40,
                border: "1px solid var(--rebar-color-border, #e0e0e0)",
                borderRadius: 4,
              }}
            />
          </Badge>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
