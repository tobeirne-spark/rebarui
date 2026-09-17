import { Button, Drawer, Heading, Stack, Text } from "rebar-ui";
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
        code: `<Drawer\n  trigger={<Button>Edit shipping address</Button>}\n  side="right"\n  title="Shipping address"\n  description="Where should we send this order?"\n  footer={<>\n    <Button variant="secondary">Cancel</Button>\n    <Button>Save address</Button>\n  </>}\n>\n  <Text size="sm">123 Example St, Springfield</Text>\n</Drawer>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Drawer"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'Built on the same Radix Dialog primitive as `Dialog` — `role="dialog"` with `aria-modal="true"`, focus is trapped inside the panel while open, Esc closes it, and a click on the backdrop closes it. A visible close button is always rendered (ref/HEURISTICS.md #38 — never drag/gesture-only dismissal), in addition to Esc and backdrop-click.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="drawer"` on the panel; `data-rebar-side` mirrors the `side` prop (`"left"|"right"|"top"|"bottom"`); `data-rebar-part="header"|"title"|"description"|"body"|"footer"|"close"`. Radix\'s own `data-state="open"|"closed"` is read directly, not duplicated.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD has a very close equivalent: its own `Drawer` component. `open`, `title`, and `footer` are already compatible names; `side` maps directly to AntD's `placement` (`\"left\"|\"right\"|\"top\"|\"bottom\"`, same four values). `onOpenChange` is renamed to `onClose`, flagged with a review comment since AntD's `onClose` takes an event argument, not a boolean.",
      },
    ],
  },
];

export default function DrawerPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Drawer</Heading>
      <Text color="secondary">
        A panel that slides in from a screen edge — the same Radix Dialog wiring as{" "}
        <code>Dialog</code> (focus trap, Esc, backdrop click), just positioned as a side panel
        instead of a centered box.
      </Text>

      <LivePreview>
        <Stack direction="row" gap="md" style={{ flexWrap: "wrap" }}>
          <Drawer
            trigger={<Button>Open from left</Button>}
            side="left"
            title="Filters"
            description="Narrow down the results below."
            footer={
              <>
                <Button variant="secondary">Reset</Button>
                <Button>Apply</Button>
              </>
            }
          >
            <Text size="sm">Category, price range, and availability filters go here.</Text>
          </Drawer>
          <Drawer
            trigger={<Button>Open from right</Button>}
            side="right"
            title="Shipping address"
            description="Where should we send this order?"
            footer={
              <>
                <Button variant="secondary">Cancel</Button>
                <Button>Save address</Button>
              </>
            }
          >
            <Text size="sm">123 Example St, Springfield</Text>
          </Drawer>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
