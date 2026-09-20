# Chorus

**Orb persona** — Flow Orb variant, tuned from `/dev/orb-comparison`.

A smooth, pearlescent sphere: six amorphous metal blobs merge into one cohesive, slowly breathing
mass near the center, lit by broad soft specular highlights and a wide fresnel rim rather than
bloom (bloom is off entirely). No grain, a very soft/diffuse silhouette, and a compact containment
radius give it a calm, glassy, held-breath quality — closer to a pearl than a flame. Unlike Spark
(punchy, bloom-driven) or Strato (huge atmospheric halo), Chorus's light comes entirely from
specular + fresnel shading on the blob surface itself.

## Shader uniforms

```json
{
  "activeBalls": 6,
  "ballRadius": 0.3,
  "smoothing": 0.27,
  "orbitRadius": 0.31,
  "orbitSpeed": 0.46,
  "specularIntensity": 1.4,
  "specularPower": 4,
  "fresnelPower": 2.2,
  "fresnelIntensity": 1.8,
  "darkness": 0.85,
  "edgeSoftness": 0.92,
  "grainAmount": 0,
  "bloomStrength": 0,
  "bloomRadius": 0,
  "bloomThreshold": 0.76
}
```

## Parameter notes

| Param | Value | Effect |
|---|---|---|
| `activeBalls` | 6 | Six metaballs merge into the visible mass |
| `ballRadius` | 0.3 | Fairly large individual blobs |
| `smoothing` | 0.27 | Generous smooth-min blending — blobs read as one cohesive body, not distinct spheres |
| `orbitRadius` | 0.31 | Compact containment — the mass stays fairly close to center, not pressed against the outer boundary |
| `orbitSpeed` | 0.46 | Slow, calm bounce/merge cycle |
| `specularIntensity` | 1.4 | Present but soft highlight |
| `specularPower` | 4 | Low exponent — a broad, soft highlight rather than a tight shiny point |
| `fresnelPower` | 2.2 | Standard rim falloff |
| `fresnelIntensity` | 1.8 | Strong — the rim glow is the main light source, since bloom is off |
| `darkness` | 0.85 | Bright base palette |
| `edgeSoftness` | 0.92 | Very diffuse silhouette even at rest — fades into the void rather than a hard edge |
| `grainAmount` | 0 | Perfectly smooth surface, no dither texture |
| `bloomStrength` | 0 | No bloom at all — matte, not glowing |
| `bloomRadius` / `bloomThreshold` | 0 / 0.76 | Irrelevant while strength is 0 |

## Character

Chorus feels **composed, held, unified** — six parts blended into one calm whole. Good for:
- Idle / at-rest presence where a glow would feel too eager
- A "settled" counterpart to Spark's flame energy or Strato's drifting haze
- Contexts wanting a glassy, pearlescent read rather than a light source

### Thinking state

The single blended mass fragments into more, smaller, faster-moving parts — one voice splitting
into a chorus of quicker, chattering ones. Blob count rises from 6 to 8, each blob shrinks and
blends slightly less smoothly (more individually visible), and the bounce speed nearly triples.
The rim thins as fresnel power increases; everything else (darkness, edge softness, grain, bloom)
holds steady, so the shift reads purely as agitation of form and motion, not a lighting change.

```json
{
  "activeBalls": 8,
  "ballRadius": 0.15,
  "smoothing": 0.22,
  "orbitRadius": 0.31,
  "orbitSpeed": 1.34,
  "specularIntensity": 1.2,
  "specularPower": 4,
  "fresnelPower": 3.4,
  "fresnelIntensity": 1.8,
  "darkness": 0.85,
  "edgeSoftness": 0.92,
  "grainAmount": 0,
  "bloomStrength": 0,
  "bloomRadius": 0,
  "bloomThreshold": 0.76
}
```

| Param | Shift from Idle | Effect |
|---|---|---|
| `activeBalls` | 6 → 8 | More parts — literally more "voices" |
| `ballRadius` | 0.3 → 0.15 | Each part shrinks as the mass fragments |
| `smoothing` | 0.27 → 0.22 | Less blending — parts become more individually visible |
| `orbitSpeed` | 0.46 → 1.34 | Nearly 3x faster — rapid, agitated motion |
| `specularIntensity` | 1.4 → 1.2 | Slightly dimmer per-highlight as surface area splits across more/smaller blobs |
| `fresnelPower` | 2.2 → 3.4 | Rim thins |

Only Idle and Thinking are tuned so far — Listening/Speaking targets aren't defined yet and
should be tuned live in `/dev/orb-comparison` rather than guessed.

## Reference

Tuned via the comparison tool at `/dev/orb-comparison`, Flow Orb variant.
