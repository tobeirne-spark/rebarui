import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, MutableRefObject, ReactNode, Ref, SyntheticEvent } from "react";
import clsx from "clsx";
import { Spin } from "./Spin";

// Merges the caller's forwarded ref (if any) with this component's own internal ref, so both
// receive the same DOM node — needed because `Image` has to inspect the real `<img>` itself (see
// the mount-time check below) while still letting a consumer attach their own ref too.
function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else (ref as MutableRefObject<T | null>).current = node;
    }
  };
}

export type ImageLoadStatus = "loading" | "loaded" | "error";

export interface ImageProps
  extends Omit<ComponentPropsWithoutRef<"img">, "alt" | "onLoad" | "onError"> {
  src: string;
  /** Required — an <img> with no alt text is a silent accessibility gap. */
  alt: string;
  /** Shown if the image fails to load. Defaults to a simple broken-image placeholder box. */
  fallback?: ReactNode;
  /** Shown while the image is loading. Defaults to a real Spin. */
  loadingIndicator?: ReactNode;
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
}

function DefaultFallback({ alt }: { alt: string }) {
  return (
    <span className="rebar-image-fallback-default">
      <svg
        className="rebar-image-fallback-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <path
          d="M3 16l5-5 4 4 3-3 6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="rebar-image-fallback-text">{alt || "Image failed to load"}</span>
    </span>
  );
}

/**
 * A real <img> wrapper with load/error state — distinct from AspectRatio (which handles
 * ratio/placeholder/watermark framing but has no concept of "is this still loading" or "did
 * this 404"). The <img> itself is always rendered (never conditionally unmounted) so its `alt`
 * text stays in the accessibility tree through every state; the loading indicator and error
 * fallback are absolutely-positioned overlays on top of it, per ref/HEURISTICS.md #20 (loading,
 * error, empty, and disabled states are all designed, not just the happy path).
 */
export const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { src, alt, fallback, loadingIndicator, onLoad, onError, className, style, loading, ...rest },
  ref,
) {
  const [status, setStatus] = useState<ImageLoadStatus>("loading");
  // `src` can change across renders (e.g. paging through a gallery) — reset to "loading" so the
  // indicator/fallback logic re-runs for the new image instead of sticking on the previous one's
  // resolved status. Deliberately NOT a `useEffect`: a real, hit-directly bug here was a race
  // where a broken `src` fails fast enough that the native `<img>`'s `error` event (and this
  // component's own `handleError`) fires *before* a mount-time effect runs, and an unconditional
  // `setStatus("loading")` in that effect clobbered the already-correct "error" state right back
  // to "loading" — with no img error event ever firing again to correct it, since a static,
  // unchanging `src` only errors once. Comparing against the previous `src` *during render*
  // (React's own documented pattern for "adjust state when a prop changes") resets state only on
  // a genuine `src` change, never on mount, so there's no effect left to race the real DOM event.
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setStatus("loading");
  }

  // A second, deeper race than the one above: on a server-rendered page, the browser starts
  // fetching a non-lazy (or already-in-viewport lazy) <img> the moment it parses the HTML —
  // before React hydrates and attaches its own event listeners. A `src` that fails fast enough
  // (e.g. a DNS resolution failure) can finish and fire its native `error` event during that
  // window, before any handler is wired up to catch it — genuinely lost, not just raced, since a
  // static src only errors once. The fix: synchronously check the real, current DOM state of the
  // <img> the moment this component mounts (or `src` changes), via `.complete`/`.naturalWidth` —
  // properties the browser keeps accurate regardless of whether an event was missed. A
  // `useLayoutEffect` (not `useEffect`) so this resolves before paint, avoiding a flash of the
  // loading indicator over an image that actually already finished.
  const imgRef = useRef<HTMLImageElement>(null);
  useLayoutEffect(() => {
    const img = imgRef.current;
    if (!img || !img.complete) return;
    setStatus(img.naturalWidth > 0 ? "loaded" : "error");
    // Only re-checking when `src` changes (not on every render) mirrors the render-time guard
    // above — this is the mount/src-change reconciliation, not a per-render assertion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    setStatus("loaded");
    onLoad?.(event);
  };

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    setStatus("error");
    onError?.(event);
  };

  return (
    <span
      className={clsx("rebar-image", className)}
      data-rebar-component="image"
      data-rebar-image-status={status}
      style={style}
    >
      <img
        ref={mergeRefs(ref, imgRef)}
        src={src}
        alt={alt}
        // Real, native lazy-loading — no JS intersection-observer reimplementation needed —
        // unless the caller passes their own `loading` prop through rest-spread.
        loading={loading ?? "lazy"}
        onLoad={handleLoad}
        onError={handleError}
        className="rebar-image-img"
        data-rebar-part="img"
        {...rest}
      />
      {status === "loading" ? (
        <span className="rebar-image-loading" data-rebar-part="loading">
          {loadingIndicator ?? <Spin size="sm" />}
        </span>
      ) : null}
      {status === "error" ? (
        <span className="rebar-image-fallback" data-rebar-part="fallback">
          {fallback ?? <DefaultFallback alt={alt} />}
        </span>
      ) : null}
    </span>
  );
});
