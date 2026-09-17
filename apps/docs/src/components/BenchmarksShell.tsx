"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Box, NavIndex, Stack } from "rebar-ui";
import type { NavIndexItem } from "rebar-ui";

const BENCHMARK_SECTIONS: NavIndexItem[] = [
  { href: "/about/benchmarks", label: "Overview" },
  { href: "/about/benchmarks/scenarios", label: "What this costs you" },
  { href: "/about/benchmarks/receipts", label: "The receipts" },
  { href: "/about/benchmarks/claude", label: "Claude Sonnet 5" },
  { href: "/about/benchmarks/qwen", label: "Qwen3.7" },
  { href: "/about/benchmarks/kimi", label: "Kimi-K3" },
  { href: "/about/benchmarks/tiers", label: "Simple/Composite/Complex" },
  { href: "/about/benchmarks/iteration", label: "Does iteration change it?" },
];

// Mirrors DocsShell exactly (cross-page left nav via NavIndex), sized wider (1040 vs. 960) since
// this section's own content — wide stats tables, 700px-viewBox charts — needs more room than
// prose does. Split into these 8 routes from a single ~1,400-line page, the same way /docs/* is
// split, per heuristic #11 (IA as pyramid) — one long page was becoming its own gap to navigate.
export function BenchmarksShell({ children }: { children: ReactNode }) {
  return (
    <Box as="main" style={{ maxWidth: 1040, margin: "0 auto", padding: "var(--rebar-space-xl)" }}>
      <Stack direction="row" gap="xl" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
        <Box style={{ width: 200, flexShrink: 0 }}>
          <NavIndex
            items={BENCHMARK_SECTIONS}
            searchPlaceholder="Search sections…"
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
