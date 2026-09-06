import { forwardRef } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { renderBionicChildren, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";

export type TimelineDotTone = "default" | "info" | "success" | "warning" | "error";

export interface TimelineItem {
  children: ReactNode;
  label?: ReactNode;
  tone?: TimelineDotTone;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  /** Force bionic reading on/off for all items, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

export const Timeline = forwardRef<HTMLOListElement, TimelineProps>(function Timeline(
  { items, className, bionic, bionicOptions },
  ref,
) {
  const ambient = useAmbientBionic();
  const bionicEnabled = bionic ?? ambient;

  return (
    <ol ref={ref} className={clsx("rebar-timeline", className)} data-rebar-component="timeline">
      {items.map((item, index) => (
        <li
          key={index}
          className="rebar-timeline-item"
          data-rebar-part="item"
          data-rebar-tone={item.tone ?? "default"}
        >
          <span className="rebar-timeline-dot" data-rebar-part="dot" aria-hidden="true" />
          <div className="rebar-timeline-content" data-rebar-part="content">
            {item.label ? (
              <div className="rebar-timeline-label">
                {renderBionicChildren(item.label, bionicEnabled, bionicOptions)}
              </div>
            ) : null}
            <div>{renderBionicChildren(item.children, bionicEnabled, bionicOptions)}</div>
          </div>
        </li>
      ))}
    </ol>
  );
});
