# Strato

**Orb persona** — tuned from `/dev/orb-comparison`.

A softer, more atmospheric orb, in a warm autumn palette (gold -> orange -> brick red) rather than
the indigo/magenta band the shader's own hardcoded default (and Spark) uses — `hueShift`/
`hueSpread` steer the noise-driven color onto a different arc of the same cosine palette. Higher
edge softness gives it a diffuse, cloud-like silhouette. Slower time scale and lower noise scale
produce a calm, drifting motion. Bloom is present but restrained — an earlier tuning pass
(`bloomStrength: 2.05`, `bloomThreshold: 0.3`) bloomed almost the entire orb into an overwhelming
white-hot mass, which read as intense rather than calm; toned down here to an actual soft glow.

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
  "hueShift": 0.85,
  "hueSpread": 0.16,
  "grainAmount": 0.02,
  "bloomStrength": 0.7,
  "bloomRadius": 0.62,
  "bloomThreshold": 0.55
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
| `fresnelIntensity` | 0.3 | Soft rim, not a blown-out halo edge |
| `hueShift` | 0.85 | Centers the palette on vivid orange (the cosine wheel's warm arc) |
| `hueSpread` | 0.16 | Noise excursion stays within pale gold -> orange -> brick red, never wrapping into the indigo/cyan band |
| `grainAmount` | 0.02 | Visible but fine grain |
| `bloomStrength` | 0.7 | Present but restrained — a soft glow, not a wash |
| `bloomRadius` | 0.62 | Wide bloom spread |
| `bloomThreshold` | 0.55 | Selective — only the genuinely bright pixels bloom |

## Character

Strato feels **calm, ambient, atmospheric**. Compared to Spark (which is energetic and flame-like), Strato drifts slowly with a wide soft glow. Good for:
- Idle / background presence
- "Thinking" state where you want calm rather than agitation
- Low-attention contexts where the orb shouldn't demand focus

## State targets

For reactivity (idle → listening → speaking), scale these uniforms:

| State | timeScale | hotIntensity | envelopeAmount | bloomStrength |
|---|---|---|---|---|
| Idle | 0.06 | 0.55 | 0.42 | 0.7 |
| Listening | 0.15 | 0.8 | 0.6 | 0.85 |
| Speaking | 0.2 | 1.0 | 0.5 | 1.0 |

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
  "hueShift": 0.85,
  "hueSpread": 0.16,
  "grainAmount": 0.09,
  "bloomStrength": 0.8,
  "bloomRadius": 0.88,
  "bloomThreshold": 0.72
}
```

Same `hueShift`/`hueSpread` as Idle — only brightness/motion/spread shift between states, not the
hue family, or Thinking would visually jump to a different orb entirely.

| Param | Shift from Idle | Effect |
|---|---|---|
| `edgeSoftness` | 0.24 → 0.92 | Silhouette goes fully diffuse — orb dissolves into haze |
| `noiseScale` | 1.2 → 3.3 | Fine, turbulent noise — texture tightens |
| `timeScale` | 0.06 → 0.25 | Motion quickens slightly — internal churning |
| `darkness` | 0.55 → 1.0 | Base goes fully dark — only the hot region and bloom remain visible |
| `hotLow` / `hotHigh` | 0.34/0.15 → 0.03/0.4 | Hot band widens dramatically — large luminous core |
| `hotIntensity` | 0.55 → 1.7 | Hot region brightens significantly |
| `fresnelPower` | 2 → 4.3 | Rim thins |
| `fresnelIntensity` | 0.3 → 0.3 | Unchanged — rim stays soft in both states |
| `grainAmount` | 0.02 → 0.09 | Grain becomes coarse and visible |
| `bloomStrength` | 0.7 → 0.8 | Bloom swells slightly |
| `bloomRadius` | 0.62 → 0.88 | Bloom spreads wider — soft corona |
| `bloomThreshold` | 0.55 → 0.72 | Only the brightest pixels bloom — cleaner halo |

## Reference

Tuned via the comparison tool at `/dev/orb-comparison`.
