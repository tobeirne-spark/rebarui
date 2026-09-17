"use client";

import { Button, Heading, Popconfirm, Stack, Text } from "rebar-ui";
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
        code: '<Popconfirm\n  trigger={<Button variant="destructive">Delete</Button>}\n  title="Delete this item?"\n  description="This can\'t be undone."\n  destructive\n  onConfirm={() => {}}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Popconfirm"] ?? [] },
  {
    type: "doc-section",
    heading: "Lighter than a full Dialog",
    body: [
      {
        kind: "text",
        text: "Pure composition of the real `Popover`, `Text`, and `Button` — no reimplemented positioning or modal logic. For a single yes/no confirmation attached right at the trigger, this is a lighter-weight affordance than a full centered `Dialog` — reach for `Dialog` when the confirmation needs more content or its own focus-trapped modal treatment.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="popconfirm"`; parts: `title`, `description`, `actions`, `cancel`, `confirm`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's own `Popconfirm` is a close direct equivalent — `title`/`description`/`onConfirm`/`onCancel` map directly; `confirmLabel`/`cancelLabel` map to AntD's `okText`/`cancelText`.",
      },
    ],
  },
];

export default function PopconfirmPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Popconfirm</Heading>
      <Text color="secondary">
        An inline "are you sure?" confirmation attached to a trigger — lighter than a full{" "}
        <code>Dialog</code>.
      </Text>

      <Popconfirm
        trigger={<Button variant="destructive">Delete</Button>}
        title="Delete this item?"
        description="This can't be undone."
        destructive
        onConfirm={() => {}}
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
