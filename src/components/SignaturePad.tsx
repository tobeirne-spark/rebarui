import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import clsx from "clsx";
import { Button } from "./Button";

export interface SignaturePadProps {
  /** A PNG data URL. Setting it to a *new* external value (e.g. loading a saved signature)
   * redraws the canvas from it; the component's own strokes update it via `onValueChange`, not
   * by feeding back through this prop on every stroke — the same "only resync when it genuinely
   * differs" rule `RichTextEditor`'s controlled HTML sync uses, so drawing never fights a
   * re-render. */
  value?: string;
  /** Fires once per completed stroke (pointer up) with the canvas's current PNG data URL, and
   * once on `Clear` with `""`. */
  onValueChange?: (value: string) => void;
  width?: number;
  height?: number;
  penColor?: string;
  backgroundColor?: string;
  disabled?: boolean;
  clearLabel?: string;
  "aria-label"?: string;
  className?: string;
}

/**
 * A draw-to-sign canvas — clear/undo-to-empty and a real non-empty check, the state-machine
 * richness that makes this an Opinion (open/closed-with-focus-management's drawing-mode cousin:
 * real stroke state, not a mirrored value). Pointer Events (not separate mouse/touch listeners)
 * for unified mouse/pen/touch handling in one code path.
 */
export function SignaturePad({
  value,
  onValueChange,
  width = 400,
  height = 160,
  penColor = "#212121",
  backgroundColor = "#ffffff",
  disabled,
  clearLabel = "Clear",
  "aria-label": ariaLabel = "Signature",
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastValueRef = useRef<string | undefined>(undefined);
  const [isEmpty, setIsEmpty] = useState(true);

  const getContext = () => canvasRef.current?.getContext("2d") ?? null;

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Initial paint, and redraw when the caller loads a genuinely new external value.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    clearCanvas();
    if (value && value !== lastValueRef.current) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = value;
      lastValueRef.current = value;
      setIsEmpty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run for a genuinely new value/size, not every render.
  }, [value, width, height, backgroundColor]);

  const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = pointFromEvent(event);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled) return;
    const point = pointFromEvent(event);
    const last = lastPointRef.current;
    const ctx = getContext();
    // "A stroke happened" is real app state, tracked regardless of whether this environment can
    // actually render it (ctx is unavailable in jsdom, for one) — decoupled on purpose, not a
    // test-only workaround, since the emptiness check below (Clear's disabled state, `data-rebar-
    // empty`) shouldn't silently depend on a successful canvas paint to be correct.
    if (ctx && last) {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    lastPointRef.current = point;
    if (isEmpty) setIsEmpty(false);
  };

  const emitValue = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // `toDataURL` can return a falsy/invalid result in environments with no real canvas backing
    // (or on a tainted canvas) — never forward that through a prop typed as a plain `string`.
    const dataUrl = canvas.toDataURL("image/png") || "";
    lastValueRef.current = dataUrl;
    onValueChange?.(dataUrl);
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    emitValue();
  };

  const handleClear = () => {
    clearCanvas();
    setIsEmpty(true);
    lastValueRef.current = "";
    onValueChange?.("");
  };

  return (
    <div className={clsx("rebar-signature-pad", className)} data-rebar-component="signature-pad" data-rebar-empty={isEmpty || undefined}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        className="rebar-signature-pad-canvas"
        data-rebar-part="canvas"
        style={{ touchAction: "none", cursor: disabled ? "not-allowed" : "crosshair" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="rebar-signature-pad-clear"
        data-rebar-part="clear"
        onClick={handleClear}
        disabled={disabled || isEmpty}
      >
        {clearLabel}
      </Button>
    </div>
  );
}
