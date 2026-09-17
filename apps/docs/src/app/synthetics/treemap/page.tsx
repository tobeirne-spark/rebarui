import { Heading, Stack, Text, Treemap } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Treemap title="Revenue by region" data={[{ label: "Americas", value: 4200, children: [{ label: "US", value: 3400 }, { label: "Canada", value: 800 }] }, { label: "EMEA", value: 2100 }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Treemap"] ?? [] },
  {
    type: "doc-section",
    heading: "Slice-and-dice, not squarified",
    body: [
      {
        kind: "text",
        text: "Layout alternates horizontal (top level) and vertical (child level) splits — a deliberately simpler algorithm than a true squarified treemap, matching this project's low-fidelity philosophy. Each cell's area is proportional to its `value` relative to its siblings' total; a group with an all-zero sibling set falls back to an even split rather than dividing by zero. Nesting is capped at exactly one level — a child is a plain leaf, enforced by the type itself, not just runtime discipline.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="treemap"` on the root `<figure>`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own (it recommends `@ant-design/charts`, built on G2Plot); there's no direct 1:1 antd component mapping for a treemap.",
      },
    ],
  },
];

export default function TreemapPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Treemap</Heading>
      <Text color="secondary">
        A nested-proportion hierarchical chart — one level of nesting, area proportional to value.
      </Text>

      <Treemap
        title="Revenue by region"
        data={[
          {
            label: "Americas",
            value: 4200,
            children: [
              { label: "US", value: 3400 },
              { label: "Canada", value: 800 },
            ],
          },
          { label: "EMEA", value: 2100 },
          { label: "APAC", value: 1600 },
        ]}
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
