import type { ReactNode } from "react";

/**
 * A small, real Markdown-to-React renderer for `CodeBlock`'s `markdown` toggle — headings,
 * paragraphs, ordered/unordered lists, blockquotes, fenced code blocks, and inline
 * bold/italic/code/links. Deliberately not a full CommonMark implementation (no tables, no nested
 * blockquotes/lists, no HTML passthrough) — the same "the real shape, not exhaustive edge-case
 * coverage" philosophy `CodeBlock`'s own doc comment already states for skipping syntax
 * highlighting. Reach for a real markdown library if a caller's content needs more than this covers.
 */

const INLINE_MARKUP = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\*([^*]+)\*/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
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
  return nodes;
}

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const ORDERED_ITEM_RE = /^\s*\d+\.\s+(.*)$/;
const UNORDERED_ITEM_RE = /^\s*[-*]\s+(.*)$/;
const BLOCKQUOTE_RE = /^>\s?(.*)$/;
const FENCE_RE = /^```/;

export function renderMarkdown(source: string): ReactNode {
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
      const fenceLines: string[] = [];
      i++;
      while (i < lines.length && !FENCE_RE.test(lines[i] ?? "")) {
        fenceLines.push(lines[i] ?? "");
        i++;
      }
      i++; // skip closing fence
      blocks.push(
        <pre key={blockKey++} className="rebar-markdown-code">
          <code>{fenceLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      const level = heading[1]!.length;
      const HeadingTag = `h${Math.min(level, 6)}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      blocks.push(
        <HeadingTag key={blockKey++} className="rebar-markdown-heading">
          {renderInline(heading[2] ?? "", `h${blockKey}`)}
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
          {renderInline(quoteLines.join(" "), `q${blockKey}`)}
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
            <li key={itemIndex}>{renderInline(item, `li${blockKey}-${itemIndex}`)}</li>
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
        {renderInline(paragraphLines.join(" "), `p${blockKey}`)}
      </p>,
    );
  }

  return blocks;
}
