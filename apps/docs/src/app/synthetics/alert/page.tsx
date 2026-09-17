import { Alert, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [{ kind: "code", code: '<Alert type="warning" title="Heads up">Some fields are incomplete.</Alert>' }],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Alert"] ?? [] },
  {
    type: "doc-section",
    heading: "A boxed, inline message — distinct from NoticeBar and Toast",
    body: [
      {
        kind: "text",
        text: '`type` (`info`/`success`/`warning`/`error`) sets the tone and, for `error`/`warning`, a real `role="alert"` (otherwise `role="status"`) — the accessibility distinction between "must interrupt" and "just informational" content. Distinct from `NoticeBar` (a persistent full-width strip pinned at the top of a view) and `Toast` (an ephemeral overlay) — `Alert` sits inline in normal page content.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="alert"` with `data-rebar-type` set to the current type; `data-rebar-part="title"`, `"description"`.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: 'AntD\'s `Alert` takes the same `type` values and a `message`/`description` split (this component uses `title`/`children`) — a close, low-risk rename.' },
    ],
  },
];

export default function AlertPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Alert</Heading>
      <Text color="secondary">
        A boxed, inline message — sits in normal page content, distinct from the persistent{" "}
        <code>NoticeBar</code> and the ephemeral <code>Toast</code>.
      </Text>

      <LivePreview>
        <Stack gap="sm">
          <Alert type="info" title="Note">
            This form auto-saves every 30 seconds.
          </Alert>
          <Alert type="warning" title="Heads up">
            Some fields are incomplete.
          </Alert>
          <Alert type="error" title="Something went wrong">
            Couldn&apos;t save your changes. Try again.
          </Alert>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
