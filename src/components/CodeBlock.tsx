import type { ComponentPropsWithoutRef } from "react";
import { useState } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { renderMarkdown } from "../markdown";

export interface CodeBlockProps extends Omit<ComponentPropsWithoutRef<"pre">, "children"> {
  code: string;
  /** A small label shown above the code — e.g. `"tsx"`, `"bash"`. Purely a caption, not real
   * syntax highlighting: a plain, low-fidelity block stays that way on purpose, rather than
   * pulling in a highlighter dependency for something this project's own code samples don't need
   * (see ref/HEURISTICS.md #8, aesthetic and minimalist design). Ignored when `markdown` is set —
   * rendered Markdown has no single "language" the way a code sample does. */
  language?: string;
  /** Hides the copy button — off by default. For an illustrative snippet that isn't meant to be
   * copy-pasted verbatim (e.g. `...` elisions, a diff-style before/after). */
  hideCopyButton?: boolean;
  /** Renders `code` as styled Markdown (headings, lists, blockquotes, fenced code, inline
   * bold/italic/code/links) instead of plain preformatted text. Off by default. Copying still
   * copies the original raw Markdown source, not the rendered output — the same "what you copy is
   * what was authored" contract the plain-code mode already has. */
  markdown?: boolean;
}

/**
 * A real code-sample component — see ref/HEURISTICS.md #39: any copyable code ships with a
 * one-click copy button and visible confirmation, not a silent clipboard write. Deliberately
 * minimal: no syntax highlighting, no line numbers, no language auto-detection — this project's
 * own code samples are short and illustrative, and a heavier code-block library would be solving
 * a problem this one doesn't have. The one thing worth getting right is copy-paste, so that's the
 * one thing this adds over a bare `<pre><code>`.
 */
export function CodeBlock({
  code,
  language,
  hideCopyButton = false,
  markdown = false,
  className,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={clsx("rebar-code-block", className)} data-rebar-component="code-block">
      {(language && !markdown) || !hideCopyButton ? (
        <div className="rebar-code-block-header" data-rebar-part="header">
          {language && !markdown ? (
            <span className="rebar-code-block-language" data-rebar-part="language">
              {language}
            </span>
          ) : null}
          {hideCopyButton ? null : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              data-rebar-part="copy-button"
              aria-live="polite"
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          )}
        </div>
      ) : null}
      {markdown ? (
        <div className="rebar-code-block-markdown" data-rebar-part="markdown">
          {renderMarkdown(code)}
        </div>
      ) : (
        <pre className="rebar-code-block-pre" data-rebar-part="pre" {...props}>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
