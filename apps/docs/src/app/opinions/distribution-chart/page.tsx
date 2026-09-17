import { Box, DistributionChart, Heading, Stack, Text } from "rebar-ui";
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
        code: '<DistributionChart title="Exam scores" series={[{ label: "Section A", mean: 72, stdDev: 9 }, { label: "Section B", mean: 78, stdDev: 5 }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["DistributionChart"] ?? [] },
  {
    type: "doc-section",
    heading: "Parametric, not fit from raw samples",
    body: [
      {
        kind: "text",
        text: "Each series is a normal (\"bell\") curve drawn from its own `mean`/`stdDev` — not computed from a raw sample array. Fitting a real kernel-density estimate from raw samples is a substantially bigger statistical undertaking than this project's low-fidelity philosophy calls for, and the parametric case (a known or already-summarized distribution — a test-score curve, a manufacturing tolerance, a confidence interval) is the more common real need. A caller with raw samples reduces them to a mean/stdDev first (two numbers), rather than this component attempting KDE internally.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "The ±1 standard-deviation band",
    body: [
      {
        kind: "text",
        text: '`showStdDevBand` (default on) shades the region within one standard deviation of the mean — the "68% of the data" convention — as a light tint under each curve, distinct from the curve\'s own fill. Turn it off for a cleaner look when several overlapping series would make the bands visually noisy.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="distribution-chart"` on the root `<figure>`; parts: `series`, `stddev-band`, `mean-line`, `mean-mark`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own (it recommends `@ant-design/charts`, a separate package built on G2Plot); there's no direct 1:1 antd component mapping for a distribution/bell-curve plot, so a migration reimplements this chart against whichever charting library the target project already uses.",
      },
    ],
  },
];

export default function DistributionChartPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>DistributionChart</Heading>
      <Text color="secondary">
        A parametric normal (&quot;bell curve&quot;) distribution plot — each series drawn from its
        own mean and standard deviation, with an optional ±1σ shaded band.
      </Text>

      <Box
        style={{
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
        }}
      >
        <DistributionChart
          title="Exam scores by section"
          series={[
            { label: "Section A", mean: 72, stdDev: 9 },
            { label: "Section B", mean: 78, stdDev: 5 },
          ]}
        />
      </Box>

      <Stack direction="row" gap="lg" style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
        <Stack gap="xs">
          <Text size="sm" color="secondary">
            A single series, wider spread
          </Text>
          <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-lg)" }}>
            <DistributionChart title="Response time (ms)" series={[{ label: "P50", mean: 240, stdDev: 60 }]} />
          </Box>
        </Stack>
        <Stack gap="xs">
          <Text size="sm" color="secondary">
            showStdDevBand={"{false}"} — no shaded band
          </Text>
          <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-lg)" }}>
            <DistributionChart
              title="Exam scores by section"
              series={[
                { label: "Section A", mean: 72, stdDev: 9 },
                { label: "Section B", mean: 78, stdDev: 5 },
              ]}
              showStdDevBand={false}
            />
          </Box>
        </Stack>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
