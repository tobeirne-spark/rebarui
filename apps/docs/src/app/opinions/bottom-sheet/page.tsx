import { BottomSheet, Button, Heading, Stack, Text } from "rebar-ui";
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
        code: `<BottomSheet\n  trigger={<Button>Share</Button>}\n  title="Share this listing"\n  footer={<Button variant="secondary">Copy link</Button>}\n>\n  <Text size="sm">Send this listing to a friend or post it to your feed.</Text>\n</BottomSheet>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["BottomSheet"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: '`Drawer` fixed to `side="bottom"`, so it inherits the same Radix Dialog wiring: `role="dialog"` with `aria-modal="true"`, focus trapped while open, Esc closes it, backdrop click closes it. The drag handle at the top is purely decorative (`aria-hidden="true"`, not a real element) — real touch-drag-to-dismiss physics is a separate, harder problem left out on purpose. Dismissal always works via the visible close button, Esc, or backdrop click — never drag-only (ref/HEURISTICS.md #38).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="bottom-sheet"` on the panel; `data-rebar-part="handle"` on the decorative drag handle, plus every `data-rebar-part` `Drawer` itself carries (`"header"|"title"|"description"|"body"|"footer"|"close"`).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD (the web-focused library) has no direct equivalent — a bottom sheet with a drag handle is a mobile-native pattern from libraries like antd-mobile, Ionic, or native iOS/Android, not antd proper. Migrating this away typically means antd's own `Drawer` with `placement=\"bottom\"`, dropping the decorative handle (antd's Drawer has none).",
      },
    ],
  },
];

export default function BottomSheetPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>BottomSheet</Heading>
      <Text color="secondary">
        A <code>Drawer</code> fixed to the bottom edge, with a visible drag handle — the mobile
        "sheet that slides up" pattern, built on the exact same Dialog wiring underneath.
      </Text>

      <LivePreview>
        <BottomSheet
          trigger={<Button>Share</Button>}
          title="Share this listing"
          footer={<Button variant="secondary">Copy link</Button>}
        >
          <Text size="sm">Send this listing to a friend or post it to your feed.</Text>
        </BottomSheet>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
