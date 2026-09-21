/**
 * The GLSL source for both orb variants, extracted from the `/dev/orb-comparison` tuning sandbox
 * (`apps/docs/src/app/dev/orb-comparison/page.tsx`, which imports these same constants rather than
 * keeping its own copy) so `AssistantOrb`'s persona rendering and the tuning sandbox stay bit-for-
 * bit identical — a persona tuned in the sandbox looks exactly the same wherever it's rendered.
 *
 * This file has zero runtime dependency on `three` — it's plain strings, safe to import from
 * anywhere without pulling in the renderer. Only `createOrbRenderer.ts` touches `three` itself.
 */

export const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Shared GLSL: noise, the tumble rotation, the cosine palette, the analytic ray-sphere test, the
// smooth-min primitive, and a shared 4-tap normal calculation (calling each variant's own
// sceneSDF) — every function both orb variants build on, kept in one place so the two variants'
// own shader source stays focused on what actually differs between them (a hollow shell vs.
// clipped, magnetically-contained metaballs).
export const GLSL_COMMON = `
  // Simplex noise from Ashima/webgl-noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Fractal Brownian Motion
  float fbm(vec3 p) {
    float f = 0.0;
    f += 0.5000 * snoise(p); p *= 2.02;
    f += 0.2500 * snoise(p); p *= 2.03;
    f += 0.1250 * snoise(p); p *= 2.01;
    f += 0.0625 * snoise(p);
    return f;
  }

  // Domain-warped FBM - the "flame"/flow effect
  float warpedFbm(vec3 p, float time) {
    vec3 q = vec3(fbm(p + vec3(0.0, 0.0, time)),
                  fbm(p + vec3(5.2, 1.3, time)),
                  fbm(p + vec3(1.7, 9.2, time)));
    vec3 r = vec3(fbm(p + 4.0 * q + vec3(1.7, 9.2, 0.15 * time)),
                  fbm(p + 4.0 * q + vec3(8.3, 2.8, 0.126 * time)),
                  fbm(p + 4.0 * q + vec3(1.8, 8.3, 0.15 * time)));
    return fbm(p + 4.0 * r);
  }

  // IQ's cosine palette. This particular phase set puts t~0.3 solidly in blue/cyan — the
  // indigo-through-magenta band both orb variants actually want lives in the narrow wrap-around
  // range roughly t in [-0.05, 0.2] instead (see each variant's own colorT mapping).
  vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);
    return a + b * cos(6.28318 * (c * t + d));
  }

  // Analytic ray-sphere intersection.
  float sphereIntersect(vec3 ro, vec3 rd, float radius) {
    float b = dot(ro, rd);
    float c = dot(ro, ro) - radius * radius;
    float h = b * b - c;
    if (h < 0.0) return -1.0;
    return -b - sqrt(h);
  }

  vec3 rotateAxis(vec3 p, vec3 axis, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return p * c + cross(axis, p) * s + axis * dot(axis, p) * (1.0 - c);
  }

  // Two fixed, non-parallel axes at different speeds — a real tumble, not a spin around one axis
  // (which would repeat its silhouette every rotation).
  vec3 tumble(vec3 p, float t) {
    p = rotateAxis(p, normalize(vec3(0.4, 1.0, 0.2)), t * 0.7);
    p = rotateAxis(p, normalize(vec3(1.0, 0.3, 0.5)), t * 0.45);
    return p;
  }

  float dither(vec2 coord, float time) {
    return fract(sin(dot(coord, vec2(12.9898, 78.233)) + time) * 43758.5453);
  }

  // Polynomial smooth-min — blends two SDFs into one rounded union instead of a hard min().
  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / max(k, 0.0001), 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  // Each variant defines its own sceneSDF(position, time) with this exact signature; this forward
  // declaration lets the shared normal calculation below call it regardless of which variant's
  // shader it ends up compiled into.
  float sceneSDF(vec3 p, float time);

  // The 4-tap "tetrahedron" technique — one fewer pair of opposing samples than the naive 6-tap
  // central-difference normal, which matters here because every tap is a full raymarch distance
  // evaluation run again for every visible pixel.
  vec3 calcNormal(vec3 p, float time) {
    const float h = 0.0005;
    const vec2 k = vec2(1.0, -1.0);
    return normalize(
      k.xyy * sceneSDF(p + k.xyy * h, time) +
      k.yyx * sceneSDF(p + k.yyx * h, time) +
      k.yxy * sceneSDF(p + k.yxy * h, time) +
      k.xxx * sceneSDF(p + k.xxx * h, time)
    );
  }
`;

