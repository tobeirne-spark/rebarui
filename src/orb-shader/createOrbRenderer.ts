import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ORB_VARIANTS, uniformName, type OrbVariantId } from "./params";
import { VERTEX_SHADER } from "./shaders";

/**
 * This is the only file in `orb-shader/` that imports `three` — everything else (shaders.ts,
 * params.ts) is plain strings/data, safe to import from anywhere. Callers that want to avoid
 * paying for `three` in their bundle unless an orb is actually rendered should
 * `await import("./createOrbRenderer")` rather than a static import (see `AssistantOrb.tsx`).
 */

export interface OrbRendererHandle {
  /**
   * Push new target values for any subset of the variant's params. With `smooth: true`, values
   * approach their targets via exponential smoothing over subsequent frames (a close, simpler
   * stand-in for a critically-damped spring — it never overshoots) instead of snapping instantly.
   * Orb-persona state changes (idle → thinking → ...) want `smooth: true`; direct slider input
   * (the `/dev/orb-comparison` sandbox) wants the instant default.
   */
  setParams(next: Record<string, number>, options?: { smooth?: boolean }): void;
  dispose(): void;
}

export interface CreateOrbRendererOptions {
  /** Exponential-smoothing time constant, in seconds. Default 0.35s. */
  smoothingTau?: number;
}

// The shader's own geometry is resolution-independent (a normalized-UV sphere always fills the
// same fraction of the frame at any resolution) — but UnrealBloomPass's mip-chain kernel sizes
// are not: at a genuinely tiny render target (a 56px trigger button, say) the same blur kernel
// covers a much larger fraction of the image than at a larger one, washing detail into a soft dot
// instead of the crisp shape a bigger instance shows. Rendering at least this many pixels
// internally regardless of the canvas's actual CSS size — and letting the browser's normal
// image-scaling handle the visual downscale to whatever size was requested — keeps a small
// instance's bloom/shape characteristics visually identical to a large one, just smaller.
const MIN_RENDER_SIZE = 160;

export function createOrbRenderer(
  canvas: HTMLCanvasElement,
  variantId: OrbVariantId,
  initialParams: Record<string, number>,
  options: CreateOrbRendererOptions = {},
): OrbRendererHandle {
  const variant = ORB_VARIANTS[variantId];
  const tau = options.smoothingTau ?? 0.35;

  const rect = canvas.getBoundingClientRect();
  let width = Math.max(rect.width || 1, MIN_RENDER_SIZE);
  let height = Math.max(rect.height || 1, MIN_RENDER_SIZE);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setPixelRatio(pixelRatio);
  // The hot-core/rim/specular terms stack additively and easily exceed 1.0 several times over.
  // Without tone mapping that just hard-clips to flat white the moment any one term runs hot.
  // ACES compresses the highlights instead of clipping them.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  // `setSize`'s default `updateStyle=true` overwrites the canvas's own CSS width/height with fixed
  // pixel values, fighting whatever layout sized the canvas. `false` leaves our own CSS sizing
  // alone and only sets the WebGL drawing buffer resolution.
  renderer.setSize(width, height, false);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    initialParams.bloomStrength ?? 0,
    initialParams.bloomRadius ?? 0,
    initialParams.bloomThreshold ?? 1,
  );
  composer.addPass(bloomPass);
  // Tone mapping only takes effect on the pass that actually writes to the screen. UnrealBloomPass
  // composites in linear space with `renderToScreen` off by default, so without this final pass
  // the renderer's ACES tone mapping never runs and highlights hard-clip to white instead of
  // compressing.
  composer.addPass(new OutputPass());

  const geometry = new THREE.PlaneGeometry(2, 2);

  const uniforms: Record<string, THREE.IUniform> = {
    uTime: { value: 0 },
    // Device pixels, not CSS pixels — must match what gl_FragCoord actually reports, or the
    // shader's "screen center" calculation is off by exactly the device pixel ratio on any
    // HiDPI/Retina display.
    uResolution: { value: new THREE.Vector2(width * pixelRatio, height * pixelRatio) },
  };
  for (const p of variant.params) {
    if (p.target === "uniform") uniforms[uniformName(p.key)] = { value: initialParams[p.key] ?? p.default };
  }

  const material = new THREE.ShaderMaterial({
    transparent: true,
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: variant.fragmentShader,
  });

  const quad = new THREE.Mesh(geometry, material);
  scene.add(quad);

  const handleResize = () => {
    const newRect = canvas.getBoundingClientRect();
    width = Math.max(newRect.width || 1, MIN_RENDER_SIZE);
    height = Math.max(newRect.height || 1, MIN_RENDER_SIZE);
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    (uniforms.uResolution?.value as THREE.Vector2).set(width * pixelRatio, height * pixelRatio);
  };
  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(canvas);

  // Current + target value per param, for the optional exponential-smoothing path described on
  // `setParams` above.
  const current: Record<string, number> = { ...initialParams };
  const target: Record<string, number> = { ...initialParams };

  let time = 0;
  let lastFrame = performance.now();
  let disposed = false;
  let rafId = 0;

  const animate = () => {
    if (disposed) return;
    rafId = requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    time += 0.016;
    uniforms.uTime!.value = time;

    const alpha = 1 - Math.exp(-dt / tau);
    for (const p of variant.params) {
      const t = target[p.key];
      if (t === undefined) continue;
      const c = current[p.key];
      current[p.key] = c === undefined ? t : c + (t - c) * alpha;
      const value = current[p.key]!;
      if (p.target === "uniform") {
        uniforms[uniformName(p.key)]!.value = value;
      } else if (p.key === "bloomStrength") {
        bloomPass.strength = value;
      } else if (p.key === "bloomRadius") {
        bloomPass.radius = value;
      } else if (p.key === "bloomThreshold") {
        bloomPass.threshold = value;
      }
    }

    composer.render();
  };
  animate();

  return {
    setParams(next, opts = {}) {
      const smooth = opts.smooth ?? false;
      for (const [key, value] of Object.entries(next)) {
        target[key] = value;
        if (!smooth) current[key] = value;
      }
    },
    dispose() {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      renderer.dispose();
      composer.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
