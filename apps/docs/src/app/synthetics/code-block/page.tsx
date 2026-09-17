import { CodeBlock, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const SAMPLE_MARKDOWN = `# Release notes

A short summary paragraph with **bold**, *italic*, and \`inline code\`.

## What changed

- Added a real \`markdown\` toggle
- Fixed a bug in the empty state
- Docs page finally exists

> Ship it.

\`\`\`
const shipped = true;
\`\`\`
`;

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<CodeBlock code="const x = 1;" language="tsx" />\n\n<CodeBlock markdown code={"# Title\\n\\nSome **bold** text."} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["CodeBlock"] ?? [] },
  {
    type: "doc-section",
    heading: "Deliberately minimal, no syntax highlighting",
    body: [
      {
        kind: "text",
        text: "See ref/HEURISTICS.md #39 (copyable code ships with a one-click copy button and visible confirmation) — that's the one thing this adds over a bare `<pre><code>`. No syntax highlighting, no line numbers, no language auto-detection: this project's own code samples are short and illustrative, and a heavier code-block library would be solving a problem this one doesn't have (see ref/HEURISTICS.md #8, aesthetic and minimalist design).",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "markdown: a real renderer, not a full CommonMark implementation",
    body: [
      {
        kind: "text",
        text: "`markdown` renders `code` as styled Markdown instead of plain preformatted text — headings, paragraphs, ordered/unordered lists, blockquotes, fenced code blocks, and inline bold/italic/code/links. It's a small, real parser (`packages/core/src/markdown.tsx`), not a full CommonMark implementation — no tables, no nested lists/blockquotes, no raw HTML passthrough. The copy button still copies the original raw Markdown source in this mode, not the rendered output, matching the same \"what you copy is what was authored\" contract plain-code mode already has. `language` is ignored when `markdown` is set — rendered Markdown has no single language the way a code sample does.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="code-block"` on the root; `data-rebar-part` is `"header"`, `"language"`, `"copy-button"`, `"pre"` (plain mode), `"markdown"` (markdown mode).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no code-block component of its own; a copy-to-clipboard code sample typically migrates to a small custom wrapper around AntD's `Typography.Text code` plus a manual clipboard button, or a dedicated syntax-highlighting library if that fidelity is actually needed.",
      },
    ],
  },
];

export default function CodeBlockPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>CodeBlock</Heading>
      <Text color="secondary">
        A real code-sample component — a one-click copy button with visible confirmation, or a
        styled Markdown renderer via the same component.
      </Text>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          Plain code (default)
        </Text>
        <LivePreview>
          <CodeBlock
            language="tsx"
            code={'export function Greeting({ name }: { name: string }) {\n  return <p>Hello, {name}!</p>;\n}'}
          />
        </LivePreview>
      </Stack>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          markdown — styled Markdown instead of plain preformatted text
        </Text>
        <LivePreview>
          <CodeBlock markdown code={SAMPLE_MARKDOWN} />
        </LivePreview>
      </Stack>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          hideCopyButton — for an illustrative snippet not meant to be copy-pasted verbatim
        </Text>
        <LivePreview>
          <CodeBlock language="bash" hideCopyButton code={"npm install ...\n# ... then configure your project"} />
        </LivePreview>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
