"use client";

import { useState } from "react";
import { Button, Heading, Stack, Text, Toast, ToastProvider } from "rebar-ui";
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
        code: '<ToastProvider>\n  {/* mount once at the app root */}\n  <Toast open={open} onOpenChange={setOpen} type="success" title="Saved" description="Your changes were saved." />\n</ToastProvider>',
      },
    ],
  },
  { type: "props-table", heading: "Toast props", rows: componentProps["Toast"] ?? [] },
  {
    type: "doc-section",
    heading: "ToastProvider mounts once, at the app root",
    body: [
      {
        kind: "text",
        text: '`ToastProvider` wraps the whole app once — the real Radix pattern — and renders the actual viewport every `<Toast>` elsewhere in the tree portals into. `Toast` itself is controlled (`open`/`onOpenChange`), auto-dismissing after `duration` ms, with a real close button. `type` (`info`/`success`/`warning`/`error`) sets the tone.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="toast-viewport"` on the provider\'s viewport; `data-rebar-component="toast"` with `data-rebar-type` on each toast; parts: `title`, `description`, `close`.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: 'AntD\'s `message`/`notification` are imperative function calls rather than a mounted, controlled component — a real, structural difference, not just a prop rename.' },
    ],
  },
];

export default function ToastPage() {
  const [open, setOpen] = useState(false);

  return (
    <Stack gap="lg">
      <Heading level={1}>Toast</Heading>
      <Text color="secondary">
        A real Radix toast — <code>ToastProvider</code> mounts once at the app root; each{" "}
        <code>Toast</code> is a controlled, auto-dismissing notification.
      </Text>

      <LivePreview>
        <ToastProvider>
          <Button onClick={() => setOpen(true)}>Show toast</Button>
          <Toast
            open={open}
            onOpenChange={setOpen}
            type="success"
            title="Saved"
            description="Your changes were saved."
            duration={3000}
          />
        </ToastProvider>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
