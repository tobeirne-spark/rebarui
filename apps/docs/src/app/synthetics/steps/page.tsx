"use client";

import { useState } from "react";
import { Button, Heading, Stack, Steps, Text } from "rebar-ui";
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
        code: '<Steps\n  current={1}\n  items={[\n    { title: "Team" },\n    { title: "Details", description: "Fill in employee info" },\n    { title: "Review" },\n  ]}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Steps"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: '`current` (an index) derives each step\'s status automatically — before it is "finish" (✓), at it is "process", after it is "wait" — the active step is marked `aria-current="step"`. Any item can set its own `status` (including `"error"`) to override the derived value.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="steps"`, `data-rebar-direction`, `data-rebar-part="item" | "icon" | "content"`, `data-rebar-status="wait" | "process" | "finish" | "error"` on each item.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's `Steps` takes the same `items`/`current`/`direction` shape almost verbatim — one of the closest matches on this page, not yet codemod-covered.",
      },
    ],
  },
];

const HORIZONTAL_ITEMS = [
  { title: "Team" },
  { title: "Details", description: "Fill in employee info" },
  { title: "Review" },
];

function HorizontalDemo() {
  const [current, setCurrent] = useState(1);

  return (
    <Stack gap="sm">
      <Steps current={current} items={HORIZONTAL_ITEMS} />
      <Stack direction="row" gap="sm" align="center">
        <Button
          variant="secondary"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          Back
        </Button>
        <Button
          variant="secondary"
          onClick={() => setCurrent((c) => Math.min(HORIZONTAL_ITEMS.length - 1, c + 1))}
          disabled={current === HORIZONTAL_ITEMS.length - 1}
        >
          Next
        </Button>
        <Text size="sm" color="secondary">
          current = {current} — click Back/Next to watch each step's status flip between finish
          (✓), process, and wait as it moves.
        </Text>
      </Stack>
    </Stack>
  );
}

export default function StepsPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Steps</Heading>
      <Text color="secondary">
        A numbered progress indicator for a multi-stage flow. Pass <code>current</code> and every
        step&apos;s finish/process/wait state is derived automatically.
      </Text>

      <Stack gap="sm">
        <Text size="sm" color="secondary">
          Horizontal, with a description on the middle step — <code>current</code> is interactive
          here, so you can see the derived status change live.
        </Text>
        <LivePreview>
          <HorizontalDemo />
        </LivePreview>
      </Stack>

      <Stack gap="sm">
        <Text size="sm" color="secondary">
          Vertical, with the middle step&apos;s status manually overridden to{" "}
          <code>&quot;error&quot;</code> — an explicit <code>status</code> always wins over the
          derived one, so a failed step doesn&apos;t block the rest of the flow from reading
          correctly.
        </Text>
        <LivePreview>
          <Steps
            direction="vertical"
            current={1}
            items={[
              { title: "Order placed" },
              { title: "Payment failed", status: "error" },
              { title: "Shipped" },
            ]}
          />
        </LivePreview>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
