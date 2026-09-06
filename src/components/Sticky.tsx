import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { resolveStickyColor, resolveStickyRotation, resolveStickyTextColor } from "../stickyColor";
import { Tag } from "./Tag";
import { Text } from "./Text";

export interface StickyProps extends Omit<ComponentPropsWithoutRef<"div">, "title" | "color"> {
  title: string;
  /** The note's body text — kept plain (a `ReactNode`, not required to be a string) so a caller
   * can pass whatever short context fits, matching every other component's `children` slot. */
  children?: ReactNode;
  tags?: string[];
  /** A hex background color. Unset picks one deterministically from a small pastel palette, keyed
   * off `seed` — the same seed always gets the same color. */
  color?: string;
  /** Seed for the deterministic rotation and default-color pick — pass a stable id (a card's own
   * id, say) so re-renders don't reshuffle the look. Defaults to `title`, which is fine for a
   * one-off note but means two stickies with the same title would tilt identically; pass a real
   * id once you have more than a couple. */
  seed?: string;
  /** An animated light beam traveling the note's edge — the same drop-target signal `Card` uses
   * (see ref/HEURISTICS.md #47), usable here too since a sticky is just as valid a drop target. */
  activeBorder?: boolean;
}

/**
 * A postit-style note — procedurally varied rotation and a caller-or-auto-assigned color,
 * deterministic per `seed` so the same note always looks the same rather than reshuffling on
 * every render. Extracted from `Kanban`'s `cardVariant="sticky"` rendering into its own real
 * component so it has a visual identity independent of the board that first needed it — usable
 * anywhere a postit note fits, not just inside a kanban column. Text color is computed from the
 * note's own background luminance, not the ambient theme (a postit's paper color doesn't change
 * with the room's lighting, and neither should its ink) — see the comment on
 * `resolveStickyTextColor` for the dark-mode bug this specifically fixes.
 */
export function Sticky({ title, children, tags, color, seed = title, activeBorder, className, style, ...props }: StickyProps) {
  const resolvedColor = resolveStickyColor(seed, color);
  const textColor = resolveStickyTextColor(resolvedColor);

  return (
    <div
      className={clsx("rebar-sticky", activeBorder && "rebar-active-border", className)}
      data-rebar-component="sticky"
      style={{
        background: resolvedColor,
        transform: `rotate(${resolveStickyRotation(seed)}deg)`,
        ...style,
      }}
      {...props}
    >
      <Text data-rebar-part="title" style={{ fontWeight: "var(--rebar-font-weight-medium, 500)", color: textColor }}>
        {title}
      </Text>
      {children ? (
        <Text size="xs" data-rebar-part="body" style={{ color: textColor, opacity: 0.75 }}>
          {children}
        </Text>
      ) : null}
      {tags?.length ? (
        <div className="rebar-sticky-tags" data-rebar-part="tags">
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      ) : null}
    </div>
  );
}