// ---------------------------------------------------------------------------------------------
// Solid Orb — a raymarched hollow spherical shell with a circular opening (a "bowl"), tumbling in
// 3D. Reconstructed from real frames extracted from reference-orb.mp4: the reference shows at
// least four distinct silhouettes (a near-full circle, a narrow edge-on lens, a Pac-Man-style
// wedge notch, and a circle with a bright seam crossing its face) — one rigid tumbling shape, not
// a fixed sphere with only an internal effect. The opening's rim is a real exposed CSG cut face,
// which is why it always reads as a distinct bright edge rather than a shading trick.
// ---------------------------------------------------------------------------------------------
export const SOLID_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uShellThickness;
  uniform float uOpeningSize;
  uniform float uRotationSpeed;
  uniform float uRimIntensity;
  uniform float uInnerBrightness;
  uniform float uEdgeSoftness;
  uniform float uEnvelopeSpeed;
  uniform float uEnvelopeAmount;
  uniform float uNoiseScale;
  uniform float uTimeScale;
  uniform float uDarkness;
  uniform float uHotLow;
  uniform float uHotHigh;
  uniform float uHotIntensity;
  uniform float uFresnelPower;
  uniform float uFresnelIntensity;
  uniform float uGrainAmount;
  uniform float uHueShift;
  uniform float uHueSpread;
  varying vec2 vUv;

  ${GLSL_COMMON}

  #define SHELL_RADIUS 0.8

  // The two CSG halves, kept separate (rather than pre-combined into one float) so the caller can
  // tell which surface is active at a hit point: whichever of the two is larger is the one
  // actually forming the boundary there (see isCutFace in main()). Reads uShellThickness/
  // uOpeningSize directly rather than taking them as parameters — they're the same every call
  // within a frame, so there's no reason to thread them through every raymarch/normal-tap call.
  vec2 sceneSDFParts(vec3 p, float t) {
    vec3 pObj = tumble(p, t);
    float shell = abs(length(pObj) - SHELL_RADIUS) - uShellThickness;
    // openingSize 0 = closed sphere, 1 = fully removed; the cut plane's local-z offset runs from
    // +radius (nothing cut) down through 0 (an exact half-shell "bowl") to -radius.
    float cutHeight = SHELL_RADIUS * (1.0 - 2.0 * uOpeningSize);
    float cut = pObj.z - cutHeight;
    return vec2(shell, cut);
  }

  float sceneSDF(vec3 p, float t) {
    vec2 parts = sceneSDFParts(p, t);
    return max(parts.x, parts.y);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);

    vec3 ro = vec3(0.0, 0.0, 2.5);
    vec3 rd = normalize(vec3(uv * 1.5, -1.0));

    float rotT = uTime * uRotationSpeed;

    float outerBound = SHELL_RADIUS + uShellThickness + 0.05;
    float tBound = sphereIntersect(ro, rd, outerBound);
    if (tBound < 0.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    float dist = max(tBound - 0.05, 0.0);
    float maxDist = tBound + outerBound * 2.2;
    bool didHit = false;
    vec3 pos = ro;
    for (int i = 0; i < 48; i++) {
      pos = ro + rd * dist;
      float d = sceneSDF(pos, rotT);
      if (d < 0.001) { didHit = true; break; }
      dist += d;
      if (dist > maxDist) break;
    }

    if (!didHit) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    vec3 normal = calcNormal(pos, rotT);
    vec3 viewDirRaw = normalize(ro - pos);

    vec3 pObj = tumble(pos, rotT);
    vec2 parts = sceneSDFParts(pos, rotT);
    bool isCutFace = parts.y > parts.x;
    bool isInner = length(pObj) < SHELL_RADIUS;

    float noise = warpedFbm(pObj * uNoiseScale, uTime * uTimeScale);

    // uHueShift/uHueSpread pick where on the palette's cosine wheel this persona lives and how far
    // the noise excursion travels around it — the wheel cycles indigo/magenta (~0.0-0.2) -> blue/
    // cyan (~0.3-0.5) -> orange/red (~0.75-1.0), so different personas can occupy genuinely
    // different hue families, not just different brightness/motion on the same fixed hue band.
    float colorT = noise * uHueSpread + uHueShift;
    vec3 color = palette(colorT) * uDarkness;

    float envelope = snoise(pObj * 0.8 + vec3(0.0, 0.0, uTime * uEnvelopeSpeed));
    float hotLow = clamp(uHotLow - envelope * uEnvelopeAmount, 0.0, 1.0);
    float hotHigh = clamp(uHotHigh - envelope * uEnvelopeAmount, hotLow + 0.05, 1.0);
    float hotMask = smoothstep(hotLow, hotHigh, noise);
    color += vec3(1.0, 0.5, 0.9) * hotMask * uHotIntensity;

    if (isInner) {
      color *= uInnerBrightness;
    }

    if (isCutFace) {
      float rimNoise = 0.85 + 0.15 * noise;
      color += vec3(1.0, 0.65, 0.92) * rimNoise * uRimIntensity;
    }

    float NdotV = max(dot(normal, viewDirRaw), 0.0);
    float fresnel = pow(1.0 - NdotV, uFresnelPower);
    color += vec3(0.4, 0.2, 0.6) * fresnel * uFresnelIntensity;

    float grain = dither(gl_FragCoord.xy, uTime) * (uGrainAmount * 2.0) - uGrainAmount;
    color += grain;

    float alpha = smoothstep(0.0, uEdgeSoftness, NdotV);

    gl_FragColor = vec4(color, alpha);
  }
