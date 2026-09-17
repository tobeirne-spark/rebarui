import { AvatarGroup, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const AVATARS = [
  { fallback: "PS" },
  { fallback: "MW" },
  { fallback: "JL" },
  { fallback: "AK" },
  { fallback: "SO" },
  { fallback: "RT" },
  { fallback: "NB" },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<AvatarGroup avatars={[{ fallback: "PS" }, { fallback: "MW" }, /* ... */]} max={5} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["AvatarGroup"] ?? [] },
  {
    type: "doc-section",
    heading: "Real Avatars, real overflow",
    body: [
      {
        kind: "text",
        text: 'Renders real `Avatar` components with negative-margin overlap — not a hand-rolled stack of circles. Anything past `max` (default 5) collapses into one real overflow `Avatar` whose `fallback` is `"+N"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Also closed a real gap in Avatar itself",
    body: [
      {
        kind: "text",
        text: '`Avatar` previously had neither a `size` prop nor rest-spread `data-*`/`aria-*` passthrough — a real, pre-existing Framework Rule violation, surfaced while building this component (which needed both). `Avatar` now takes `size?: "sm" | "md" | "lg"` and forwards arbitrary props, purely additive — no existing call site changes behavior.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="avatar-group"` on the root; each item is a real `Avatar`, carrying its own attributes.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's own `Avatar.Group` is a close direct equivalent — `avatars`/`max` map to AntD's `children`/`maxCount`.",
      },
    ],
  },
];

export default function AvatarGroupPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>AvatarGroup</Heading>
      <Text color="secondary">
        A stacked, overlapping row of real Avatars, with a real "+N more" overflow.
      </Text>

      <AvatarGroup avatars={AVATARS} max={5} />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
