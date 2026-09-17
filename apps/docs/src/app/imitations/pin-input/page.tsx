import { Heading, PinInput, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [{ kind: "code", code: '<PinInput length={6} onComplete={(code) => verify(code)} />' }],
  },
  { type: "props-table", heading: "Props", rows: componentProps["PinInput"] ?? [] },
  {
    type: "doc-section",
    heading: "Behavior",
    body: [
      {
        kind: "list",
        items: [
          "Typing a digit auto-advances focus to the next box",
          "Backspace on an empty box moves focus back to the previous one",
          "Pasting a full code splits it across every box starting from the focused one",
          "`onComplete` fires once, only when every box is filled",
        ],
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'The whole set is a real `role="group"` with a label; each box is labeled `Digit N of length` for screen readers, since a bare unlabeled sequence of inputs gives no sense of position or total count.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: '`data-rebar-component="pin-input"`; `data-rebar-part="digit"` on each box.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD's `Input.OTP` is the closest equivalent, with a different prop shape (a single `length` and `formatter` rather than this component's per-box rendering).",
      },
    ],
  },
];

export default function PinInputPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>PinInput</Heading>
      <Text color="secondary">
        Segmented single-digit boxes for a confirmation code — a plain text input gives no visual
        sense of how many digits are expected or how many have been entered so far.
      </Text>

      <LivePreview>
        <PinInput length={6} />
      </LivePreview>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          Set <code>mask</code> for a PIN/security-code entry where the digits shouldn&apos;t stay
          visible on screen (each box renders as a real <code>type=&quot;password&quot;</code>{" "}
          input, not just a visually-obscured overlay).
        </Text>
        <LivePreview>
          <PinInput length={4} mask />
        </LivePreview>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
