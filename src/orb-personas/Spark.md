# Spark

**Orb persona** — tuned from reference video via `/dev/orb-comparison`.

A dark indigo sphere with a morphing pink/magenta hot region and soft violet halo. The noise field warps domain-style to create flame-like motion. Grain is subtle; bloom is present but not overpowering.

## Shader uniforms

```json
{
  "edgeSoftness": 0.1,
  "noiseScale": 2,
  "timeScale": 0.57,
  "darkness": 0.3,
  "hotLow": 0.56,
  "hotHigh": 0.87,
  "hotIntensity": 2.85,
  "envelopeSpeed": 0.69,
  "envelopeAmount": 0.58,
  "fresnelPower": 2.5,
  "fresnelIntensity": 0.45,
  "grainAmount": 0.005,
  "bloomStrength": 0.75,
  "bloomRadius": 0.6,
  "bloomThreshold": 0.18
}
```

## Parameter notes

| Param | Role |
|---|---|
| `edgeSoftness` | How soft the sphere silhouette is (0 = hard, 1 = fully diffuse) |
| `noiseScale` | Spatial frequency of the FBM field |
| `timeScale` | Speed of noise evolution |
| `darkness` | Base darkness of the sphere body (0 = black, 1 = full palette) |
| `hotLow` / `hotHigh` | Noise range that maps to the hot (pink/white) region |
| `hotIntensity` | Brightness multiplier for the hot region |
| `envelopeSpeed` | Speed of the domain-warp animation |
| `envelopeAmount` | Strength of the domain warp (0 = no warp, 1 = full) |
| `fresnelPower` | Exponent for rim lighting (higher = thinner rim) |
| `fresnelIntensity` | Brightness of the rim |
| `grainAmount` | Amplitude of the dither grain |
| `bloomStrength` | Post-process bloom intensity |
| `bloomRadius` | Bloom blur spread |
| `bloomThreshold` | Luminance threshold before bloom kicks in |

## State targets

For reactivity (idle → listening → thinking → speaking), scale these uniforms:

| State | timeScale | hotIntensity | envelopeAmount | bloomStrength |
|---|---|---|---|---|
| Idle | 0.57 | 2.85 | 0.58 | 0.75 |
| Listening | 1.2 | 3.5 | 0.8 | 1.0 |
| Thinking | 0.9 | 3.0 | 1.0 | 0.9 |
| Speaking | 1.5 | 4.0 | 0.6 | 1.2 |

Interpolate between states with exponential smoothing (critically-damped spring), never snap.

## Reference

Tuned against `apps/docs/public/reference-orb.mp4` using the comparison tool at `/dev/orb-comparison`.
