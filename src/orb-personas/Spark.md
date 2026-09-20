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
  "fresnelIntensity": 0.15,
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
| Speaking | 1.5 | 4.0 | 0.6 | 1.2 |

Interpolate between states with exponential smoothing (critically-damped spring), never snap.

### Thinking state

A more introspective, contained Spark. The hot region contracts and dims, the grain becomes visible, bloom tightens into a crisp core glow, and the fresnel rim nearly disappears — the orb turns inward.

```json
{
  "edgeSoftness": 0.86,
  "noiseScale": 1.7,
  "timeScale": 0.25,
  "darkness": 0.45,
  "hotLow": 0.26,
  "hotHigh": 0.38,
  "hotIntensity": 1,
  "envelopeSpeed": 0.43,
  "envelopeAmount": 0.26,
  "fresnelPower": 4.3,
  "fresnelIntensity": 0.1,
  "grainAmount": 0.085,
  "bloomStrength": 1.4,
  "bloomRadius": 0.12,
  "bloomThreshold": 0.34
}
```

| Param | Shift from Idle | Effect |
|---|---|---|
| `edgeSoftness` | 0.1 → 0.86 | Silhouette goes diffuse, orb "softens" |
| `timeScale` | 0.57 → 0.25 | Motion slows — contemplative |
| `hotIntensity` | 2.85 → 1.0 | Hot region dims significantly |
| `hotLow` / `hotHigh` | 0.56/0.87 → 0.26/0.38 | Hot band narrows and shifts lower — smaller, tighter core |
| `envelopeAmount` | 0.58 → 0.26 | Warp relaxes — less agitation |
| `fresnelPower` | 2.5 → 4.3 | Rim thins out |
| `fresnelIntensity` | 0.45 → 0.1 | Rim nearly disappears |
| `grainAmount` | 0.005 → 0.085 | Grain becomes visible — texture emerges |
| `bloomStrength` | 0.75 → 1.4 | Bloom intensifies |
| `bloomRadius` | 0.6 → 0.12 | Bloom tightens from wide halo to crisp core glow |

## Reference

Tuned against `apps/docs/public/reference-orb.mp4` using the comparison tool at `/dev/orb-comparison`.
