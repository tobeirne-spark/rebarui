import { Heading, Stack, Statistic, Text } from "rebar-ui";
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
        code: '<Statistic title="Active users" value={1234} />\n<Statistic title="Conversion rate" value={4.86} precision={2} suffix="%" />\n<Statistic title="Revenue" value={98000} prefix="$" />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Statistic"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: "Plain text content — no special ARIA needed. A number is formatted with locale-aware thousands separators (`toLocaleString`) unless `precision` is set, in which case it's shown as a fixed-decimal string instead.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="statistic"`, `data-rebar-part="title" | "value" | "prefix" | "suffix"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's `Statistic` has the same `title`/`value`/`precision`/`prefix`/`suffix` prop shape almost exactly — a close, mostly mechanical rename, not yet codemod-covered.",
      },
    ],
  },
];

export default function StatisticPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Statistic</Heading>
      <Text color="secondary">
        A labeled number — for a dashboard summary row or a card&apos;s headline metric.
      </Text>

      <LivePreview>
        <Stack direction="row" gap="xl">
          <Statistic title="Active users" value={1234} />
          <Statistic title="Conversion rate" value={4.86} precision={2} suffix="%" />
          <Statistic title="Revenue" value={98000} prefix="$" />
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
