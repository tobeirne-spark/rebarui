"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Box, NavIndex, Stack } from "rebar-ui";
import type { NavIndexItem } from "rebar-ui";

export interface DocsShellSection {
  href: string;
  label: string;
  /** Optional category tag (e.g. "web" / "mobile" / "diagram"). Sections without one always show. */
  category?: string;
  status?: string;
}

interface DocsShellProps {
  sections: DocsShellSection[];
  /** Display label per category key, e.g. { web: "Web", mobile: "Mobile" }. */
  categoryLabels?: Record<string, string>;
  /** Label for the status-filter chip covering sections with no `status` set — see
   * ref/HEURISTICS.md #42 (category and status are independent filter dimensions). */
  unstatusedLabel?: string;
  /** Was hardcoded to "Search components…" regardless of what a given caller's sidebar actually
   * lists — wrong on /docs/* (searching doc pages, not components). Each caller now says what
   * it's searching. */
  searchPlaceholder?: string;
  children: ReactNode;
}

export function DocsShell({
  sections,
  categoryLabels,
  unstatusedLabel,
  searchPlaceholder = "Search…",
  children,
}: DocsShellProps) {
  const items: NavIndexItem[] = sections;

  return (
    <Box as="main" style={{ maxWidth: 960, margin: "0 auto", padding: "var(--rebar-space-xl)" }}>
      <Stack direction="row" gap="xl" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
        <Box style={{ width: 200, flexShrink: 0 }}>
          <NavIndex
            items={items}
            categoryLabels={categoryLabels}
            unstatusedLabel={unstatusedLabel}
            searchPlaceholder={searchPlaceholder}
            renderLink={({ href, children: linkChildren, className }) => (
              <Link href={href} className={className}>
                {linkChildren}
              </Link>
            )}
          />
        </Box>
        <Box style={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Stack>
    </Box>
  );
}
