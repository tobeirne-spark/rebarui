import { forwardRef } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { renderBionicChildren, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";

export type StepStatus = "wait" | "process" | "finish" | "error";

export interface StepItem {
  title: string;
  description?: string;
  status?: StepStatus;
  /** Overrides the icon slot's default (a 1-based index, or ✓/✕ for finish/error) — e.g. a
   * `Wizard`'s overflow window uses this to show a step's real, absolute number rather than its
   * position within the shortened list, or a glyph for a "N done"/"N todo" bucket item. */
  icon?: ReactNode;
  /** Forces the "you are here" traveling-beam border regardless of `status` -- for a caller that
   * (like `status` itself) fully owns each item's status and marks a step "finish" the moment its
   * own commit/done signal fires, independent of which one is currently being viewed. Without
   * this, a caller in that position has no way to show "here" on a step that's already finished,
   * since `status` can only ever be one value at a time. */
  current?: boolean;
}

export interface StepsProps {
  items: StepItem[];
  current?: number;
  direction?: "horizontal" | "vertical";
  className?: string;
  /** Force bionic reading on/off for all items, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
  /** Makes every step clickable (e.g. free navigation in a checklist, or a caller windowing a
   * long step list down to a visible slice) — omit for the original, purely presentational
   * behavior. */
  onItemClick?: (index: number) => void;
}

function resolveStatus(item: StepItem, index: number, current: number): StepStatus {
  if (item.status) return item.status;
  if (index < current) return "finish";
  if (index === current) return "process";
  return "wait";
}

export const Steps = forwardRef<HTMLOListElement, StepsProps>(function Steps(
  { items, current = 0, direction = "horizontal", className, bionic, bionicOptions, onItemClick },
  ref,
) {
  const ambient = useAmbientBionic();
  const bionicEnabled = bionic ?? ambient;

  return (
    <ol
      ref={ref}
      className={clsx("rebar-steps", `rebar-steps-${direction}`, onItemClick && "rebar-steps-clickable", className)}
      data-rebar-component="steps"
      data-rebar-direction={direction}
    >
      {items.map((item, index) => {
        const status = resolveStatus(item, index, current);
        const isCurrent = status === "process" || item.current === true;
        const content = (
          <>
            {/* "process" (or an explicit item.current override, see StepItem's own doc comment)
                reuses the generic .rebar-active-border traveling-beam flag (see its own doc
                comment in style.css) as the "this step is in focus" signal, rather than a static
                colored ring alone -- a caller that fully owns each item's `status` (e.g. only
                ever marking "finish" once something explicit, like a commit toggle, confirms it)
                still gets a clear "you are here" cue on whichever step is current, even one
                that's already finished. */}
            <span className={clsx("rebar-steps-icon", isCurrent && "rebar-active-border")} data-rebar-part="icon" aria-hidden="true">
              {item.icon ?? (status === "finish" ? "✓" : status === "error" ? "✕" : index + 1)}
            </span>
            <span className="rebar-steps-content" data-rebar-part="content">
              <span className="rebar-steps-title">
                {renderBionicChildren(item.title, bionicEnabled, bionicOptions)}
              </span>
              {item.description ? (
                <span className="rebar-steps-description">
                  {renderBionicChildren(item.description, bionicEnabled, bionicOptions)}
                </span>
              ) : null}
            </span>
          </>
        );
        return (
          <li
            key={index}
            className="rebar-steps-item"
            data-rebar-part="item"
            data-rebar-status={status}
            aria-current={isCurrent ? "step" : undefined}
          >
            {onItemClick ? (
              <button type="button" className="rebar-steps-item-button" onClick={() => onItemClick(index)}>
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
});
