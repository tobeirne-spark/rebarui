import { useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { renderBionicChildren, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface MobileTabBarItem {
  label: string;
  icon?: ReactNode;
  href?: string;
  onSelect?: () => void;
}

export interface MobileTabBarProps extends Omit<ComponentPropsWithoutRef<"nav">, "className"> {
  items: MobileTabBarItem[];
  /** Controlled active tab index. */
  activeIndex?: number;
  /** Initial active tab index for uncontrolled use. Defaults to 0. */
  defaultActiveIndex?: number;
  onActiveChange?: (index: number) => void;
  /** Renders a link for an item that has an `href` — defaults to a plain `<a href>`. Pass your
   * framework's Link (e.g. Next.js's) for client-side routing, same convention as `NavBar`'s
   * `renderLink` and `@rebar-ui/placement`'s `renderLink`. */
  renderLink?: (props: {
    href: string;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    "aria-current"?: "page";
  }) => ReactNode;
  className?: string;
  "aria-label"?: string;
  /** Force bionic reading on/off for item labels, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

const defaultRenderLink = ({
  href,
  children,
  className,
  onClick,
  "aria-current": ariaCurrent,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  "aria-current"?: "page";
}) => (
  <a href={href} className={className} onClick={onClick} aria-current={ariaCurrent}>
    {children}
  </a>
);

/**
 * A bottom-fixed, app-level primary navigation bar — icon-over-label items, `position: fixed` to
 * the bottom of its containing block. Structurally closer to `NavBar` (a plain nav row, real
 * `<a>`/`<button>` targets, a `renderLink` escape hatch for a framework router) than to `Dialog`/
 * `Drawer` — this is not a modal, it has no open/close state, just a set of always-visible
 * destinations.
 *
 * The most touch-target-sensitive of the touch-relevant components added alongside this one:
 * every item is a real, keyboard-focusable `<button>` or `<a>` at least 44×44 CSS px, icon and
 * label both shown (ref/HEURISTICS.md #13 — icons require labels, not icon-only tap targets).
 */
export function MobileTabBar({
  items,
  activeIndex,
  defaultActiveIndex = 0,
  onActiveChange,
  renderLink = defaultRenderLink,
  bionic,
  bionicOptions,
  className,
  "aria-label": ariaLabel = "Primary",
  ...props
}: MobileTabBarProps) {
  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;
  const isControlled = activeIndex !== undefined;
  const [internalActive, setInternalActive] = useState(defaultActiveIndex);
  const currentActive = isControlled ? activeIndex : internalActive;

  const setActive = (index: number) => {
    if (!isControlled) setInternalActive(index);
    onActiveChange?.(index);
  };

  return (
    <nav
      {...props}
      aria-label={ariaLabel}
      className={clsx("rebar-mobile-tab-bar", className)}
      data-rebar-component="mobile-tab-bar"
    >
      {items.map((item, i) => {
        const isActive = i === currentActive;
        const itemClassName = clsx(
          "rebar-mobile-tab-bar-item",
          isActive && "rebar-mobile-tab-bar-item-active",
        );
        const content = (
          <>
            {item.icon ? (
              <span className="rebar-mobile-tab-bar-icon" aria-hidden="true">
                {item.icon}
              </span>
            ) : null}
            <span className="rebar-mobile-tab-bar-label">
              {renderBionicChildren(item.label, bionicEnabled, bionicOptions)}
            </span>
          </>
        );
        const handleClick = () => {
          setActive(i);
          item.onSelect?.();
        };

        return (
          <div
            key={`${item.label}-${i}`}
            data-rebar-part="item"
            className="rebar-mobile-tab-bar-item-wrapper"
          >
            {item.href ? (
              renderLink({
                href: item.href,
                children: content,
                className: itemClassName,
                onClick: handleClick,
                "aria-current": isActive ? "page" : undefined,
              })
            ) : (
              <button
                type="button"
                className={itemClassName}
                onClick={handleClick}
                aria-current={isActive ? "page" : undefined}
              >
                {content}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
