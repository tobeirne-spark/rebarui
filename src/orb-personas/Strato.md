# Strato

**Orb persona** — tuned from `/dev/orb-comparison`.

A softer, more atmospheric orb. Higher edge softness gives it a diffuse, cloud-like silhouette. Slower time scale and lower noise scale produce a calm, drifting motion. Stronger bloom and fresnel create a pronounced halo. The hot region is subdued — more of a warm glow than a flame.

## Shader uniforms

```json
{
  "edgeSoftness": 0.24,
  "noiseScale": 1.2,
  "timeScale": 0.06,
  "darkness": 0.55,
  "hotLow": 0.34,
  "hotHigh": 0.15,
  "hotIntensity": 0.55,
  "envelopeSpeed": 0.82,
  "envelopeAmount": 0.42,
  "fresnelPower": 2,
  "fresnelIntensity": 0.3,
  "grainAmount": 0.02,
  "bloomStrength": 2.05,
  "bloomRadius": 0.62,
  "bloomThreshold": 0.3
}
```

## Parameter notes

| Param | Value | Effect |
|---|---|---|
| `edgeSoftness` | 0.24 | Soft, diffuse silhouette — cloud-like edge |
| `noiseScale` | 1.2 | Large, slow noise features |
| `timeScale` | 0.06 | Very slow, calm evolution |
| `darkness` | 0.55 | Mid-tone base — not too dark, not too bright |
| `hotLow` / `hotHigh` | 0.34 / 0.15 | Narrow, inverted hot band — subtle warm glow |
| `hotIntensity` | 0.55 | Gentle hot region, not punchy |
| `envelopeSpeed` | 0.82 | Moderate warp animation speed |
| `envelopeAmount` | 0.42 | Mild domain warp |
| `fresnelPower` | 2 | Standard rim falloff |
| `fresnelIntensity` | 1.5 | Strong rim — prominent halo edge |
| `grainAmount` | 0.02 | Visible but fine grain |
| `bloomStrength` | 2.05 | Strong bloom — big soft halo |
| `bloomRadius` | 0.62 | Wide bloom spread |
| `bloomThreshold` | 0.3 | Low threshold — more of the orb blooms |

## Character

Strato feels **calm, ambient, atmospheric**. Compared to Spark (which is energetic and flame-like), Strato drifts slowly with a wide soft glow. Good for:
- Idle / background presence
- "Thinking" state where you want calm rather than agitation
- Low-attention contexts where the orb shouldn't demand focus

## State targets

For reactivity (idle → listening → speaking), scale these uniforms:

| State | timeScale | hotIntensity | envelopeAmount | bloomStrength |
|---|---|---|---|---|
| Idle | 0.06 | 0.55 | 0.42 | 2.05 |
| Listening | 0.15 | 0.8 | 0.6 | 2.2 |
| Speaking | 0.2 | 1.0 | 0.5 | 2.5 |

Interpolate between states with exponential smoothing (critically-damped spring), never snap.

### Thinking state

Strato turns inward — the cloud condenses. Darkness maxes out, the hot band widens and brightens into a defined core, grain becomes coarse, and the bloom swells outward while the rim pulls back. The orb goes from "atmospheric haze" to "dense, luminous mass with a soft corona."

```json
{
  "edgeSoftness": 0.92,
  "noiseScale": 3.3,
  "timeScale": 0.25,
  "darkness": 1,
  "hotLow": 0.03,
  "hotHigh": 0.4,
  "hotIntensity": 1.7,
  "envelopeSpeed": 0.87,
  "envelopeAmount": 0.4,
  "fresnelPower": 4.3,
  "fresnelIntensity": 0.3,
  "grainAmount": 0.09,
  "bloomStrength": 1.6,
  "bloomRadius": 0.88,
  "bloomThreshold": 0.72
}
```

| Param | Shift from Idle | Effect |
|---|---|---|
| `edgeSoftness` | 0.24 → 0.92 | Silhouette goes fully diffuse — orb dissolves into haze |
| `noiseScale` | 1.2 → 3.3 | Fine, turbulent noise — texture tightens |
| `timeScale` | 0.06 → 0.25 | Motion quickens slightly — internal churning |
| `darkness` | 0.55 → 1.0 | Base goes fully dark — only the hot region and bloom remain visible |
| `hotLow` / `hotHigh` | 0.34/0.15 → 0.03/0.4 | Hot band widens dramatically — large luminous core |
| `hotIntensity` | 0.55 → 1.7 | Hot region brightens significantly |
| `fresnelPower` | 2 → 4.3 | Rim thins |
| `fresnelIntensity` | 1.5 → 0.3 | Rim nearly vanishes |
| `grainAmount` | 0.02 → 0.09 | Grain becomes coarse and visible |
| `bloomStrength` | 2.05 → 1.6 | Bloom eases slightly |
| `bloomRadius` | 0.62 → 0.88 | Bloom spreads wider — soft corona |
| `bloomThreshold` | 0.3 → 0.72 | Only the brightest pixels bloom — cleaner halo |

## Reference

Tuned via the comparison tool at `/dev/orb-comparison`.
