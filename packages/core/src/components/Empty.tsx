import { forwardRef } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { EMPTY_PLACEHOLDER } from "../assets/emptyPlaceholder";
import { GHOST_EMPTY_PLACEHOLDER } from "../assets/ghostEmptyPlaceholder";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export type EmptyIcon = "auto" | "illustration" | "vector";
export type EmptyIllustration = "ghost" | "bowl-and-spoon";

const ILLUSTRATIONS: Record<EmptyIllustration, string> = {
  ghost: GHOST_EMPTY_PLACEHOLDER,
  "bowl-and-spoon": EMPTY_PLACEHOLDER,
};

export interface EmptyProps {
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  /**
   * Which icon to render. "auto" (default) shows the hand-drawn illustration in light mode and
   * switches to the plain vector automatically in dark mode — the illustration is a raster image
   * baked onto a white background, so it can't recolor itself for a dark surface. Set explicitly
   * to keep one icon in both themes instead: "illustration" for the sketch look everywhere,
   * "vector" for the plain circle-with-an-X everywhere.
   */
  icon?: EmptyIcon;
  /** Which raster illustration to use when `icon` shows one. Default `"ghost"`. */
  illustration?: EmptyIllustration;
  /** Force bionic reading on/off for the description, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

// A real hand-drawn illustration, not a generic geometric shape — a ghost by default
// (ghostEmptyPlaceholder.ts), or the original empty bowl and spoon (emptyPlaceholder.ts) via
// `illustration="bowl-and-spoon"`. Decorative only: alt="" so a screen reader skips straight to
// the description text below, the same convention Avatar/AspectRatio already use for their own
// decorative placeholder art.
//
// The illustration is baked-in dark ink on a white background — a raster image, so it can't pick
// up currentColor the way an SVG would. The vector fallback (a circle with an X, same shape as
// IconClose/Dialog's/Toast's close glyph, not a second illustration) CAN adapt. In "auto" mode
// (the default) both render on the server and CSS swaps which one is visible based on
// `[data-theme="dark"]` (this project's actual dark-mode attribute — no prefers-color-scheme
// fallback exists here, so neither does this) — no JavaScript needed. "illustration"/"vector"
// render only that one element, forced visible via inline style regardless of theme, overriding
// the auto-toggle CSS rules that would otherwise hide it in the "wrong" theme.
export const Empty = forwardRef<HTMLDivElement, EmptyProps>(function Empty(
  { description = "No data", children, bionic, bionicOptions, icon = "auto", illustration = "ghost", className },
  ref,
) {
  const descriptionContent = useBionicChildren(description, bionic, bionicOptions);
  const showRaster = icon !== "vector";
  const showVector = icon !== "illustration";
  return (
    <div ref={ref} className={clsx("rebar-empty", className)} data-rebar-component="empty">
      {showRaster ? (
        <img
          className="rebar-empty-icon rebar-empty-icon-raster"
          data-rebar-part="icon"
          src={ILLUSTRATIONS[illustration]}
          alt=""
          style={icon === "illustration" ? { display: "block" } : undefined}
        />
      ) : null}
      {showVector ? (
        <svg
          className="rebar-empty-icon rebar-empty-icon-vector"
          data-rebar-part="icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
          style={icon === "vector" ? { display: "block" } : undefined}
        >
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : null}
      {description ? (
        <span className="rebar-empty-description" data-rebar-part="description">
          {descriptionContent}
        </span>
      ) : null}
      {children ? (
        <div className="rebar-empty-action" data-rebar-part="action">
          {children}
        </div>
      ) : null}
    </div>
  );
});
