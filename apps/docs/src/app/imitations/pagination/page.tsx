"use client";

import { useState } from "react";
import { Heading, Pagination, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [{ kind: "code", code: '<Pagination current={page} total={20} onChange={setPage} />' }],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Pagination"] ?? [] },
  {
    type: "doc-section",
    heading: "Bounded, not a button per page",
    body: [
      {
        kind: "text",
        text: "Only the first page, the last page, the current page, and its immediate neighbors ever render — an ellipsis fills the gap. A 500-page list gets the same handful of controls a 5-page one does.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'A real `<nav aria-label="Pagination">` landmark; the active page carries `aria-current="page"`; Previous/Next disable themselves at the ends rather than doing nothing on click.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: '`data-rebar-component="pagination"`; `data-rebar-part` is `"prev"`, `"page"`, or `"next"`.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [{ kind: "text", text: 'A close, low-risk rename — AntD\'s `Pagination` takes the same `current`/`total`/`onChange` shape.' }],
  },
];

function PaginationDemo() {
  const [page, setPage] = useState(10);
  return <Pagination current={page} total={20} onChange={setPage} />;
}

export default function PaginationPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Pagination</Heading>
      <Text color="secondary">
        Page-number navigation — a bounded set of visible page numbers (first, last, current ± 1,
        ellipsis for the rest), not a button per page.
      </Text>

      <LivePreview>
        <PaginationDemo />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
