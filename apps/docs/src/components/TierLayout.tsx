import type { ReactNode } from "react";
import { DocsShell } from "@/components/DocsShell";
import { tierDocsShellSections, TIER_CATEGORY_LABELS } from "@/data/tierSections";
import type { Tier } from "@/data/tier.types";

/** Shared by each tier's own `layout.tsx` — a `DocsShell` sidebar scoped to just that tier's
 * components and blocks (see `tierSections.ts`), the tier-scoped replacement for the old
 * `/components/layout.tsx`, which showed every component regardless of tier. */
export function TierLayout({ tier, children }: { tier: Tier; children: ReactNode }) {
  return (
    <DocsShell
      sections={tierDocsShellSections(tier)}
      categoryLabels={TIER_CATEGORY_LABELS}
      unstatusedLabel="Documented"
      searchPlaceholder="Search constructs…"
    >
      {children}
    </DocsShell>
  );
}
