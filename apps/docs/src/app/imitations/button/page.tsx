import { Button, Heading, Stack, Text } from "rebar-ui";
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
        code: `<Button variant="primary">Save changes</Button>\n<Button variant="destructive" onClick={handleDelete}>Delete</Button>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Button"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'Real `<button type="button">` by default (pass `type="submit"` for form submission) — Tab to focus, Enter/Space to activate, native focus-visible outline. `aria-busy` is set while `loading`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="button"`, `data-rebar-variant`, `data-rebar-size`, `data-rebar-state="idle" | "loading"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "`@rebar-ui/migrate-antd` renames `variant` to AntD's `type`/`danger` vocabulary and `size=\"sm\"|\"md\"|\"lg\"` to `\"small\"|\"middle\"|\"large\"`. If the element already has a native `type` (e.g. `type=\"submit\"`), it's moved to AntD's `htmlType` prop first, since AntD's own `type` means visual variant, not HTML button type.",
      },
    ],
  },
];

export default function ButtonPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Button</Heading>
      <Text color="secondary">
        A real <code>&lt;button&gt;</code> element. One primary action per screen is the
        convention (Nielsen #6 — recognition over recall); loading disables the button and shows
        a spinner, preventing double-submit.
      </Text>

      <LivePreview>
        <Stack gap="sm">
          <Stack direction="row" gap="sm">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tertiary">Tertiary</Button>
            <Button variant="destructive">Destructive</Button>
          </Stack>
          <Stack direction="row" gap="sm">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button loading>Loading</Button>
          </Stack>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
