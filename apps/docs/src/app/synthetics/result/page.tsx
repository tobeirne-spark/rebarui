import { Button, Heading, Result, Stack, Text } from "rebar-ui";
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
        code: '<Result\n  status="success"\n  title="Payment complete"\n  subTitle="A receipt has been emailed to you."\n  extra={<Button variant="primary">Back to dashboard</Button>}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Result"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'The status icon is a plain inline SVG marked `aria-hidden="true"` — the title/subtitle text alone conveys the outcome, matching how a screen reader user would want to hear it (not a redundant description of a checkmark shape).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="result"`, `data-rebar-status`, `data-rebar-part="icon" | "title" | "subtitle" | "extra" | "content"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: 'AntD\'s `Result` accepts the same `status`/`title`/`subTitle`/`extra` shape, plus numeric HTTP-code statuses (`"404"`, `"403"`, `"500"`) this component doesn\'t yet support — those would fall back to a manual rewrite, not a codemod rename.',
      },
    ],
  },
];

export default function ResultPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Result</Heading>
      <Text color="secondary">
        A centered outcome panel — for the end of a flow (checkout, submission, setup) rather than
        a transient toast. Four statuses: <code>success</code>, <code>error</code>,{" "}
        <code>warning</code>, <code>info</code> (the default).
      </Text>

      <LivePreview>
        <Result
          status="success"
          title="Payment complete"
          subTitle="A receipt has been emailed to you."
          extra={<Button variant="primary">Back to dashboard</Button>}
        />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
