"use client";

import { useState } from "react";
import { Button, Heading, NumberKeyboard, Stack, Text } from "rebar-ui";
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
        code: '<NumberKeyboard open={open} onOpenChange={setOpen} onInput={(d) => setPin(p => p + d)} onDelete={() => setPin(p => p.slice(0, -1))} randomOrder />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["NumberKeyboard"] ?? [] },
  {
    type: "doc-section",
    heading: "Presentational only — the caller owns the PIN state",
    body: [
      {
        kind: "text",
        text: 'A real `BottomSheet` holding a numeric keypad, typically paired with `PinInput` for secure entry that shouldn\'t invoke the device\'s own native keyboard. This component holds no PIN state itself — it only emits `onInput`/`onDelete`/`onConfirm`, the same "presentational, caller owns the data" convention `FileUpload`/`ChatThread` already follow. `randomOrder` shuffles the 0-9 digit positions each time it opens — a real security feature against shoulder-surfing or a compromised screen recording that relies on remembering key *positions* rather than values.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="number-keyboard"` on the keypad grid (the sheet itself carries `BottomSheet`\'s own `data-rebar-component="bottom-sheet"`); parts: `key`, `custom-key`, `delete-key`, `confirm`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — the antd-mobile pattern, no direct AntD desktop equivalent (a desktop form just uses the browser's own numeric input).",
      },
    ],
  },
];

export default function NumberKeyboardPage() {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");

  return (
    <Stack gap="lg">
      <Heading level={1}>NumberKeyboard</Heading>
      <Text color="secondary">
        An on-screen numeric keypad presented as a real bottom sheet — pairs with{" "}
        <code>PinInput</code> for secure entry that shouldn&apos;t invoke the device&apos;s own
        native keyboard.
      </Text>

      <LivePreview>
        <Stack gap="md" style={{ alignItems: "flex-start" }}>
          <Text style={{ fontFamily: "monospace", fontSize: "var(--rebar-font-size-xl, 24px)", letterSpacing: "0.3em" }}>
            {pin.padEnd(4, "•").slice(0, 4)}
          </Text>
          <Button onClick={() => setOpen(true)}>Enter PIN</Button>
          <NumberKeyboard
            open={open}
            onOpenChange={setOpen}
            title="Enter PIN"
            onInput={(digit) => setPin((prev) => (prev.length < 4 ? prev + digit : prev))}
            onDelete={() => setPin((prev) => prev.slice(0, -1))}
            onConfirm={() => setOpen(false)}
            confirmLabel="Done"
            randomOrder
          />
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
