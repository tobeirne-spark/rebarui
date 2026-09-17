import { Heading, MultiSelect, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const OPTIONS = [
  { value: "js", label: "JavaScript" },
  { value: "ts", label: "TypeScript" },
  { value: "py", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rs", label: "Rust" },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<MultiSelect options={[{ value: "ts", label: "TypeScript" }]} onValuesChange={(v) => setLanguages(v)} aria-label="Languages" />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["MultiSelect"] ?? [] },
  {
    type: "doc-section",
    heading: "Distinct from Combobox's multiple mode",
    body: [
      {
        kind: "text",
        text: 'A closed-menu multi-select — a `Select`-style trigger that opens a checklist popover, no typing. Deliberately a separate component from `Combobox`\'s `multiple` mode (a type-to-filter search field with removable chips) rather than a shared one with a toggled prop: both are real, independently-established patterns for "select more than one" (MUI\'s `Select multiple` vs. AntD\'s `Select mode="multiple"`), not the same interaction restyled. See [Design Heuristics](/about/agent#filter-dimensions) heuristic #42 — pick this one for a small-enough-to-scan known set; reach for `Combobox`\'s `multiple` mode once the set is large enough that finding an option by typing beats scanning a flat list.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'Built on Radix\'s `DropdownMenu` with `CheckboxItem`s — the same primitive `Dropdown` wraps — rather than Radix\'s `Select`, which has no multi-select mode at all (checked directly against Radix\'s own docs). Each option is a real `role="menuitemcheckbox"` with `aria-checked`; the trigger is a real `<button>` with `aria-haspopup`/`aria-expanded`. Picking an option calls `event.preventDefault()` in `onSelect` to keep the menu open across selections, so choosing several doesn\'t mean reopening it every time.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="multi-select"` on the trigger; `data-rebar-part` is `"value"` (the trigger\'s summary text), `"content"` (the popup), or `"item"` (per option).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: 'AntD has no closed-menu multi-select on `Select` itself — its `Select mode="multiple"` is always the searchable-with-chips shape, the same one `Combobox`\'s `multiple` mode already covers. A `Checkbox.Group` inside a `Dropdown` (or `Popover`) is the closer structural match for this specific no-search-needed pattern.',
      },
    ],
  },
];

export default function MultiSelectPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>MultiSelect</Heading>
      <Text color="secondary">
        A closed-menu multi-select — click the trigger, check the ones that apply, no typing. The
        no-search counterpart to <code>Combobox</code>&apos;s <code>multiple</code> mode.
      </Text>

      <LivePreview>
        <MultiSelect options={OPTIONS} placeholder="Select languages…" aria-label="Languages" />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
