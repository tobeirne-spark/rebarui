import { useEffect, useRef } from "react";
import type { OrbInteractionState, OrbPersonaId } from "../orb-personas/personas";
import { ORB_PERSONAS, resolveOrbPersonaState } from "../orb-personas/personas";
import type { OrbRendererHandle } from "../orb-shader/createOrbRenderer";

export interface AssistantOrbProps {
  size?: number;
  color?: string;
  isActive?: boolean;
  className?: string;
  /**
   * Renders one of the tuned WebGL orb personas (`packages/core/src/orb-personas/*.md`) instead
   * of the lightweight 2D-canvas fallback below. This dynamically imports `three` — only paid for
   * by consumers who actually set a persona — so keep this to a single, prominent instance (e.g.
   * the trigger button), not one per chat message; each instance runs its own WebGL context and
   * render loop.
   */
  persona?: OrbPersonaId;
  /** Which of the persona's tuned interaction states to target. Ignored without `persona`. */
  state?: OrbInteractionState;
}

/**
 * The assistant's orb visual. Defaults to a cheap 2D-canvas metaball animation; pass `persona` to
 * render one of the real tuned WebGL shaders instead (see `PersonaOrb` below).
 */
export function AssistantOrb({ size = 56, color = "#0066cc", isActive = false, className, persona, state = "idle" }: AssistantOrbProps) {
  if (persona) {
    return <PersonaOrb size={size} className={className} persona={persona} state={state} />;
  }
  return <ClassicOrb size={size} color={color} isActive={isActive} className={className} />;
}

/**
 * The real tuned shader, loaded lazily. `createOrbRenderer` is the only module under
 * `orb-shader/` that imports `three` — dynamically importing it here (rather than a static
 * top-level import) keeps `three` out of the bundle for every consumer that never sets a
 * `persona`, per this component's own doc comment.
 */
function PersonaOrb({
  size,
  className,
  persona,
  state,
}: {
  size: number;
  className?: string;
  persona: OrbPersonaId;
  state: OrbInteractionState;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<OrbRendererHandle | null>(null);
  // `state` can change while the dynamic import below is still in flight; the creation effect
  // reads this ref (not the `state` value closed over when it started) so the very first frame
  // reflects whatever's current by the time `three` finishes loading, not what was current when
  // loading began.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Persona changes (not just state changes) need a full rebuild — different personas can use
  // different shader variants (Spark/Strato are the hollow-shell Solid Orb, Chorus is the
  // metaball Flow Orb), which are different compiled shader programs.
  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;
    const personaDef = ORB_PERSONAS[persona];

    import("../orb-shader/createOrbRenderer")
      .then(({ createOrbRenderer }) => {
        if (cancelled || !canvasRef.current) return;
        try {
          const renderer = createOrbRenderer(
            canvasRef.current,
            personaDef.variant,
            resolveOrbPersonaState(personaDef, stateRef.current),
          );
          renderer.setParams(resolveOrbPersonaState(personaDef, stateRef.current), { smooth: false });
          rendererRef.current = renderer;
        } catch {
          // WebGL unavailable or context creation failed — this is a decorative element, not
          // critical UI, so leave the canvas blank rather than crash the assistant.
        }
      })
      .catch(() => {
        // Dynamic import itself failed (e.g. offline on first load with no cache) — same
        // graceful-degradation stance as a WebGL failure above.
      });

    return () => {
      cancelled = true;
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, [persona]);

  // Interpolate between states with exponential smoothing, never snap — per each persona doc's
  // own "State targets" section.
  useEffect(() => {
    const personaDef = ORB_PERSONAS[persona];
    rendererRef.current?.setParams(resolveOrbPersonaState(personaDef, state), { smooth: true });
  }, [persona, state]);

  return <canvas ref={canvasRef} className={className} style={{ width: size, height: size }} aria-hidden="true" />;
}

/**
 * Canvas-based fluid orb animation inspired by Siri's visual design.
 * Uses metaball rendering with noise-based displacement for an organic,
 * living feel. Much more polished than CSS-only animations.
 */
function ClassicOrb({ size = 56, color = "#0066cc", isActive = false, className }: Omit<AssistantOrbProps, "persona" | "state">) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  // Canvas needs extra padding for glow effect
  const padding = 20;
  const canvasSize = size + padding * 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    ctx.scale(dpr, dpr);

    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const baseRadius = size * 0.3;

    // Parse color to RGB for canvas operations
    const parseColor = (colorStr: string): { r: number; g: number; b: number } => {
      // Handle CSS variables - resolve them
      if (colorStr.startsWith("var(")) {
        // Extract first fallback color from var(--name, fallback1, fallback2, ...)
        const match = colorStr.match(/var\([^,]+,\s*([^,)]+)/);
        if (match && match[1]) {
          return parseColor(match[1].trim());
        }
        return { r: 0, g: 102, b: 204 }; // Default fallback
      }
      // Handle hex colors
      if (colorStr.startsWith("#")) {
        const hex = colorStr.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return { r, g, b };
      }
      // Handle rgb/rgba
      const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return {
          r: parseInt(match[1] ?? "0"),
          g: parseInt(match[2] ?? "0"),
          b: parseInt(match[3] ?? "0"),
        };
      }
      // Default fallback
      return { r: 0, g: 102, b: 204 };
    };

    const rgb = parseColor(color ?? "#0066cc");

    // Simplex-like noise function (simplified for performance)
    const noise = (x: number, y: number, t: number): number => {
      return Math.sin(x * 3 + t) * Math.cos(y * 3 + t * 0.7) * 0.5 +
             Math.sin(x * 7 - t * 1.3) * Math.cos(y * 5 + t * 0.9) * 0.25 +
             Math.sin(x * 11 + t * 0.5) * Math.cos(y * 9 - t * 1.1) * 0.125;
    };

    const animate = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const activity = isActive ? 1.5 : 1;

      ctx.clearRect(0, 0, size, size);

      // Draw multiple metaballs for organic shape
      const numBlobs = 5;
      const blobs: { x: number; y: number; r: number }[] = [];

      for (let i = 0; i < numBlobs; i++) {
        const angle = (i / numBlobs) * Math.PI * 2 + t * 0.5;
        const distance = baseRadius * 0.6 * activity;
        const noiseOffset = noise(Math.cos(angle), Math.sin(angle), t) * 8;

        blobs.push({
          x: centerX + Math.cos(angle) * (distance + noiseOffset),
          y: centerY + Math.sin(angle) * (distance + noiseOffset),
          r: baseRadius * (0.7 + Math.sin(t * 2 + i) * 0.15) * activity,
        });
      }

      // Add center blob
      blobs.push({
        x: centerX + noise(0, 0, t) * 4,
        y: centerY + noise(0, 0, t + 100) * 4,
        r: baseRadius * 0.8 * activity,
      });

      // Render metaballs using radial gradients
      blobs.forEach((blob, i) => {
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        const alpha = 0.6 + Math.sin(t * 3 + i) * 0.2;
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.6})`);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Add glow effect
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 1.5);
      glowGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
      glowGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, size, size);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size, color, isActive]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: canvasSize, height: canvasSize }}
      aria-hidden="true"
    />
  );
}
