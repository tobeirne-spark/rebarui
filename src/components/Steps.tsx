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
}

export interface StepsProps {
  items: StepItem[];
  current?: number;
  direction?: "horizontal" | "vertical";
  className?: string;
  /** Force bionic reading on/off for all items, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

function resolveStatus(item: StepItem, index: number, current: number): StepStatus {
  if (item.status) return item.status;
  if (index < current) return "finish";
  if (index === current) return "process";
  return "wait";
}

export const Steps = forwardRef<HTMLOListElement, StepsProps>(function Steps(
  { items, current = 0, direction = "horizontal", className, bionic, bionicOptions },
  ref,
) {
  const ambient = useAmbientBionic();
  const bionicEnabled = bionic ?? ambient;

  return (
    <ol
      ref={ref}
      className={clsx("rebar-steps", `rebar-steps-${direction}`, className)}
      data-rebar-component="steps"
      data-rebar-direction={direction}
    >
      {items.map((item, index) => {
        const status = resolveStatus(item, index, current);
        return (
          <li
            key={index}
            className="rebar-steps-item"
            data-rebar-part="item"
            data-rebar-status={status}
            aria-current={status === "process" ? "step" : undefined}
          >
            <span className="rebar-steps-icon" data-rebar-part="icon" aria-hidden="true">
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
          </li>
        );
      })}
    </ol>
  );
});
