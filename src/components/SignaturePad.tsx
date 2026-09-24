import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { Input } from "./Input";
import { EnterOutlined } from "./icons";

/** A caller-supplied audit stamp baked into the bottom-right corner of the exported/drawn image
 * whenever a signature is captured (stroke end, upload, or typed name) — the visible "signed by /
 * at" trail real e-signature tools (DocuSign etc.) attach.
 *
 * `deviceId` is still entirely the caller's own responsibility to obtain: nothing in this
 * component reads a real device identifier — a MAC address has not been readable from browser JS
 * in any browser for a long time, for the obvious privacy reason, and *how* to identify "a
 * device" varies by platform (a persisted UUID for a web app, a real hardware id on native/
 * Electron). What SignaturePad *does* own, given `deviceId` and a secret `deviceKey`, is turning
 * that identifier into a keyed hash instead of stamping it (or a bare hash of it) in the open —
 * this field is baked directly into a document image every signer can see, so plain text or an
 * unkeyed hash is effectively published: a small keyspace (a MAC address) is brute-forceable, and
 * anyone comparing stamps across documents can correlate them without a key. With both fields
 * set, the stamp is a real `HMAC-SHA256(deviceKey, deviceId)` (via the browser's own Web Crypto,
 * not a toy hash) — the same device still always produces the same stamp, but nobody without
 * `deviceKey` can reverse it back to `deviceId` or correlate it against a *different* app's
 * stamps of the same device.
 *
 * **The real tradeoff, stated plainly**: this computation happens in the browser, so `deviceKey`
 * itself is present in this page's own JS at signing time — secret from a casual viewer of the
 * finished, published document (the actual goal this exists for), but not cryptographically
 * secret from someone with devtools access to a live signing session who goes looking for it. If
 * your threat model needs the key to never reach the browser at all, don't pass `deviceKey` here:
 * compute the keyed hash on your own backend instead and pass the result as `label` (still
 * supported, unchanged) — this component has never done its own networking and won't start now,
 * so that path is always available alongside this one, not a fallback you lose. */
export interface SignaturePadStamp {
  /** Freeform text stamped alongside everything else here — a signer name, a document id,
   * anything not already covered by `deviceId`/`deviceKey`. */
  label?: string;
  /** A raw device/session identifier your own app already has. Only used if `deviceKey` is also
   * set — otherwise ignored (there's nothing safe to do with an unkeyed identifier; pass it as
   * `label` instead if stamping it in the open is genuinely intended). */
  deviceId?: string;
  /** The secret that keys `deviceId` into an undecodable-without-it hash — see this type's own
   * doc comment for what "secret" does and doesn't mean once it's in browser code. Keep it long
   * and high-entropy (25+ random characters, not a memorable phrase); this isn't enforced (an
   * arbitrary length minimum wouldn't actually guarantee real entropy), just strongly recommended. */
  deviceKey?: string;
  /** Appends the moment the stamp is drawn (`Date.toLocaleString()`), alongside the rest. */
  timestamp?: boolean;
}

/** The real Web Crypto HMAC-SHA256 — see `SignaturePadStamp`'s own doc comment for what this
 * computation does and doesn't secure. Returns a hex digest, truncated for a compact stamp (still
 * effectively as collision-resistant as this needs — the full 256 bits of entropy already lives
 * in the hash, not in how much of it gets displayed). */
