import { Combobox, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const OPTIONS = [
  { value: "af", label: "Afghanistan" },
  { value: "al", label: "Albania" },
  { value: "dz", label: "Algeria" },
  { value: "ar", label: "Argentina" },
];

const LANGUAGE_OPTIONS = [
  { value: "js", label: "JavaScript" },
  { value: "ts", label: "TypeScript" },
  { value: "py", label: "Python" },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Combobox options={[{ value: "af", label: "Afghanistan" }]} onValueChange={(v) => setCountry(v)} aria-label="Country" />\n\n// multi-select: type to filter, picks shown as removable chips\n<Combobox multiple options={[{ value: "ts", label: "TypeScript" }]} onValuesChange={(v) => setLanguages(v)} aria-label="Languages" />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Combobox"] ?? [] },
  {
    type: "doc-section",
    heading: "The real gap this closes",
    body: [
      {
        kind: "text",
        text: "Checked directly against source: `Select` has no type-to-filter today — it's browsing-only. `Combobox` is the type-to-filter half (see [Design Heuristics](/about/agent) heuristic #27, multiple input methods) — a text input that filters its own option list as the user types.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "multiple mode, and how it differs from MultiSelect",
    body: [
      {
        kind: "text",
        text: '`multiple` turns this into a searchable multi-select: picks render as removable `Tag` chips inline with the input, already-selected options drop out of the remaining list, and the popup stays open after each pick. This is a distinct pattern from [MultiSelect](/opinions/multi-select) — a closed checklist menu, no typing — not two names for the same thing (see [Design Heuristics](/about/agent#filter-dimensions) heuristic #42). Reach for `multiple` once the option set is large enough that finding one by typing beats scanning a flat list; reach for `MultiSelect` while it\'s still small enough to just scan and check.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'A real WAI-ARIA combobox: `role="combobox"` with `aria-expanded`/`aria-controls`, a `role="listbox"` popup, and `aria-activedescendant` tracking the arrow-key-highlighted option — not a styled `<select>` or a bare text input with a floating `<div>`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: '`data-rebar-component="combobox"`; `data-rebar-part="list"` on the option popup.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: 'A close, low-risk rename — AntD\'s `AutoComplete` takes the same `options`/filtering shape.' },
    ],
  },
];

export default function ComboboxPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Combobox</Heading>
      <Text color="secondary">
        A text input that filters its own option list as the user types — the type-to-filter
        counterpart to the browsing-only <code>Select</code>.
      </Text>

      <LivePreview>
        <Stack gap="md" style={{ flexWrap: "wrap" }} direction="row">
          <Combobox options={OPTIONS} placeholder="Search countries…" aria-label="Country" />
          <Combobox
            multiple
            options={LANGUAGE_OPTIONS}
            placeholder="Search languages…"
            aria-label="Languages"
          />
        </Stack>
      </LivePreview>
      <Text size="xs" color="secondary">
        The first example above is a real, plain text field (no trigger chevron the way{" "}
        <code>Select</code> has one) — that&apos;s deliberate, not a missing affordance: click into
        it and start typing to see the option list filter live. If a caller wants an explicit
        visual cue that options are browsable before typing anything, pairing it with a search-icon
        prefix (once <code>Combobox</code> supports one) or a helper caption below it is the way to
        signal that, rather than adding a `Select`-style chevron that would misleadingly suggest
        browsing-only behavior.
      </Text>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
