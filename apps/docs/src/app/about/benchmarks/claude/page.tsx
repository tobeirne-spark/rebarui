import { Box, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

// The two scatter plots on this page are bespoke hand-drawn SVGs with hardcoded historical pixel
// coordinates — deliberately left alone, not converted to the shared `scatter-chart` block/
// component, per PACKER_COVERAGE.md's own documented note on this page.

const INTRO_BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Claude Sonnet 5 (n=15 per condition)",
    level: 1,
    body: [
      {
        kind: "text",
        text: "rebar-ui composes the target through a compact schema plus the Packer, a deterministic renderer built from rebar-ui's own components; antd is hand-authored directly. Same prompt, same model, isolated scaffolds, only the build step measured.",
      },
    ],
  },
  { type: "doc-section", heading: "Text prompt", body: [] },
];

const TEXT_RESULT_BLOCKS: Construct[] = [
  {
    type: "stats-table",
    headers: ["Condition", "Mean", "Median", "Min", "Max", "Std. dev."],
    rows: [
      ["antd", "31,231", "31,131", "30,891", "31,921", "294 (0.9%)"],
      ["rebar-ui", "30,211", "30,212", "30,149", "30,253", "28.6 (0.095%)"],
    ],
  },
  {
    type: "stats-table",
    headers: ["Wall-clock", "Mean", "Median", "Min", "Max", "Std. dev."],
    rows: [
      ["antd (n=14 of 15)", "24.5s", "23.7s", "21.6s", "30.1s", "2.4s (9.7%)"],
      ["rebar-ui", "14.7s", "14.6s", "14.2s", "15.8s", "0.47s (3.2%)"],
    ],
  },
  { type: "gallery", label: "antd", dir: "/benchmark-screenshots", prefix: "antd-text" },
  { type: "gallery", label: "rebar-ui", dir: "/benchmark-screenshots", prefix: "rebar-dsl" },
  {
    type: "doc-section",
    heading: "Image prompt",
    body: [
      {
        kind: "text",
        text: "Same two conditions, same target — but each run was handed the reference screenshot below instead of a written spec, and had to read the layout off it directly.",
      },
    ],
  },
];

const IMAGE_RESULT_BLOCKS: Construct[] = [
  {
    type: "stats-table",
    headers: ["Condition", "Mean", "Median", "Min", "Max", "Std. dev."],
    rows: [
      ["antd", "31,765", "31,659", "31,021", "34,257", "776 (2.4%)"],
      ["rebar-ui", "30,787", "30,769", "30,684", "31,073", "118 (0.38%)"],
    ],
  },
  {
    type: "stats-table",
    headers: ["Wall-clock", "Mean", "Median", "Min", "Max", "Std. dev."],
    rows: [
      ["antd", "27.2s", "25.4s", "20.8s", "54.4s", "8.0s (29.6%)"],
      ["rebar-ui", "16.7s", "16.4s", "15.0s", "20.2s", "1.4s (8.1%)"],
    ],
  },
  { type: "gallery", label: "antd", dir: "/benchmark-screenshots-image", prefix: "antd-image" },
  { type: "gallery", label: "rebar-ui", dir: "/benchmark-screenshots-image", prefix: "rebar-dsl-image-refined" },
];

