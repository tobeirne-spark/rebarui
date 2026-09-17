import { Heading, Stack, Text, WordCloud } from "rebar-ui";
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
        code: '<WordCloud title="Feedback themes" words={[{ text: "fast", weight: 80 }, { text: "reliable", weight: 45 }, { text: "confusing", weight: 20 }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["WordCloud"] ?? [] },
  {
    type: "doc-section",
    heading: "Row-flow placement, not real cloud-packing",
    body: [
      {
        kind: "text",
        text: "This deliberately does not attempt a real collision-avoiding spiral-packing layout — that's a genuinely hard, iterative algorithm out of scope for this project's low-fidelity philosophy. Instead, words are sorted by weight descending and placed in a simple row-flow (wrapping to a new row on overflow), each word's small rotation derived from a seeded hash of its own text — deterministic, not `Math.random`, so the same input always renders identically. Font size is sqrt-scaled between the min/max weight, clamped to a fixed px range.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="word-cloud"` on the root `<figure>`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own; a word cloud typically migrates to a dedicated library (e.g. `react-wordcloud`, `d3-cloud`) rather than an antd component.",
      },
    ],
  },
];

export default function WordCloudPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>WordCloud</Heading>
      <Text color="secondary">
        A size-weighted text visualization — row-flow placement, not real collision-avoiding
        packing.
      </Text>

      <WordCloud
        title="Feedback themes"
        words={[
          { text: "fast", weight: 80 },
          { text: "reliable", weight: 65 },
          { text: "intuitive", weight: 50 },
          { text: "flexible", weight: 40 },
          { text: "confusing", weight: 25 },
          { text: "slow", weight: 15 },
          { text: "buggy", weight: 10 },
        ]}
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
