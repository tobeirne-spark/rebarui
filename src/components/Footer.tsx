import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";
import clsx from "clsx";
import { Divider } from "./Divider";
import { Tag } from "./Tag";

export interface FooterLinkItem {
  text: string;
  href: string;
}

export interface FooterChipItem {
  text: ReactNode;
  /** `"plain"` (default) is a non-interactive tag; `"link"` renders a real, focusable button. */
  type?: "plain" | "link";
}

export interface FooterProps extends Omit<ComponentPropsWithoutRef<"footer">, "children" | "content"> {
  /** Shown above everything else, with a dividing line on either side — e.g. "No more results". */
  label?: ReactNode;
  /** Plain content below the label — e.g. a copyright line. */
  content?: ReactNode;
  links?: FooterLinkItem[];
  chips?: FooterChipItem[];
  /**
   * Renders a link — defaults to a plain `<a href>`. Pass your framework's Link (e.g. Next.js's)
   * for client-side routing, same convention as `NavBar`/`SidebarNav`/`@rebar-ui/placement`'s
   * `renderLink`.
   */
  renderLink?: (props: { href: string; children: ReactNode; className?: string }) => ReactNode;
  /**
   * Called on a link click. When set, the default `href` navigation is prevented first — the
   * same "intercept the jump" behavior antd-mobile's own `Footer` documents — so the caller
   * decides what happens (e.g. its own router push) instead of a real page navigation firing.
   */
  onLinkClick?: (item: FooterLinkItem, index: number) => void;
  onChipClick?: (item: FooterChipItem, index: number) => void;
  className?: string;
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

/**
 * Page-bottom chrome: an optional "no more content" label (a `Divider` with text), a plain
 * content line (e.g. copyright), a row of links, and a row of chips (plain tags, or real
 * clickable buttons styled as tags) — antd-mobile's own `Footer` shape, ported directly since
 * nothing in this library covered page-footer content before. Every section is independently
 * optional; renders nothing but the `<footer>` wrapper if none are set.
 */
export function Footer({
  label,
  content,
  links,
  chips,
  renderLink = defaultRenderLink,
  onLinkClick,
  onChipClick,
  className,
  ...props
}: FooterProps) {
  const handleLinkClick = (event: MouseEvent, item: FooterLinkItem, index: number) => {
    if (onLinkClick) {
      event.preventDefault();
      onLinkClick(item, index);
    }
  };

  return (
    <footer className={clsx("rebar-footer", className)} data-rebar-component="footer" {...props}>
      {label ? (
        <Divider className="rebar-footer-label" data-rebar-part="label">
          {label}
        </Divider>
      ) : null}
      {content ? (
        <div className="rebar-footer-content" data-rebar-part="content">
          {content}
        </div>
      ) : null}
      {links && links.length > 0 ? (
        <div className="rebar-footer-links" data-rebar-part="links">
          {links.map((item, index) => (
            <span
              key={`${item.text}-${index}`}
              className="rebar-footer-link-wrap"
              onClick={(event) => handleLinkClick(event, item, index)}
            >
              {renderLink({ href: item.href, children: item.text, className: "rebar-footer-link" })}
            </span>
          ))}
        </div>
      ) : null}
      {chips && chips.length > 0 ? (
        <div className="rebar-footer-chips" data-rebar-part="chips">
          {chips.map((item, index) =>
            item.type === "link" ? (
              <button
                key={index}
                type="button"
                className="rebar-tag rebar-footer-chip-link"
                onClick={() => onChipClick?.(item, index)}
              >
                <span data-rebar-part="label">{item.text}</span>
              </button>
            ) : (
              <Tag key={index}>{item.text}</Tag>
            ),
          )}
        </div>
      ) : null}
    </footer>
  );
}