export default function ClaudePage() {
  return (
    <Stack gap="md">
      <NextBlockRenderer blocks={INTRO_BLOCKS} />

      <svg
        viewBox="0 0 500 340"
        style={{ width: "100%", maxWidth: 500, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label="Scatter plot comparing antd direct (clustered around 31,000, mean 31,231) and rebar-ui (more tightly clustered around 30,200, mean 30,211, lower and tighter than antd)"
      >
        {[30000, 30500, 31000, 31500, 32000].map((v) => {
          const y = 300 - ((v - 29500) / (32500 - 29500)) * 280;
          return (
            <g key={v}>
              <line x1={60} y1={y} x2={470} y2={y} stroke="var(--rebar-color-border, #e0e0e0)" strokeWidth={1} />
              <text x={52} y={y + 4} fontSize={11} textAnchor="end" fill="var(--rebar-color-text-secondary, #757575)">
                {(v / 1000).toFixed(1)}k
              </text>
            </g>
          );
        })}
        <line x1={130} y1={138.4} x2={250} y2={138.4} stroke="var(--rebar-color-text-primary, #212121)" strokeWidth={2} strokeDasharray="4 3" />
        <line x1={355} y1={233.7} x2={495} y2={233.7} stroke="var(--rebar-color-primary, #0066cc)" strokeWidth={2} strokeDasharray="4 3" />
        {[
          [172.0, 157.1], [244.0, 74.0], [148.0, 147.8], [204.0, 153.2], [132.0, 126.4],
          [188.0, 170.2], [124.0, 74.4], [220.0, 146.9], [164.0, 155.0], [228.0, 145.3],
          [156.0, 149.4], [236.0, 123.4], [140.0, 146.8], [196.0, 157.1], [212.0, 149.3],
        ].map(([x, y], i) => (
          <circle key={`a${i}`} cx={x} cy={y} r={4} fill="var(--rebar-color-text-secondary, #757575)" opacity={0.8} />
        ))}
        {[
          [428.0, 239.4], [412.0, 237.1], [436.0, 236.5], [404.0, 235.8], [444.0, 234.9],
          [396.0, 234.7], [452.0, 233.6], [388.0, 233.5], [460.0, 233.1], [380.0, 232.3],
          [468.0, 232.0], [372.0, 231.6], [476.0, 230.7], [364.0, 230.0], [484.0, 229.7],
        ].map(([x, y], i) => (
          <circle key={`d${i}`} cx={x} cy={y} r={4} fill="var(--rebar-color-primary, #0066cc)" opacity={0.85} />
        ))}
        <text x={190} y={322} fontSize={12} textAnchor="middle" fill="var(--rebar-color-text-primary, #212121)">
          antd (n=15)
        </text>
        <text x={425} y={322} fontSize={12} textAnchor="middle" fill="var(--rebar-color-primary, #0066cc)">
          rebar-ui (n=15)
        </text>
      </svg>

      <NextBlockRenderer blocks={TEXT_RESULT_BLOCKS} />

      <Box style={{ maxWidth: 340, margin: "0 auto" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/reference-preview-panel.png"
          alt="Reference screenshot: a Preview panel with a title bar, an info banner with a Reset action, a six-item checklist, and a warning callout"
          style={{
            width: "100%",
            height: "auto",
            border: "1px solid var(--rebar-color-border, #e0e0e0)",
            borderRadius: 4,
          }}
        />
      </Box>

      <svg
        viewBox="0 0 500 340"
        style={{ width: "100%", maxWidth: 500, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label="Scatter plot comparing antd, image-driven (clustered around 31,800, mean 31,765) and rebar-ui, image-driven (clustered lower and tighter, around 30,800, mean 30,787)"
      >
        {[31000, 31500, 32000, 32500, 33000, 33500, 34000].map((v) => {
          const y = 300 - ((v - 30500) / (34500 - 30500)) * 280;
          return (
            <g key={v}>
              <line x1={60} y1={y} x2={470} y2={y} stroke="var(--rebar-color-border, #e0e0e0)" strokeWidth={1} />
              <text x={52} y={y + 4} fontSize={11} textAnchor="end" fill="var(--rebar-color-text-secondary, #757575)">
                {(v / 1000).toFixed(1)}k
              </text>
            </g>
          );
        })}
        <line x1={124} y1={211.4} x2={256} y2={211.4} stroke="var(--rebar-color-text-primary, #212121)" strokeWidth={2} strokeDasharray="4 3" />
        <line x1={359} y1={279.9} x2={491} y2={279.9} stroke="var(--rebar-color-primary, #0066cc)" strokeWidth={2} strokeDasharray="4 3" />
        {[
          [174, 263.5], [206, 253], [166, 251.3], [214, 248], [158, 234.1],
          [222, 230.6], [150, 230.4], [230, 218.9], [142, 217.8], [238, 215],
          [134, 214.9], [246, 211.8], [130, 204.6], [250, 140.4], [130, 37],
        ].map(([x, y], i) => (
          <circle key={`a${i}`} cx={x} cy={y} r={4} fill="var(--rebar-color-text-secondary, #757575)" opacity={0.8} />
        ))}
        {[
          [409, 287.1], [441, 286.5], [401, 286.4], [449, 285.9], [393, 285.6],
          [457, 284.5], [385, 284.1], [465, 281.2], [377, 280], [473, 279.8],
          [369, 279.7], [481, 279.4], [365, 277.5], [485, 260.7], [365, 259.9],
        ].map(([x, y], i) => (
          <circle key={`d${i}`} cx={x} cy={y} r={4} fill="var(--rebar-color-primary, #0066cc)" opacity={0.85} />
        ))}
        <text x={190} y={322} fontSize={12} textAnchor="middle" fill="var(--rebar-color-text-primary, #212121)">
          antd (n=15)
        </text>
        <text x={425} y={322} fontSize={12} textAnchor="middle" fill="var(--rebar-color-primary, #0066cc)">
          rebar-ui (n=15)
        </text>
      </svg>

      <NextBlockRenderer blocks={IMAGE_RESULT_BLOCKS} />

      <Text size="xs" color="secondary">
        <strong>Caveats:</strong> n=15, one model (claude-sonnet-5), one day (2026-08-29), one
        component spec. All runs type-checked; a Playwright-verified subset (clean render, zero
        console errors, correct DOM order) confirmed both extremes and the median for each
        condition. antd&apos;s image-prompt output uses a deprecated <code>Alert message</code>{" "}
        prop (antd v6 renamed it to <code>title</code>) — harmless to rendering, a sign the
        model&apos;s antd knowledge lags the v6 release this benchmark targets.
      </Text>
    </Stack>
  );
}
