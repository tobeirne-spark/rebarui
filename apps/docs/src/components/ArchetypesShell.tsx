"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Box, NavIndex, Stack } from "rebar-ui";
import type { NavIndexItem } from "rebar-ui";

const ARCHETYPE_SECTIONS: NavIndexItem[] = [
  { href: "/archetypes", label: "Overview" },
  { href: "/archetypes/the-button", label: "The Button" },
];

// Mirrors BenchmarksShell exactly (cross-page left nav via NavIndex), sized for long-form
// theory articles. Each archetype traces a UI construct back to its physical/mechanical ancestry
// and the design implications that lineage carries into the digital derivative.
export function ArchetypesShell({ children }: { children: ReactNode }) {
  return (
    <Box as="main" style={{ maxWidth: 1040, margin: "0 auto", padding: "var(--rebar-space-xl)" }}>
      <Stack direction="row" gap="xl" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
        <Box style={{ width: 200, flexShrink: 0 }}>
          <NavIndex
            items={ARCHETYPE_SECTIONS}
            searchPlaceholder="Search archetypes…"
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
