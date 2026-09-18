import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import clsx from "clsx";
import { Button } from "./Button";

type Rect = { x: number; y: number; width: number; height: number };
type Corner = "nw" | "ne" | "sw" | "se";
const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

export interface ImageCropperProps {
  src: string;
  alt?: string;
  /** The visible crop stage's size in px. The source image fills it via `object-fit: cover`, so
   * container-relative pixels map to the image linearly — see the component doc comment for why. */
  width?: number;
  height?: number;
  /** Locks the crop rectangle to a fixed width/height ratio (e.g. `1` for a square avatar crop).
   * Unset allows a freeform rectangle. */
  aspectRatio?: number;
  /** Fires with a PNG data URL of the cropped region when `Crop` is pressed. */
  onCrop?: (dataUrl: string) => void;
  cropLabel?: string;
  disabled?: boolean;
  className?: string;
}

const MIN_SIZE = 32;

// Clamping width and height independently would silently break a locked aspect ratio right at the
// boundary (e.g. width clamped down to fit but height left alone) — when `aspectRatio` is set,
// clamp on whichever dimension is more constrained, then derive the other from it, so the ratio
// holds exactly even for a rect that's hitting the stage's edge.
function clampRect(rect: Rect, boundsWidth: number, boundsHeight: number, aspectRatio?: number): Rect {
  let { width, height } = rect;
  if (aspectRatio) {
    width = Math.min(Math.max(width, MIN_SIZE), boundsWidth, boundsHeight * aspectRatio);
    height = width / aspectRatio;
  } else {
    width = Math.min(Math.max(width, MIN_SIZE), boundsWidth);
    height = Math.min(Math.max(height, MIN_SIZE), boundsHeight);
  }
  const x = Math.min(Math.max(rect.x, 0), boundsWidth - width);
  const y = Math.min(Math.max(rect.y, 0), boundsHeight - height);
  return { x, y, width, height };
}

/**
 * A drag-to-move, drag-corners-to-resize crop rectangle over an image — real manipulation state
 * (the rect's own position/size, which corner is actively being dragged), pairing naturally with
 * the existing `FileUpload`/`Image`. The source image fills the stage via `object-fit: cover`
 * rather than exact letterboxed `contain` math, so container-relative crop-rect pixels map onto
 * the image's natural pixels with a single uniform scale factor — a deliberate scope
 * simplification (this isn't a full photo-editing tool), not an oversight.
 */
export function ImageCropper({
  src,
  alt = "",
  width = 320,
  height = 320,
  aspectRatio,
  onCrop,
  cropLabel = "Crop",
  disabled,
  className,
}: ImageCropperProps) {
  // Shrunk from the max-that-fits, not sized to it exactly — an initial rect that exactly fills
  // the stage leaves no visible margin proving it's a real, movable/resizable element rather than
  // the stage's own border (found by actually rendering a square stage + aspectRatio=1: the two
  // maxed-out cases are visually indistinguishable from a fixed frame).
  const maxFitHeight = aspectRatio ? Math.min(height, width / aspectRatio) : height;
  const initialHeight = aspectRatio ? maxFitHeight * 0.8 : height * 0.6;
  const initialWidth = aspectRatio ? initialHeight * aspectRatio : width * 0.6;
  const [rect, setRect] = useState<Rect>({
    x: (width - initialWidth) / 2,
    y: (height - initialHeight) / 2,
    width: initialWidth,
    height: initialHeight,
  });
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ mode: "move" | Corner; startX: number; startY: number; startRect: Rect } | null>(null);

  const beginDrag = (mode: "move" | Corner) => (event: ReactPointerEvent) => {
    if (disabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { mode, startX: event.clientX, startY: event.clientY, startRect: rect };
  };

  const handlePointerMove = (event: ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const start = drag.startRect;

    if (drag.mode === "move") {
      setRect(clampRect({ ...start, x: start.x + dx, y: start.y + dy }, width, height, aspectRatio));
      return;
    }

    let next: Rect = start;
    if (drag.mode === "se") {
      const w = start.width + dx;
      const h = aspectRatio ? w / aspectRatio : start.height + dy;
      next = { x: start.x, y: start.y, width: w, height: h };
    } else if (drag.mode === "sw") {
      const w = start.width - dx;
      const h = aspectRatio ? w / aspectRatio : start.height + dy;
      next = { x: start.x + start.width - w, y: start.y, width: w, height: h };
    } else if (drag.mode === "ne") {
      const w = start.width + dx;
      const h = aspectRatio ? w / aspectRatio : start.height - dy;
      next = { x: start.x, y: start.y + start.height - h, width: w, height: h };
    } else if (drag.mode === "nw") {
      const w = start.width - dx;
      const h = aspectRatio ? w / aspectRatio : start.height - dy;
      next = { x: start.x + start.width - w, y: start.y + start.height - h, width: w, height: h };
    }
    setRect(clampRect(next, width, height, aspectRatio));
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;
    const scaleX = img.naturalWidth / width;
    const scaleY = img.naturalHeight / height;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(rect.width * scaleX);
    canvas.height = Math.round(rect.height * scaleY);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      img,
      rect.x * scaleX,
      rect.y * scaleY,
      rect.width * scaleX,
      rect.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    onCrop?.(canvas.toDataURL("image/png") || "");
  };

  return (
    <div className={clsx("rebar-image-cropper", className)} data-rebar-component="image-cropper">
      <div
        ref={stageRef}
        className="rebar-image-cropper-stage"
        data-rebar-part="stage"
        style={{ width, height }}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img ref={imgRef} src={src} alt={alt} className="rebar-image-cropper-image" crossOrigin="anonymous" />
        <div
          className="rebar-image-cropper-rect"
          data-rebar-part="rect"
          style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
          onPointerDown={beginDrag("move")}
        >
          {CORNERS.map((corner) => (
            <span
              key={corner}
              className="rebar-image-cropper-handle"
              data-rebar-part="handle"
              data-rebar-corner={corner}
              onPointerDown={(e) => {
                e.stopPropagation();
                beginDrag(corner)(e);
              }}
            />
          ))}
        </div>
      </div>
      <Button type="button" size="sm" onClick={handleCrop} disabled={disabled}>
        {cropLabel}
      </Button>
    </div>
  );
}
