import type { OrbVariantId } from "../orb-shader/params";

/**
 * Hand-transcribed from this directory's own `.md` docs (Spark.md, Strato.md, Chorus.md) — those
 * files are tuned by hand in `/dev/orb-comparison` and are the source of truth for these numbers;
 * this file exists only so real code (AssistantOrb, the placement schema) has something to import.
 * If you retune a persona in the sandbox, update its `.md` file *and* this file together.
 */

export type OrbPersonaId = "spark" | "strato" | "chorus";
export type OrbInteractionState = "idle" | "listening" | "thinking" | "speaking";

export interface OrbPersona {
  id: OrbPersonaId;
  label: string;
  variant: OrbVariantId;
  /** Full param sets per interaction state. `idle` is always present; the others are only present
   * where the persona's own doc actually defines a distinct target for that state — see
   * `resolveOrbPersonaState` for the fallback when one is missing. */
  states: Partial<Record<OrbInteractionState, Record<string, number>>> & { idle: Record<string, number> };
}

/** Builds a full state's param set from `idle` plus only the handful of keys a persona's own
 * "State targets" table actually varies for that state — the rest hold steady, matching each
 * `.md` doc's own framing ("scale these uniforms", not "here is an unrelated full state"). */
const deriveState = (idle: Record<string, number>, overrides: Record<string, number>): Record<string, number> => ({
  ...idle,
  ...overrides,
});

const SPARK_IDLE = {
  edgeSoftness: 0.1,
  noiseScale: 2,
  timeScale: 0.57,
  darkness: 0.3,
  hotLow: 0.56,
  hotHigh: 0.87,
  hotIntensity: 2.85,
  envelopeSpeed: 0.69,
  envelopeAmount: 0.58,
  fresnelPower: 2.5,
  fresnelIntensity: 0.15,
  openingSize: 0,
  grainAmount: 0.005,
  bloomStrength: 0.75,
  bloomRadius: 0.6,
  bloomThreshold: 0.18,
};

const STRATO_IDLE = {
  edgeSoftness: 0.24,
  noiseScale: 1.2,
  timeScale: 0.06,
  darkness: 0.55,
  hotLow: 0.34,
  hotHigh: 0.15,
  hotIntensity: 0.55,
  envelopeSpeed: 0.82,
  envelopeAmount: 0.42,
  fresnelPower: 2,
  fresnelIntensity: 0.3,
  rimIntensity: 0,
  openingSize: 0,
  grainAmount: 0.02,
  bloomStrength: 2.05,
  bloomRadius: 0.62,
  bloomThreshold: 0.3,
};

const CHORUS_IDLE = {
  activeBalls: 6,
  ballRadius: 0.3,
  smoothing: 0.27,
  orbitRadius: 0.31,
  orbitSpeed: 0.46,
  specularIntensity: 1.4,
  specularPower: 4,
  fresnelPower: 2.2,
  fresnelIntensity: 1.8,
  darkness: 0.85,
  edgeSoftness: 0.92,
  grainAmount: 0,
  bloomStrength: 0,
  bloomRadius: 0,
  bloomThreshold: 0.76,
};

export const ORB_PERSONAS: Record<OrbPersonaId, OrbPersona> = {
  spark: {
    id: "spark",
    label: "Spark",
    variant: "solid",
    states: {
      idle: SPARK_IDLE,
      listening: deriveState(SPARK_IDLE, { timeScale: 1.2, hotIntensity: 3.5, envelopeAmount: 0.8, bloomStrength: 1.0 }),
      speaking: deriveState(SPARK_IDLE, { timeScale: 1.5, hotIntensity: 4.0, envelopeAmount: 0.6, bloomStrength: 1.2 }),
      thinking: {
        edgeSoftness: 0.86,
        noiseScale: 1.7,
        timeScale: 0.25,
        darkness: 0.45,
        hotLow: 0.26,
        hotHigh: 0.38,
        hotIntensity: 1,
        envelopeSpeed: 0.43,
        envelopeAmount: 0.26,
        fresnelPower: 4.3,
        fresnelIntensity: 0.1,
        openingSize: 0,
        grainAmount: 0.085,
        bloomStrength: 1.4,
        bloomRadius: 0.12,
        bloomThreshold: 0.34,
      },
    },
  },
  strato: {
    id: "strato",
    label: "Strato",
    variant: "solid",
    states: {
      idle: STRATO_IDLE,
      listening: deriveState(STRATO_IDLE, { timeScale: 0.15, hotIntensity: 0.8, envelopeAmount: 0.6, bloomStrength: 2.2 }),
      speaking: deriveState(STRATO_IDLE, { timeScale: 0.2, hotIntensity: 1.0, envelopeAmount: 0.5, bloomStrength: 2.5 }),
      thinking: {
        edgeSoftness: 0.92,
        noiseScale: 3.3,
        timeScale: 0.25,
        darkness: 1,
        hotLow: 0.03,
        hotHigh: 0.4,
        hotIntensity: 1.7,
        envelopeSpeed: 0.87,
        envelopeAmount: 0.4,
        fresnelPower: 4.3,
        fresnelIntensity: 0.3,
        rimIntensity: 0,
        openingSize: 0,
        grainAmount: 0.09,
        bloomStrength: 1.6,
        bloomRadius: 0.88,
        bloomThreshold: 0.72,
      },
    },
  },
  chorus: {
    id: "chorus",
    label: "Chorus",
    variant: "flow",
    // Only Idle and Thinking are tuned so far (see Chorus.md) — no Listening/Speaking targets
    // exist yet, so this persona falls back to Idle for those states rather than guessing values
    // that were never actually tuned in the sandbox.
    states: {
      idle: CHORUS_IDLE,
      thinking: {
        activeBalls: 8,
        ballRadius: 0.15,
        smoothing: 0.22,
        orbitRadius: 0.31,
        orbitSpeed: 1.34,
        specularIntensity: 1.2,
        specularPower: 4,
        fresnelPower: 3.4,
        fresnelIntensity: 1.8,
        darkness: 0.85,
        edgeSoftness: 0.92,
        grainAmount: 0,
        bloomStrength: 0,
        bloomRadius: 0,
        bloomThreshold: 0.76,
      },
    },
  },
};

export const ORB_PERSONA_IDS = Object.keys(ORB_PERSONAS) as OrbPersonaId[];

/** Resolves a persona + requested state to a concrete param set, falling back to `idle` for any
 * state the persona's own doc hasn't tuned yet (e.g. Chorus's Listening/Speaking) rather than
 * fabricating values that were never actually verified in the sandbox. */
export function resolveOrbPersonaState(
  persona: OrbPersona,
  state: OrbInteractionState,
): Record<string, number> {
  return persona.states[state] ?? persona.states.idle;
}