`;

// ---------------------------------------------------------------------------------------------
// Flow Orb — a second reading of the reference, replacing an earlier "flat sheets" hypothesis
// (which was both wrong and, with a per-step domain-warped noise call, catastrophically slow):
// amorphous metaball blobs whose union is intersected with an invisible bounding sphere. The
// sphere both *clips* the blobs (nothing renders past its radius, giving a clean spherical
// silhouette) and constrains their motion (each blob's distance from center bounces between the
// center and the wall, like it's contained by a magnetic field rather than free-floating), so the
// visible result reads as one solid, continuously-mutating sphere even though the surface itself
// is made of merging/separating blobs, not a fixed shape. All geometry here is analytic distance
// math — no noise inside the raymarch loop — specifically because that's what made the sheets
// version unusably slow.
// ---------------------------------------------------------------------------------------------
export const FLOW_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uActiveBalls;
  uniform float uBallRadius;
  uniform float uSmoothing;
  uniform float uOrbitRadius;
  uniform float uOrbitSpeed;
  uniform float uSpecularIntensity;
  uniform float uSpecularPower;
  uniform float uFresnelPower;
  uniform float uFresnelIntensity;
  uniform float uDarkness;
  uniform float uEdgeSoftness;
  uniform float uGrainAmount;
  varying vec2 vUv;

  ${GLSL_COMMON}

  #define CONTAINER_RADIUS 0.8
  #define MAX_BALLS 8

  // Each blob's distance from center bounces between ~30% and 100% of uOrbitRadius via abs(sin(...))
  // (which reflects at 0 instead of going negative) rather than smoothly orbiting at a fixed
  // radius — the literal "bouncing off a magnetic field" containment, not a free orbit.
  vec3 metaballCenter(float i, float time) {
    float speed = uOrbitSpeed * (0.7 + 0.23 * i);
    float phase = i * 2.399963; // golden-angle-ish spread so blobs don't sync up
    float radial = uOrbitRadius * (0.55 + 0.45 * abs(sin(time * speed * 0.6 + phase * 1.3)));
    vec3 axis = normalize(vec3(0.4 + 0.3 * sin(i), 1.0, 0.3 + 0.2 * cos(i * 1.7)));
    vec3 dir = normalize(vec3(
      cos(time * speed + phase),
      sin(time * speed * 0.8 + phase * 1.1),
      sin(time * speed * 1.2 + phase * 0.7)
    ));
    dir = rotateAxis(dir, axis, time * speed * 0.3);
    return dir * radial;
  }

  // Pure analytic distance math, no noise calls — this loop runs per raymarch step, and it was a
  // per-step domain-warped-noise call here in the previous "sheets" version that made the whole
  // page unusably slow.
  float metaballUnion(vec3 p, float time) {
    float d = 1.0e5;
    for (int i = 0; i < MAX_BALLS; i++) {
      if (i >= int(uActiveBalls + 0.5)) break;
      vec3 c = metaballCenter(float(i), time);
      float db = length(p - c) - uBallRadius;
      d = smin(d, db, uSmoothing);
    }
    return d;
  }

  // CSG intersection with the container sphere — this is the "clip" that keeps the silhouette a
  // clean sphere no matter how the blobs merge/separate inside it.
  float sceneSDF(vec3 p, float time) {
    float balls = metaballUnion(p, time);
    float container = length(p) - CONTAINER_RADIUS;
    return max(balls, container);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);

    vec3 ro = vec3(0.0, 0.0, 2.5);
    vec3 rd = normalize(vec3(uv * 1.5, -1.0));

    float outerBound = CONTAINER_RADIUS + 0.05;
    float tBound = sphereIntersect(ro, rd, outerBound);
    if (tBound < 0.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    float dist = max(tBound - 0.05, 0.0);
    float maxDist = tBound + outerBound * 2.2;
    bool didHit = false;
    vec3 pos = ro;
    for (int i = 0; i < 48; i++) {
      pos = ro + rd * dist;
      float d = sceneSDF(pos, uTime);
      if (d < 0.001) { didHit = true; break; }
      dist += d;
      if (dist > maxDist) break;
    }

    if (!didHit) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    vec3 normal = calcNormal(pos, uTime);
    vec3 viewDirRaw = normalize(ro - pos);

    // Which surface is actually visible here: the blob's own bumpy surface, or the flat spherical
    // patch where the container clipped a blob flush at the boundary — cheap to tell apart since
    // sceneSDF is just the max() of the two.
    float ballsVal = metaballUnion(pos, uTime);
    float containerVal = length(pos) - CONTAINER_RADIUS;
    bool isClipFace = containerVal > ballsVal;

    // One single fbm sample at the hit point for surface variation — not per raymarch step, so it
    // costs the same as the Solid Orb's own per-pixel noise call, nothing like the sheets version.
    float surfN = fbm(pos * 2.2 + uTime * 0.05);
    float colorT = surfN * 0.13 + 0.08;
    vec3 color = palette(colorT) * uDarkness;

    if (isClipFace) {
      // Where a blob presses flush against the containment, the surface reads smoother and
      // brighter — held metal against glass — rather than the organic blob material.
      color = mix(color, vec3(dot(color, vec3(0.333))), 0.35);
      color *= 1.2;
    }

    vec3 lightDir = normalize(vec3(0.6, 0.7, 0.5));
    vec3 halfDir = normalize(lightDir + viewDirRaw);
    float spec = pow(max(dot(normal, halfDir), 0.0), uSpecularPower) * uSpecularIntensity;
    color += vec3(1.0, 0.92, 1.0) * spec;

    float NdotV = max(dot(normal, viewDirRaw), 0.0);
    float fresnel = pow(1.0 - NdotV, uFresnelPower);
    color += vec3(0.5, 0.3, 0.7) * fresnel * uFresnelIntensity;

    float grain = dither(gl_FragCoord.xy, uTime) * (uGrainAmount * 2.0) - uGrainAmount;
    color += grain;

    float alpha = smoothstep(0.0, uEdgeSoftness, NdotV);

    gl_FragColor = vec4(color, alpha);
  }
`;
