import { AVATAR_PLACEHOLDERS } from "../assets/avatarPlaceholders";

// Kept out of Avatar.tsx deliberately: react-docgen-typescript (which generates the docs site's
// props tables from every export in each COMPONENT_FILES entry) treats any exported function in
// that file as a potential component, which polluted the generated component list with these two
// plain helper functions. Exported here (not re-exported from index.ts) purely so tests can
// verify the selection logic directly — Radix's Avatar.Image never actually renders in jsdom (it
// defers to a real image load, which jsdom can't do), so there's no other way to observe which
// placeholder got picked.

export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function resolvePlaceholderSrc(placeholder: boolean | number | undefined, fallback: string): string | undefined {
  // Not a plain truthiness check: placeholder={0} must mean "index 0," not "unset" — 0 is falsy.
  if (placeholder === undefined || placeholder === false) return undefined;
  const index = typeof placeholder === "number" ? placeholder : hashString(fallback);
  return AVATAR_PLACEHOLDERS[index % AVATAR_PLACEHOLDERS.length];
}
