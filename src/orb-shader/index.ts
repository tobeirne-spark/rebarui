/**
 * Public subpath (`rebar-ui/orb-shader`) for the orb shader/param definitions and the Three.js
 * renderer factory — kept out of the main `rebar-ui` entry point specifically so importing
 * `rebar-ui` doesn't pull `three` into every consumer's bundle. Internal code (AssistantOrb)
 * reaches these files by relative path instead of through this subpath; this barrel exists for
 * external consumers like the `/dev/orb-comparison` tuning sandbox in `apps/docs`, which needs
 * the exact same shader/param definitions AssistantOrb's persona rendering uses.
 */
export * from "./shaders";
export * from "./params";
export * from "./createOrbRenderer";
