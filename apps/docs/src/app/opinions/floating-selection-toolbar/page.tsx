"use client";

import { useRef } from "react";
import { FloatingSelectionToolbar, Heading, Stack, Text } from "rebar-ui";
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
        code: '<FloatingSelectionToolbar\n  containerRef={editorRef}\n  actions={[{ key: "ask-ai", label: "Ask AI", onSelect: (text) => askAi(text) }]}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["FloatingSelectionToolbar"] ?? [] },
  {
    type: "doc-section",
    heading: "Anchors to a live selection range, not a fixed element",
    body: [
      {
        kind: "text",
        text: "Distinct from Popover/ContextMenu/Tooltip, all of which anchor to a fixed trigger element — this tracks `document.selectionchange` and positions itself against the real selection's bounding box, clamped to stay in the viewport. Stays open after an action so a second action can be triggered against the same selection.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="floating-selection-toolbar"`; each action carries `data-rebar-part="action"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD has no selection-anchored toolbar of its own; the Medium/Notion-style pattern typically needs a hand-rolled `selectionchange` listener regardless of design system.",
      },
    ],
  },
];

export default function FloatingSelectionToolbarPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Stack gap="lg">
      <Heading level={1}>FloatingSelectionToolbar</Heading>
      <Text color="secondary">
        A small toolbar that appears at a live text selection's screen coordinates, offering
        contextual actions.
      </Text>

      <Text size="sm" color="secondary">
        Select some text in the paragraph below to see the toolbar appear.
      </Text>
      <div ref={containerRef} style={{ border: "1px solid var(--rebar-color-border)", borderRadius: 4, padding: 16 }}>
        <Text>
          Rebar UI is a headless-first, intentionally low-fidelity component library built to be
          re-skinned into a real design system later, by hand or by an LLM, without rewriting
          component structure or breaking tests.
        </Text>
      </div>
      <FloatingSelectionToolbar
        containerRef={containerRef}
        actions={[
          { key: "ask-ai", label: "Ask AI", onSelect: () => {} },
          { key: "define", label: "Define", onSelect: () => {} },
        ]}
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