async function hmacDeviceStamp(deviceKey: string, deviceId: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(deviceKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(deviceId));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
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
  /** Disables just the mark itself -- drawing, Upload, and Clear -- while leaving the typed-name
   * input (see `allowTypedName`) enabled, unlike `disabled` which disables everything. For a
   * caller that requires a name before a mark can be captured at all (typing one first is what
   * lifts this), rather than only checking for one after the fact. Has no effect while `disabled`
   * is also true (that already covers everything this does and more). */
  markDisabled?: boolean;
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
  /** Seeds the typed-name field's initial text (e.g. restoring a name saved earlier via
   * `onTypedNameChange`) — the field is otherwise uncontrolled and always starts blank on mount
   * regardless of what a caller has stored, which lets its own state silently drift out of sync
   * with a real, non-blank saved name (nothing on screen shows one exists). Only read once, on
   * mount, like a native `defaultValue` -- doesn't fight the user's own typing afterward. */
  defaultTypedName?: string;
  typedNamePlaceholder?: string;
  /** Font used to render a typed name (see `allowTypedName`) — a generic system cursive stack by
   * default, deliberately not a bundled web font: matches this library's headless-first,
   * bring-your-own-polish convention rather than a core component silently pulling in an
   * external font file. */
  typedNameFont?: string;
  /** Fires on every keystroke in the typed-name field with its current raw text — the name itself
   * only ever exists as pixels baked into the canvas otherwise (`onValueChange` only ever returns
   * the rendered PNG), so a caller that needs the plain string too (to store it separately, gate
   * on it being non-blank, or show it as real text elsewhere) has no other way to read it. */
  onTypedNameChange?: (name: string) => void;
  /** Bakes a small audit stamp into the signature image on every capture — see
   * `SignaturePadStamp`. Omit for no stamp (default). */
  stamp?: SignaturePadStamp;
  /** Extra content rendered in the same row as Clear/Upload, after them — a related toggle or
   * control a caller wants visually grouped with this pad's own actions rather than placed
   * elsewhere and left to line up by coincidence. Renders regardless of `disabled`/`markDisabled`;
   * a caller passing an interactive control is responsible for its own disabled state. */
  actionsEnd?: ReactNode;
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
  markDisabled,
  clearLabel = "Clear",
  allowUpload,
  uploadLabel = "Upload",
  allowTypedName,
  defaultTypedName = "",
  typedNamePlaceholder = "Type your name",
  typedNameFont = "'Brush Script MT', 'Segoe Script', cursive",
  onTypedNameChange,
  stamp,
  actionsEnd,
  "aria-label": ariaLabel = "Signature",
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastValueRef = useRef<string | undefined>(undefined);
  const [isEmpty, setIsEmpty] = useState(true);
  const [typedName, setTypedName] = useState(defaultTypedName);
  const markIsDisabled = disabled || markDisabled;

  const getContext = () => canvasRef.current?.getContext("2d") ?? null;

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Initial paint, and redraw when the caller loads a genuinely new external value. Skipped
  // entirely when `value` is just our own emitted value echoed back through a controlled prop
  // (the normal round-trip: draw/type/upload -> emitValue sets lastValueRef + calls
  // onValueChange -> caller re-renders with that same value) -- the canvas already shows it, and
  // clearing here would erase what the user just captured before this effect could redraw it.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    if (value === lastValueRef.current) return;
    clearCanvas();
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = value;
      lastValueRef.current = value;
      setIsEmpty(false);
    } else {
      lastValueRef.current = value;
      setIsEmpty(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run for a genuinely new value/size, not every render.
  }, [value, width, height, backgroundColor]);

  const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (markIsDisabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = pointFromEvent(event);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || markIsDisabled) return;
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
  // Async because a keyed device stamp needs a real (async-only) Web Crypto call before there's
  // anything to draw.
  const drawStamp = async () => {
    if (!stamp || (!stamp.label && !stamp.timestamp && !(stamp.deviceId && stamp.deviceKey))) return;
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    const deviceStamp =
      stamp.deviceId && stamp.deviceKey ? await hmacDeviceStamp(stamp.deviceKey, stamp.deviceId) : null;
    const parts = [stamp.label, deviceStamp, stamp.timestamp ? new Date().toLocaleString() : null].filter(
      (part): part is string => !!part,
    );
    if (parts.length === 0) return;
    ctx.save();
    // Scaled to the pad's own height (with a floor) rather than a fixed size -- a fixed 10px was
    // legible at the canvas's native resolution but became unreadable once the resulting image
    // was ever displayed smaller (e.g. embedded at table-row height in an exported PDF).
    const stampFontSize = Math.max(12, Math.round(height * 0.09));
    ctx.font = `${stampFontSize}px monospace`;
    ctx.fillStyle = "rgba(33, 33, 33, 0.7)";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    const maxWidth = canvas.width - 12;
    const fullText = parts.join(" · ");
    if (parts.length > 1 && ctx.measureText(fullText).width > maxWidth) {
      // Doesn't fit on one line at this size (a long role label plus a timestamp, most often) --
      // wrap onto a second line instead of shrinking the font until an arbitrarily long label
      // technically fits, which would defeat the point of sizing this for legibility at all.
      const lastLine = parts[parts.length - 1] ?? "";
      const firstLine = parts.slice(0, -1).join(" · ");
      const lineHeight = Math.round(stampFontSize * 1.2);
      ctx.fillText(firstLine, canvas.width - 6, canvas.height - 4 - lineHeight);
      ctx.fillText(lastLine, canvas.width - 6, canvas.height - 4);
    } else {
      ctx.fillText(fullText, canvas.width - 6, canvas.height - 4);
    }
    ctx.restore();
  };

  const emitValue = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await drawStamp();
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
    onTypedNameChange?.("");
    lastValueRef.current = "";
    onValueChange?.("");
  };

  // Typing paints a live cursive preview on every keystroke but does *not* emit a value -- same
  // "commit only at the natural end of the gesture" rule pointer drawing already follows (moves
  // paint locally, only pointerup calls emitValue). For typed name, that gesture ends on blur:
  // see handleTypedNameBlur, which is also where the stamp gets baked in, not on every keystroke.
  const paintTypedName = (name: string) => {
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
    } else {
      setIsEmpty(true);
    }
  };

  const handleTypedNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    setTypedName(name);
    paintTypedName(name);
    onTypedNameChange?.(name);
  };

  const handleTypedNameBlur = () => {
    if (typedName.trim()) {
      emitValue();
    } else {
      lastValueRef.current = "";
      onValueChange?.("");
    }
  };

  // Enter commits the same way blur already does -- just blurring the field is enough to trigger
  // the real onBlur handler above, rather than duplicating its logic here.
  const handleTypedNameKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.currentTarget.blur();
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
        <div className="rebar-signature-pad-typed-name-wrap">
          <Input
            type="text"
            size="sm"
            value={typedName}
            onChange={handleTypedNameChange}
            onBlur={handleTypedNameBlur}
            onKeyDown={handleTypedNameKeyDown}
            placeholder={typedNamePlaceholder}
            disabled={disabled}
            aria-label={typedNamePlaceholder}
            className="rebar-signature-pad-typed-name"
            data-rebar-part="typed-name"
          />
          {typedName.trim() && !disabled ? (
            <span className="rebar-signature-pad-typed-name-hint" aria-hidden="true" title="Press Enter to save">
              <EnterOutlined />
            </span>
          ) : null}
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        className="rebar-signature-pad-canvas"
        data-rebar-part="canvas"
        style={{ touchAction: "none", cursor: markIsDisabled ? "not-allowed" : "crosshair" }}
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
          disabled={markIsDisabled || isEmpty}
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
              disabled={markIsDisabled}
            >
              {uploadLabel}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadChange}
              disabled={markIsDisabled}
              className="rebar-visually-hidden"
              aria-label={uploadLabel}
            />
          </>
        ) : null}
        {actionsEnd}
      </div>
    </div>
  );
}
