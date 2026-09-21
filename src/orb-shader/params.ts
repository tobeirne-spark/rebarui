import { FLOW_FRAGMENT_SHADER, SOLID_FRAGMENT_SHADER } from "./shaders";

// Every tunable knob in a variant's shader/bloom pipeline, in one place — the `/dev/orb-comparison`
// slider panel, the uniform wiring, and orb-persona tuning all key off this list so adding a new
// knob later means adding one entry here, not touching several spots by hand. Uniform names are
// derived mechanically from `key` (see `uniformName` below), so every uniform param's key must
// exactly match its shader's own uniform name, minus the leading "u".
export interface OrbParam {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  target: "uniform" | "bloom";
}

export const uniformName = (key: string): string => `u${key[0]?.toUpperCase()}${key.slice(1)}`;

export type OrbVariantId = "solid" | "flow";

export interface OrbVariant {
  id: OrbVariantId;
  label: string;
  params: OrbParam[];
  fragmentShader: string;
}

export const SOLID_PARAMS: OrbParam[] = [
  { key: "shellThickness", label: "Shell thickness", min: 0.02, max: 0.3, step: 0.01, default: 0.08, target: "uniform" },
  { key: "openingSize", label: "Opening size (how much is cut away)", min: 0, max: 0.95, step: 0.01, default: 0.22, target: "uniform" },
  { key: "rotationSpeed", label: "Tumble speed", min: 0, max: 1, step: 0.01, default: 0.2, target: "uniform" },
  { key: "rimIntensity", label: "Rim glow intensity", min: 0, max: 3, step: 0.05, default: 1.3, target: "uniform" },
  { key: "innerBrightness", label: "Inner cavity brightness", min: 0.5, max: 2.5, step: 0.05, default: 1.15, target: "uniform" },
  { key: "edgeSoftness", label: "Edge softness (ephemeral fade)", min: 0.02, max: 1, step: 0.02, default: 0.35, target: "uniform" },
  { key: "noiseScale", label: "Noise scale", min: 0.5, max: 4, step: 0.1, default: 2.0, target: "uniform" },
  { key: "timeScale", label: "Flame speed (time scale)", min: 0.05, max: 1, step: 0.01, default: 0.3, target: "uniform" },
  { key: "darkness", label: "Base darkness", min: 0.2, max: 1, step: 0.05, default: 0.85, target: "uniform" },
  { key: "hotLow", label: "Hot core low edge", min: 0, max: 1, step: 0.01, default: 0.55, target: "uniform" },
  { key: "hotHigh", label: "Hot core high edge", min: 0, max: 1, step: 0.01, default: 0.85, target: "uniform" },
  { key: "hotIntensity", label: "Hot core intensity", min: 0, max: 3, step: 0.05, default: 0.7, target: "uniform" },
  { key: "envelopeSpeed", label: "Flame envelope speed (grow/shrink rate)", min: 0.02, max: 1, step: 0.01, default: 0.12, target: "uniform" },
  { key: "envelopeAmount", label: "Flame envelope range (how much it pulses)", min: 0, max: 0.6, step: 0.02, default: 0.35, target: "uniform" },
  { key: "fresnelPower", label: "Fresnel power", min: 0.5, max: 5, step: 0.1, default: 2.0, target: "uniform" },
  { key: "fresnelIntensity", label: "Fresnel intensity", min: 0, max: 1.5, step: 0.05, default: 0.4, target: "uniform" },
  { key: "hueShift", label: "Hue shift (palette phase)", min: 0, max: 1, step: 0.01, default: 0.08, target: "uniform" },
  { key: "hueSpread", label: "Hue spread (noise-to-color range)", min: 0.02, max: 0.4, step: 0.01, default: 0.13, target: "uniform" },
  { key: "grainAmount", label: "Grain amount", min: 0, max: 0.1, step: 0.005, default: 0.03, target: "uniform" },
  { key: "bloomStrength", label: "Bloom strength", min: 0, max: 3, step: 0.05, default: 0.7, target: "bloom" },
  { key: "bloomRadius", label: "Bloom radius", min: 0, max: 1, step: 0.02, default: 0.45, target: "bloom" },
  { key: "bloomThreshold", label: "Bloom threshold", min: 0, max: 1, step: 0.02, default: 0.65, target: "bloom" },
];

export const FLOW_PARAMS: OrbParam[] = [
  { key: "activeBalls", label: "Blob count", min: 2, max: 8, step: 1, default: 6, target: "uniform" },
  { key: "ballRadius", label: "Blob size", min: 0.15, max: 0.6, step: 0.01, default: 0.4, target: "uniform" },
  { key: "smoothing", label: "Merge smoothing", min: 0.02, max: 0.6, step: 0.01, default: 0.3, target: "uniform" },
  { key: "orbitRadius", label: "Containment radius (bounce distance)", min: 0.1, max: 0.78, step: 0.01, default: 0.62, target: "uniform" },
  { key: "orbitSpeed", label: "Bounce/orbit speed", min: 0.02, max: 1.5, step: 0.02, default: 0.35, target: "uniform" },
  { key: "specularIntensity", label: "Metal specular intensity", min: 0, max: 3, step: 0.05, default: 1.6, target: "uniform" },
  { key: "specularPower", label: "Metal specular tightness", min: 4, max: 128, step: 1, default: 40, target: "uniform" },
  { key: "fresnelPower", label: "Fresnel power", min: 0.5, max: 6, step: 0.1, default: 2.5, target: "uniform" },
  { key: "fresnelIntensity", label: "Fresnel intensity", min: 0, max: 2, step: 0.05, default: 0.6, target: "uniform" },
  { key: "darkness", label: "Base darkness", min: 0.2, max: 1, step: 0.05, default: 0.8, target: "uniform" },
  { key: "edgeSoftness", label: "Edge softness (ephemeral fade)", min: 0.02, max: 1, step: 0.02, default: 0.3, target: "uniform" },
  { key: "grainAmount", label: "Grain amount", min: 0, max: 0.1, step: 0.005, default: 0.02, target: "uniform" },
  { key: "bloomStrength", label: "Bloom strength", min: 0, max: 3, step: 0.05, default: 0.6, target: "bloom" },
  { key: "bloomRadius", label: "Bloom radius", min: 0, max: 1, step: 0.02, default: 0.4, target: "bloom" },
  { key: "bloomThreshold", label: "Bloom threshold", min: 0, max: 1, step: 0.02, default: 0.7, target: "bloom" },
];

export const ORB_VARIANTS: Record<OrbVariantId, OrbVariant> = {
  solid: { id: "solid", label: "Solid Orb", params: SOLID_PARAMS, fragmentShader: SOLID_FRAGMENT_SHADER },
  flow: { id: "flow", label: "Flow Orb", params: FLOW_PARAMS, fragmentShader: FLOW_FRAGMENT_SHADER },
};

export const defaultOrbParams = (variant: OrbVariant): Record<string, number> =>
  Object.fromEntries(variant.params.map((p) => [p.key, p.default]));
