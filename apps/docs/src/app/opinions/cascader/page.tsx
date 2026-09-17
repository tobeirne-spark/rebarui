import { Cascader, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const OPTIONS = [
  {
    value: "on",
    label: "Ontario",
    children: [
      { value: "toronto", label: "Toronto" },
      { value: "ottawa", label: "Ottawa" },
    ],
  },
  {
    value: "bc",
    label: "British Columbia",
    children: [{ value: "vancouver", label: "Vancouver" }],
  },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Cascader options={[{ value: "on", label: "Ontario", children: [{ value: "toronto", label: "Toronto" }] }]} onValueChange={(path, labels) => setLocation(path)} aria-label="Location" />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Cascader"] ?? [] },
  {
    type: "doc-section",
    heading: "One Select per level",
    body: [
      {
        kind: "text",
        text: "Each level is a real `Select` — the next level's options are whichever option the previous level chose. Choosing a new value at any level clears every level after it, since those choices no longer apply to the new branch.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: '`data-rebar-component="cascader"` on the wrapping row of `Select`s.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: 'Not codemod-covered — AntD\'s `Cascader` renders as a single dropdown with inline panels, a materially different interaction from this component\'s row of separate `Select`s, so this is a rebuild, not a rename.' },
    ],
  },
];

export default function CascaderPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Cascader</Heading>
      <Text color="secondary">
        Multi-level cascading select — province, then city, then district — one real{" "}
        <code>Select</code> per level.
      </Text>

      <LivePreview>
        <Cascader options={OPTIONS} placeholder="Select…" aria-label="Location" />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
