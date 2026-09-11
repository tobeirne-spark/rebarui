import type { ReactNode } from "react";
import { renderBionicChildren } from "./bionic";
import type { BionicOptions } from "./bionic";
// Circular with CodeBlock.tsx (CodeBlock imports `renderMarkdown` from here for its own
// `markdown` toggle; this file imports `CodeBlock` back, to render a fenced code block for real —
// copy button and language label included — instead of a bare `<pre><code>`). Safe: neither side
// touches the other's export at module-evaluation time, only inside a function body called later,
// which is the standard "two components that can nest inside each other" circular-import shape.
import { CodeBlock } from "./components/CodeBlock";

/**
 * A small, real Markdown-to-React renderer — used by `CodeBlock`'s own `markdown` toggle and by
 * `ChatThread`'s message content (real LLM responses, Claude/Qwen included, default to Markdown
 * prose) — headings, paragraphs, ordered/unordered lists, blockquotes, fenced code blocks (real
 * `CodeBlock`s, not bare `<pre>`, so an embedded snippet gets the same copy button and language
 * label a hand-authored one would), and inline bold/italic/code/links. Deliberately not a full
 * CommonMark implementation (no tables, no nested blockquotes/lists, no HTML passthrough) — the
 * same "the real shape, not exhaustive edge-case coverage" philosophy `CodeBlock`'s own doc
 * comment already states for skipping syntax highlighting. Reach for a real markdown library if a
 * caller's content needs more than this covers.
 */

const INLINE_MARKUP = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\*([^*]+)\*/g;

export interface RenderMarkdownOptions {
  /** Applies bionic-reading formatting to plain-text runs (never inside `<strong>`/`<code>`/`<a>`
   * spans) — same convention as `useBionicChildren` elsewhere, just threaded through per inline
   * run instead of the whole content at once, since a markdown document's content isn't one flat
   * string. Off by default (matches `CodeBlock`'s own pre-existing behavior for its `markdown`
   * toggle, unchanged unless a caller opts in). */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

function renderInline(text: string, keyPrefix: string, options?: RenderMarkdownOptions): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  INLINE_MARKUP.lastIndex = 0;
  while ((match = INLINE_MARKUP.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-${key++}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      nodes.push(<code key={`${keyPrefix}-${key++}`}>{match[2]}</code>);
    } else if (match[3] !== undefined) {
      nodes.push(
        <a key={`${keyPrefix}-${key++}`} href={match[4]}>
          {match[3]}
        </a>,
      );
    } else if (match[5] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-${key++}`}>{match[5]}</em>);
    }
    lastIndex = INLINE_MARKUP.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return renderBionicChildren(nodes, options?.bionic ?? false, options?.bionicOptions) as ReactNode[];
}

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const ORDERED_ITEM_RE = /^\s*\d+\.\s+(.*)$/;
const UNORDERED_ITEM_RE = /^\s*[-*]\s+(.*)$/;
const BLOCKQUOTE_RE = /^>\s?(.*)$/;
const FENCE_RE = /^```(\w*)/;

export function renderMarkdown(source: string, options?: RenderMarkdownOptions): ReactNode {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (FENCE_RE.test(line)) {
      const language = FENCE_RE.exec(line)?.[1] || undefined;
      const fenceLines: string[] = [];
      i++;
      while (i < lines.length && !FENCE_RE.test(lines[i] ?? "")) {
        fenceLines.push(lines[i] ?? "");
        i++;
      }
      i++; // skip closing fence
      blocks.push(
        <CodeBlock key={blockKey++} className="rebar-markdown-code" code={fenceLines.join("\n")} language={language} />,
      );
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      const level = heading[1]!.length;
      const HeadingTag = `h${Math.min(level, 6)}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      blocks.push(
        <HeadingTag key={blockKey++} className="rebar-markdown-heading">
          {renderInline(heading[2] ?? "", `h${blockKey}`, options)}
        </HeadingTag>,
      );
      i++;
      continue;
    }

    if (BLOCKQUOTE_RE.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && BLOCKQUOTE_RE.test(lines[i] ?? "")) {
        quoteLines.push(BLOCKQUOTE_RE.exec(lines[i] ?? "")?.[1] ?? "");
        i++;
      }
      blocks.push(
        <blockquote key={blockKey++} className="rebar-markdown-blockquote">
          {renderInline(quoteLines.join(" "), `q${blockKey}`, options)}
        </blockquote>,
      );
      continue;
    }

    if (ORDERED_ITEM_RE.test(line) || UNORDERED_ITEM_RE.test(line)) {
      const ordered = ORDERED_ITEM_RE.test(line);
      const itemRe = ordered ? ORDERED_ITEM_RE : UNORDERED_ITEM_RE;
      const items: string[] = [];
      while (i < lines.length && itemRe.test(lines[i] ?? "")) {
        items.push(itemRe.exec(lines[i] ?? "")?.[1] ?? "");
        i++;
      }
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag key={blockKey++} className="rebar-markdown-list">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `li${blockKey}-${itemIndex}`, options)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    // Plain paragraph: consume consecutive non-blank, non-special lines as one block, joined with
    // a space (matching how a Markdown paragraph collapses soft line breaks).
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() !== "" &&
      !HEADING_RE.test(lines[i] ?? "") &&
      !FENCE_RE.test(lines[i] ?? "") &&
      !BLOCKQUOTE_RE.test(lines[i] ?? "") &&
      !ORDERED_ITEM_RE.test(lines[i] ?? "") &&
      !UNORDERED_ITEM_RE.test(lines[i] ?? "")
    ) {
      paragraphLines.push(lines[i] ?? "");
      i++;
    }
    blocks.push(
      <p key={blockKey++} className="rebar-markdown-paragraph">
        {renderInline(paragraphLines.join(" "), `p${blockKey}`, options)}
      </p>,
    );
  }

  return blocks;
}
