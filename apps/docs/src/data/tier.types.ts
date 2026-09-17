/**
 * The five-tier classification (see ref/TIERS.md): Imitations -> Synthetics -> Opinions -> Orders -> Geneses.
 * Orthogonal to the existing component/block split and to Web/Mobile/Diagram (components) /
 * Global/Web/Mobile (blocks) — every combination of tier and category is legal.
 */
export type Tier = "imitation" | "synthetic" | "opinion" | "order" | "genesis";

/** A block is always at least a fixed composition of components (see Agents.md's own
 * component/block test) — Imitation never applies to one. Geneses are starter projects, not blocks. */
export type ConstructTier = Exclude<Tier, "imitation" | "genesis">;
