import { useEffect, useRef } from "react";

export interface AssistantOrbProps {
  size?: number;
  color?: string;
  isActive?: boolean;
  className?: string;
}

/**
 * Canvas-based fluid orb animation inspired by Siri's visual design.
 * Uses metaball rendering with noise-based displacement for an organic,
 * living feel. Much more polished than CSS-only animations.
 */
export function AssistantOrb({ size = 56, color = "#0066cc", isActive = false, className }: AssistantOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size * 0.3;

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
        gradient.addColorStop(0.5, color.replace(")", `, ${alpha * 0.6})`).replace("rgb", "rgba"));
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Add glow effect
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 1.5);
      glowGradient.addColorStop(0, color.replace(")", ", 0.3)").replace("rgb", "rgba"));
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
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
