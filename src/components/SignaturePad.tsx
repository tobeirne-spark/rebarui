import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { Input } from "./Input";

/** A caller-supplied audit stamp baked into the bottom-right corner of the exported/drawn image
 * whenever a signature is captured (stroke end, upload, or typed name) — the visible "signed by /
 * at" trail real e-signature tools (DocuSign etc.) attach. `label` is entirely the caller's own
 * responsibility to compute: nothing in this component reads a real device identifier — a MAC
 * address has not been readable from browser JS in any browser for a long time, for the obvious
 * privacy reason. Pass whatever identifier your own app already has (a session id, a server-
 * issued device hash, a signer's email) as `label`. */
export interface SignaturePadStamp {
  label?: string;
  /** Appends the moment the stamp is drawn (`Date.toLocaleString()`), alongside `label`. */
  timestamp?: boolean;
}

export interface SignaturePadProps {
  /** A PNG data URL. Setting it to a *new* external value (e.g. loading a saved signature)
   * redraws the canvas from it; the component's own strokes update it via `onValueChange`, not
   * by feeding back through this prop on every stroke — the same "only resync when it genuinely
   * differs" rule `RichTextEditor`'s controlled HTML sync uses, so drawing never fights a
   * re-render. */
  value?: string;
  /** Fires once per completed stroke (pointer up), once per uploaded image, once per typed-name
   * edit, with the canvas's current PNG data URL (stamp already baked in, if `stamp` is set) — and
   * once on `Clear` with `""`. */
  onValueChange?: (value: string) => void;
  width?: number;
  height?: number;
  penColor?: string;
  backgroundColor?: string;
  disabled?: boolean;
  clearLabel?: string;
  /** Shows an "Upload" button that lets the user pick an existing signature image (any raster
   * format a plain `<input type="file" accept="image/*">` accepts) instead of drawing one — drawn
   * onto the canvas scaled to fit, the same as loading an external `value`. Off by default. */
  allowUpload?: boolean;
  uploadLabel?: string;
  /** Shows a text input that renders the typed name onto the canvas in a cursive font as the
   * user types, instead of (or in addition to) drawing — the "type your signature" affordance
   * most e-signature flows offer alongside drawing. Off by default. */
  allowTypedName?: boolean;
  typedNamePlaceholder?: string;
  /** Font used to render a typed name (see `allowTypedName`) — a generic system cursive stack by
   * default, deliberately not a bundled web font: matches this library's headless-first,
   * bring-your-own-polish convention rather than a core component silently pulling in an
   * external font file. */
  typedNameFont?: string;
  /** Bakes a small audit stamp into the signature image on every capture — see
   * `SignaturePadStamp`. Omit for no stamp (default). */
  stamp?: SignaturePadStamp;
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
  allowUpload,
  uploadLabel = "Upload",
  allowTypedName,
  typedNamePlaceholder = "Type your name",
  typedNameFont = "'Brush Script MT', 'Segoe Script', cursive",
  stamp,
  "aria-label": ariaLabel = "Signature",
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastValueRef = useRef<string | undefined>(undefined);
  const [isEmpty, setIsEmpty] = useState(true);
  const [typedName, setTypedName] = useState("");

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

  // Baked into the exported image itself (not just returned alongside it) so the audit trail
  // survives however the caller stores/prints/emails the resulting PNG — see `SignaturePadStamp`.
  const drawStamp = () => {
    if (!stamp || (!stamp.label && !stamp.timestamp)) return;
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    const parts = [stamp.label, stamp.timestamp ? new Date().toLocaleString() : null].filter(
      (part): part is string => !!part,
    );
    if (parts.length === 0) return;
    ctx.save();
    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(33, 33, 33, 0.55)";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(parts.join(" · "), canvas.width - 6, canvas.height - 4);
    ctx.restore();
  };

  const emitValue = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawStamp();
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
    setTypedName("");
    lastValueRef.current = "";
    onValueChange?.("");
  };

  const handleTypedNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    setTypedName(name);
    const canvas = canvasRef.current;
    if (!canvas) return;
    clearCanvas();
    // Whether a name was typed is real, known state regardless of whether this environment can
    // actually paint it (jsdom's canvas has no real 2D context) — decoupled on purpose, the same
    // "app state shouldn't depend on a successful canvas paint" rule the emptiness tracking above
    // already follows for drawn strokes.
    const ctx = getContext();
    if (name.trim()) {
      if (ctx) {
        ctx.save();
        ctx.fillStyle = penColor;
        ctx.font = `${Math.round(height * 0.4)}px ${typedNameFont}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(name, 16, height / 2);
        ctx.restore();
      }
      setIsEmpty(false);
      emitValue();
    } else {
      setIsEmpty(true);
      lastValueRef.current = "";
      onValueChange?.("");
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const canvas = canvasRef.current;
      const ctx = getContext();
      if (!canvas || !ctx || typeof reader.result !== "string") return;
      const img = new Image();
      img.onload = () => {
        clearCanvas();
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setIsEmpty(false);
        emitValue();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={clsx("rebar-signature-pad", className)} data-rebar-component="signature-pad" data-rebar-empty={isEmpty || undefined}>
      {allowTypedName ? (
        <Input
          type="text"
          size="sm"
          value={typedName}
          onChange={handleTypedNameChange}
          placeholder={typedNamePlaceholder}
          disabled={disabled}
          aria-label={typedNamePlaceholder}
          className="rebar-signature-pad-typed-name"
          data-rebar-part="typed-name"
        />
      ) : null}
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
      <div className="rebar-signature-pad-actions" data-rebar-part="actions">
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
        {allowUpload ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rebar-signature-pad-upload"
              data-rebar-part="upload"
              onClick={handleUploadClick}
              disabled={disabled}
            >
              {uploadLabel}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadChange}
              disabled={disabled}
              className="rebar-visually-hidden"
              aria-label={uploadLabel}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
