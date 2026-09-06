// Kept separate from Sticky.tsx itself, same reasoning as avatarPlaceholder.ts/ratioPlaceholder.ts:
// react-docgen-typescript treats every exported function in a component file as a potential
// component, and co-locating these briefly polluted the generated props list with fake entries.

export const STICKY_PALETTE = ["#fff59d", "#f8bbd0", "#bbdefb", "#c8e6c9", "#ffe0b2"];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Deterministically picks a background color from `STICKY_PALETTE` keyed off `seed` (a stable
 * id) when `color` isn't explicitly set — the same seed always resolves to the same color. */
export function resolveStickyColor(seed: string, color?: string): string {
  return color ?? STICKY_PALETTE[hashString(seed) % STICKY_PALETTE.length] ?? "#fff59d";
}

// A postit's own paper color doesn't change with the room's lighting — real ink stays legible on
// it regardless of ambient light/dark mode. So a sticky's text color is computed from its OWN
// background's luminance (same formula StackedBarChart's readableLabelColor already uses for the
// same reason: a fixed data color, not an ambient-theme one), not inherited from the page's
// dark-mode text color — light pastel background with light-on-light dark-mode text is illegible.
export function resolveStickyTextColor(hex: string): string {
  if (!hex.startsWith("#") || hex.length < 7) return "#212121";
  const n = parseInt(hex.slice(1, 7), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#212121" : "#f5f5f5";
}

/** Deterministic -4deg..4deg rotation keyed off `seed` — the same seed always tilts the same way. */
export function resolveStickyRotation(seed: string): number {
  return (hashString(seed) % 9) - 4;
}
