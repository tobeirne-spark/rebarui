import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";
import { Editable } from "./Editable";
import { Tag } from "./Tag";
import type { TagTone } from "./Tag";
import { Watermark } from "./Watermark";

export interface CardProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  children?: ReactNode;
  /**
   * Full-bleed media at the top (an image, a video) — edge-to-edge, no padding. Closes the real
   * "product card"/"media card" shape found across the component-inventory research (Tailwind UI's
   * Product Card, MUI's `CardMedia`, AntD's `cover`) as a slot on this one component, not a
   * separate `ProductCard`/`MediaCard` component — cards come in enough shapes that a family of
   * near-duplicate components would just be this same primitive reimplemented per variant.
   */
  cover?: ReactNode;
  /** A small image/icon before the title — the "profile/team-member card" shape (AntD's
   * `Card.Meta`, MUI's `CardHeader avatar`): pair with `title` as a name and `children` as a role
   * or description. */
  avatar?: ReactNode;
  title?: ReactNode;
  /** Clamps `title` to this many lines (CSS line-clamp, real ellipsis) instead of wrapping it in
   * full — the "kanban card" shape (Trello, Jira, Linear, GitHub Projects, Asana), where many
   * cards of very different title lengths sit in a fixed-width column and a long one shouldn't
   * grow taller than its neighbors without limit. Omit for the default: wrap in full, no cap —
   * still the right choice for a single featured card rather than a dense column of them. */
  titleLines?: number;
  /** A secondary line directly under `title`, same "name + role" pairing as `avatar` but without
   * requiring one — a kanban card's short one-line context (a parent issue key, a due date), a
   * profile card's role/team, distinct from `children`'s full free-form body. */
  subtitle?: ReactNode;
  /** A row of small colored pills above the body — a kanban card's labels (Trello's colored label
   * bars, Jira's issue labels, Linear's project tags). Renders via the real `Tag` component, never
   * ad hoc colored `<span>`s — same rule already applied to `NavIndex`'s status pill. */
  labels?: { label: ReactNode; tone?: TagTone }[];
  /** Top-right header slot — a status tag, an overflow menu trigger, a "More" link. */
  extra?: ReactNode;
  /** A small badge inset in the card's own top-right corner, overlapping the cover/header rather
   * than sitting inline with them — a kanban card's priority flag or unread dot, the one real
   * "status icon in a corner" shape found across kanban-board implementations. Distinct from
   * `extra` (inline in the header row, pushes other header content aside) — this floats over
   * whatever's already there and never affects layout. */
  cornerBadge?: ReactNode;
  /** A compact meta row below the body, above `actions` — a kanban card's assignee avatar, due
   * date, comment/attachment counts (each item typically an icon + short label, composed by the
   * caller from whatever this library already ships: `Avatar`, `Tag`, an inline SVG or glyph).
   * Distinct from `actions`: this is read-only context, not evenly-split clickable buttons. */
  footer?: ReactNode;
  /** A bottom action row, evenly split — the "pricing card" CTA button, or a row of icon actions
   * (AntD's `actions`, MUI's `CardActions`). */
  actions?: ReactNode[];
  /** Makes `title` editable in place via the real `Editable` component (click to edit, Enter/blur
   * commits, Escape reverts) instead of plain static text — the "rename this card" affordance a
   * kanban card needs. Requires `title` to be a plain string; a non-string `title` still renders
   * as static text even with `editable` set, so passing rich content here is simply a no-op rather
   * than a crash. Off by default — every existing `title` usage (a `ReactNode`) is unaffected. */
  editable?: boolean;
  /** Fires with the new value on every edit while `editable` is set — required for the edit to
   * actually persist anywhere, same as any other controlled-value component in this library. */
  onTitleChange?: (value: string) => void;
  /** Force bionic reading on/off for this instance, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
  /** An animated light beam traveling around the card's edge — the visual signal for "a
   * compatible drag is near this valid drop target" (see ref/HEURISTICS.md's drop-zone-expansion
   * rule). Not itself a drop zone or a drag handler; just the affordance a caller (e.g. `Kanban`)
   * turns on for exactly as long as a compatible drag is within reach of dropping here. Respects
   * prefers-reduced-motion (a static, non-animated highlight instead of the traveling beam). */
  activeBorder?: boolean;
  /** Overlays a repeating diagonal watermark (via the real `Watermark` component) across the
   * whole card — a draft stamp, an internal-only marker, an attribution. Off by default. */
  watermark?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    className,
    children,
    cover,
    avatar,
    title,
    titleLines,
    subtitle,
    labels,
    extra,
    cornerBadge,
    footer,
    actions,
    editable,
    onTitleChange,
    bionic,
    bionicOptions,
    activeBorder,
    watermark,
    ...props
  },
  ref,
) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const bodyContent = useBionicChildren(children, bionic, bionicOptions);
  const titleIsEditable = editable && typeof title === "string";
  // A truthy check on `title` is right for the static case (no title means no title slot at
  // all) but wrong once it's editable — the user clearing the field to retype it is a normal,
  // mid-edit state, not "delete the title control." `titleIsEditable` alone already guarantees
  // `editable` was set with a real (if possibly empty) string, so it's the right signal here.
  const hasTitle = titleIsEditable || !!title;
  const hasHeader = !!(avatar || hasTitle || extra);

  const cardElement = (
    <div
      ref={ref}
      className={clsx("rebar-card", activeBorder && "rebar-active-border", className)}
      data-rebar-component="card"
      {...props}
    >
      {cornerBadge ? (
        <div className="rebar-card-corner-badge" data-rebar-part="corner-badge">
          {cornerBadge}
        </div>
      ) : null}
      {cover ? (
        <div className="rebar-card-cover" data-rebar-part="cover">
          {cover}
        </div>
      ) : null}
      {labels?.length ? (
        <div className="rebar-card-labels" data-rebar-part="labels">
          {labels.map((item, i) => (
            <Tag key={i} tone={item.tone}>
              {item.label}
            </Tag>
          ))}
        </div>
      ) : null}
      {hasHeader ? (
        <div className="rebar-card-header" data-rebar-part="header">
          <div className="rebar-card-header-main">
            {avatar ? (
              <span className="rebar-card-avatar" data-rebar-part="avatar">
                {avatar}
              </span>
            ) : null}
            {hasTitle ? (
              <span className="rebar-card-title-group">
                {titleIsEditable ? (
                  <Editable
                    value={title as string}
                    onChange={onTitleChange}
                    className="rebar-card-title rebar-card-title-editable"
                    aria-label="Title"
                  />
                ) : (
                  <span
                    className="rebar-card-title"
                    data-rebar-part="title"
                    style={
                      titleLines
                        ? { WebkitLineClamp: titleLines, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }
                        : undefined
                    }
                  >
                    {titleContent}
                  </span>
                )}
                {subtitle ? (
                  <span className="rebar-card-subtitle" data-rebar-part="subtitle">
                    {subtitle}
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>
          {extra ? (
            <span className="rebar-card-extra" data-rebar-part="extra">
              {extra}
            </span>
          ) : null}
        </div>
      ) : null}
      {children ? (
        <div className="rebar-card-body" data-rebar-part="body">
          {bodyContent}
        </div>
      ) : null}
      {footer ? (
        <div className="rebar-card-footer" data-rebar-part="footer">
          {footer}
        </div>
      ) : null}
      {actions?.length ? (
        <div className="rebar-card-actions" data-rebar-part="actions">
          {actions.map((action, i) => (
            <div key={i} className="rebar-card-action" data-rebar-part="action">
              {action}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );

  return watermark ? <Watermark text={watermark}>{cardElement}</Watermark> : cardElement;
});
