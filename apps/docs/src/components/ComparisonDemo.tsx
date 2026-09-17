"use client";

import { useEffect, useState } from "react";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "./NextBlockRenderer";

function readAmbientDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-theme") === "dark";
}

/**
 * Builds a `comparison` block whose right-side iframe stays in sync with the ambient Sketch/Clean
 * theme (via DevTools' toggle, which just flips `<html data-theme>`), so a live-vs-migrated demo
 * doesn't drift out of sync when the viewer switches themes. The theme-watching mechanism itself is
 * specific to how this app implements its theme toggle, not something `@rebar-ui/placement` (which
 * has no opinion on theming at all) should know about — hence this small client wrapper here rather
 * than in the placement package.
 */
export function ComparisonDemo({
  leftLabel,
  leftBlocks,
  rightLabel,
  iframeSrc,
  iframeTitle,
}: {
  leftLabel: string;
  leftBlocks: Construct[];
  rightLabel: string;
  iframeSrc: string;
  iframeTitle: string;
}) {
  const [dark, setDark] = useState(readAmbientDark);

  useEffect(() => {
    const observer = new MutationObserver(() => setDark(readAmbientDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const blocks: Construct[] = [
    {
      type: "comparison",
      leftLabel,
      leftBlocks,
      rightLabel,
      rightBlocks: [{ type: "iframe", src: `${iframeSrc}?theme=${dark ? "dark" : "light"}`, title: iframeTitle }],
    },
  ];

  return <NextBlockRenderer blocks={blocks} />;
}
