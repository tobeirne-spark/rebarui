import { Box, Heading, Histogram, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const SAMPLE = [62, 68, 71, 74, 75, 75, 78, 80, 81, 82, 83, 84, 85, 85, 86, 88, 90, 91, 93, 96];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Histogram title="Score distribution" series={[{ label: "Class A", values: [62, 75, 80, 85, 91] }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Histogram"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: '`series` takes real raw sample values — binned internally into `binCount` equal-width buckets (defaulting to Sturges\' rule, `ceil(log2(n) + 1)`, off the combined sample count) and plotted as touching bars, the standard histogram silhouette. Distinct from `DistributionChart`, which plots a *parametric* normal curve from an already-computed `mean`/`stdDev` — this is the raw-data counterpart for when a caller has the actual measurements, not just their summary statistics.',
      },
      {
        kind: "text",
        text: "Multiple series share one set of bin edges (computed from the combined range of all of them) so their bars line up, rendered as semi-transparent overlapping bars rather than grouped side-by-side ones — the standard way to compare overlapping distributions.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="histogram"` on the root `<figure>`; `data-rebar-part="mark"` on each bin\'s bar.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own; a migration typically feeds the same raw sample values to whatever charting library's own histogram/binning helper the target project uses.",
      },
    ],
  },
];

export default function HistogramPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Histogram</Heading>
      <Text color="secondary">
        Bins raw sample values into equal-width buckets and plots each bucket&apos;s count as a
        touching bar.
      </Text>

      <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-lg)" }}>
        <Histogram title="Test score distribution" series={[{ label: "Class A", values: SAMPLE }]} />
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
