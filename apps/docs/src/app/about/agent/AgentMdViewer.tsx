"use client";

import { useState } from "react";
import { Box, Button, Stack, Text } from "rebar-ui";

/**
 * The code box + copy/download affordances for agent.md — split into its own client component
 * because copy-to-clipboard and the download link both need real event handlers, while the page
 * itself reads the file from disk in a server component (one file, one source of truth for both
 * what's displayed and what's downloaded — no risk of the two drifting apart).
 */
export function AgentMdViewer({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Stack gap="sm">
      <Stack direction="row" gap="sm">
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </Button>
        <a
          href="/agent.md"
          download="agent.md"
          className="rebar-button"
          data-rebar-variant="secondary"
          data-rebar-size="sm"
          style={{ textDecoration: "none" }}
        >
          Download agent.md
        </a>
      </Stack>

      <Box
        as="pre"
        style={{
          background: "var(--rebar-color-bg-secondary, #f5f5f5)",
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
          // Prose-heavy markdown, not short code lines — wraps within the box so reading it
          // doesn't require horizontal scrolling for every other sentence; overflowX stays as a
          // fallback for the rare unbroken long token (a URL, an unspaced path).
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowX: "auto",
          fontSize: "var(--rebar-font-size-sm)",
          lineHeight: "var(--rebar-line-height-normal)",
          fontFamily: "var(--rebar-font-family-mono)",
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        <Text as="code">{content}</Text>
      </Box>
    </Stack>
  );
}
