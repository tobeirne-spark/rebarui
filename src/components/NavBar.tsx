import { useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { Popover } from "./Popover";
import { renderBionicChildren, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface NavBarItem {
  label: string;
  href: string;
  /** When set, this item renders as a dropdown trigger instead of a plain link.
   * The mega-menu panel renders inside a Popover. */
  megaMenu?: {
    columns: {
      heading: string;
      items: { label: string; description?: string; href: string; icon?: string; external?: boolean }[];
    }[];
    footer?: { label: string; href: string };
  };
}

export interface NavBarProps extends Omit<ComponentPropsWithoutRef<"div">, "className"> {
  items: NavBarItem[];
  /** Renders a link — defaults to a plain `<a href>`. Pass your framework's Link (e.g. Next.js's) for client-side routing, same convention as `@rebar-ui/placement`'s `renderLink`. */
  renderLink?: (props: { href: string; children: ReactNode; className?: string }) => ReactNode;
  /** Label for the overflow trigger button. */
  moreLabel?: string;
  "aria-label"?: string;
  className?: string;
  /** Force bionic reading on/off for item labels, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

const defaultRenderLink = ({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) => (
  <a href={href} className={className}>
    {children}
  </a>
);

const GAP_PX = 24;

/**
 * A horizontal nav that collapses overflowing items into a trailing "More" popover instead of
 * wrapping or clipping — see ref/HEURISTICS.md's "Nav overflow" rule. This component only
 * handles the collapse mechanics (measure, cut off, move the rest into a popover); it doesn't
 * know or care how much horizontal room it's been given. The heuristic itself — don't let nav
 * consume more than half of its containing header — is enforced by whoever places `NavBar`
 * giving it the right container, not by this component.
 *
 * That container needs a real `flex-basis` (e.g. `flex: "0 1 50%"`), not just a `max-width: 50%`
 * with no explicit basis — found the hard way: a flex item's default sizing is "shrink to fit
 * content," so once NavBar has already collapsed down to its narrowest state (say, one item
 * visible), a bare `max-width` cap never grants the width back on its own — there's nothing
 * telling the item to actually reclaim up to 50% once the header has room again, so it stays
 * collapsed even after the header grows. `flexShrink: 1` on the same container still lets it
 * yield room to sibling header content (a logo, a version string) that doesn't fit alongside a
 * full 50%.
 */
export function NavBar({
  items,
  renderLink = defaultRenderLink,
  moreLabel = "More",
  "aria-label": ariaLabel = "Main",
  className,
  bionic,
  bionicOptions,
  ...props
}: NavBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const moreRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;
  // Measured (hidden) and visible labels must render identically — bold fixation text is wider
  // than plain text, so measuring plain labels while rendering bionic-split ones would
  // underestimate real width and overflow the cutoff by a few pixels.
  const renderLabel = (label: string) => renderBionicChildren(label, bionicEnabled, bionicOptions);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function recompute() {
      const containerWidth = container!.clientWidth;
      // A container that reports zero width hasn't actually been laid out yet (or genuinely has
      // none, e.g. a display:none ancestor) — either way, there's nothing real to measure against,
      // so show everything rather than collapsing every item into the popover on a still-settling
      // first render.
      if (containerWidth <= 0) {
        setVisibleCount(items.length);
        return;
      }
      const moreWidth = (moreRef.current?.offsetWidth ?? 0) + GAP_PX;

      let total = 0;
      let cutoff = items.length;
      for (let i = 0; i < items.length; i++) {
        const width = itemRefs.current[i]?.offsetWidth ?? 0;
        const withGap = width + (i > 0 ? GAP_PX : 0);
        const isLast = i === items.length - 1;
        const budget = isLast ? containerWidth : containerWidth - moreWidth;
        if (total + withGap > budget) {
          cutoff = i;
          break;
        }
        total += withGap;
      }
      setVisibleCount(cutoff);
    }

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(container);
    return () => observer.disconnect();
  }, [items]);

  const overflowItems = items.slice(visibleCount);

  return (
    <div
      {...props}
      ref={containerRef}
      className={clsx("rebar-navbar", className)}
      data-rebar-component="navbar"
      style={{ position: "relative", maxWidth: "100%", overflow: "hidden" }}
    >
      {/* Hidden measurement pass — every item rendered off-screen, never clipped, purely to read
          real widths before the visible pass paints. Keeps the visible row single-pass, no flash
          of an unmeasured (all-visible-then-corrected) layout. */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", visibility: "hidden", top: 0, left: 0, display: "flex", gap: GAP_PX, whiteSpace: "nowrap", pointerEvents: "none" }}
      >
        {items.map((item, i) => (
          <span key={`${item.label}-${i}`} ref={(el) => { itemRefs.current[i] = el; }} className="rebar-navbar-link">
            {renderLabel(item.label)}
          </span>
        ))}
        <span ref={moreRef} className="rebar-navbar-more">
          {moreLabel}
        </span>
      </div>

      <nav aria-label={ariaLabel} style={{ display: "flex", alignItems: "center", gap: GAP_PX, whiteSpace: "nowrap" }}>
        {items.slice(0, visibleCount).map((item, i) =>
          item.megaMenu ? (
            <Popover
              key={`${item.label}-${i}`}
              trigger={
                <button
                  type="button"
                  className="rebar-navbar-link"
                  data-rebar-part="mega-trigger"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    font: "inherit",
                    color: "inherit",
                    padding: 0,
                  }}
                >
                  {renderLabel(item.label)} ▾
                </button>
              }
            >
              <div
                data-rebar-part="mega-menu"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${item.megaMenu.columns.length}, 1fr)`,
                  gap: "var(--rebar-space-xl, 32px)",
                  padding: "var(--rebar-space-xl, 32px)",
                  minWidth: item.megaMenu.columns.length * 180,
                  backgroundColor: "var(--rebar-color-bg, #ffffff)",
                  border: "1px solid var(--rebar-color-border, #e0e0e0)",
                  borderRadius: "var(--rebar-radius-md, 8px)",
                  boxShadow: "var(--rebar-shadow-lg, 0 4px 12px rgba(0,0,0,0.1))",
                }}
              >
                {item.megaMenu.columns.map((col, ci) => (
                  <div key={ci} style={{ display: "flex", flexDirection: "column", gap: "var(--rebar-space-xs, 4px)" }}>
                    <span
                      style={{
                        fontSize: "var(--rebar-font-size-xs, 12px)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: "var(--rebar-font-weight-semibold, 600)",
                        color: "var(--rebar-color-text-secondary, #757575)",
                        marginBottom: "var(--rebar-space-xs, 4px)",
                      }}
                    >
                      {col.heading}
                    </span>
                    {col.items.map((mi, mii) => (
                      <span key={mii} style={{ display: "block" }}>
                        {renderLink({
                          href: mi.href,
                          children: (
                            <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "4px 0" }}>
                              <span style={{ fontSize: "var(--rebar-font-size-sm, 14px)", fontWeight: "var(--rebar-font-weight-medium, 500)" }}>
                                {mi.label}
                                {mi.external ? " ↗" : null}
                              </span>
                              {mi.description ? (
                                <span style={{ fontSize: "var(--rebar-font-size-xs, 12px)", color: "var(--rebar-color-text-secondary, #757575)" }}>
                                  {mi.description}
                                </span>
                              ) : null}
                            </div>
                          ),
                          className: "rebar-navbar-mega-link",
                        })}
                      </span>
                    ))}
                  </div>
                ))}
                {item.megaMenu.footer ? (
                  <div
                    style={{
                      gridColumn: `1 / -1`,
                      borderTop: "1px solid var(--rebar-color-border, #e0e0e0)",
                      paddingTop: "var(--rebar-space-md, 16px)",
                      marginTop: "var(--rebar-space-sm, 8px)",
                    }}
                  >
                    {renderLink({
                      href: item.megaMenu.footer.href,
                      children: (
                        <span style={{ fontSize: "var(--rebar-font-size-sm, 14px)" }}>
                          {item.megaMenu.footer.label} →
                        </span>
                      ),
                      className: "rebar-navbar-mega-link",
                    })}
                  </div>
                ) : null}
              </div>
            </Popover>
          ) : (
            <span key={`${item.label}-${i}`}>
              {renderLink({ href: item.href, children: renderLabel(item.label), className: "rebar-navbar-link" })}
            </span>
          ),
        )}
        {overflowItems.length > 0 ? (
          <Popover
            trigger={
              <button type="button" className="rebar-navbar-more" data-rebar-part="more">
                {moreLabel}
              </button>
            }
          >
            <div
              className="rebar-navbar-overflow"
              data-rebar-part="overflow"
              style={{ display: "flex", flexDirection: "column", gap: "var(--rebar-space-xs, 4px)" }}
            >
              {overflowItems.map((item, i) => (
                <span key={`${item.label}-${visibleCount + i}`}>
                  {renderLink({ href: item.href, children: renderLabel(item.label), className: "rebar-navbar-overflow-link" })}
                </span>
              ))}
            </div>
          </Popover>
        ) : null}
      </nav>
    </div>
  );
}
