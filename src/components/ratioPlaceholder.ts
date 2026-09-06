import { RATIO_PLACEHOLDERS } from "../assets/ratioPlaceholders";

// Kept out of AspectRatio.tsx for the same reason avatarPlaceholder.ts is separate from
// Avatar.tsx: react-docgen-typescript (which generates the docs site's props tables from every
// export in each COMPONENT_FILES entry) treats any exported function in that file as a potential
// component. Exported here (not re-exported from index.ts) purely so tests can verify the
// selection logic directly.

/**
 * Picks an embedded placeholder whose own ratio is numerically closest to the one requested.
 * Several placeholders can share the same ratio (real variety, not one photo per ratio) — `index`
 * (e.g. a Carousel's slide position) selects among that ratio's own variants; omitted, it defaults
 * to the first one, so a bare `placeholder` stays deterministic.
 */
export function resolveRatioPlaceholder(ratio: number, index?: number): string {
  let closestRatio = RATIO_PLACEHOLDERS[0]!.ratio;
  let closestDiff = Infinity;
  for (const candidate of RATIO_PLACEHOLDERS) {
    const diff = Math.abs(candidate.ratio - ratio);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestRatio = candidate.ratio;
    }
  }
  const variants = RATIO_PLACEHOLDERS.filter((p) => p.ratio === closestRatio);
  const variantIndex = index === undefined ? 0 : index % variants.length;
  return variants[variantIndex]!.src;
}
