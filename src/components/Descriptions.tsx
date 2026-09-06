import { forwardRef } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { renderBionicChildren, useAmbientBionic, useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface DescriptionItem {
  label: string;
  value: ReactNode;
  span?: number;
}

export interface DescriptionsProps {
  title?: ReactNode;
  items: DescriptionItem[];
  column?: number;
  className?: string;
  /** Force bionic reading on/off for the title and all items, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

export const Descriptions = forwardRef<HTMLDivElement, DescriptionsProps>(function Descriptions(
  { title, items, column = 3, className, bionic, bionicOptions },
  ref,
) {
  const ambient = useAmbientBionic();
  const bionicEnabled = bionic ?? ambient;
  const titleContent = useBionicChildren(title, bionic, bionicOptions);

  return (
    <div ref={ref} className={clsx("rebar-descriptions", className)} data-rebar-component="descriptions">
      {title ? (
        <div className="rebar-descriptions-title" data-rebar-part="title">
          {titleContent}
        </div>
      ) : null}
      <dl className="rebar-descriptions-grid" style={{ gridTemplateColumns: `repeat(${column}, 1fr)` }}>
        {items.map((item, index) => (
          <div
            key={index}
            className="rebar-descriptions-item"
            data-rebar-part="item"
            style={item.span ? { gridColumn: `span ${item.span}` } : undefined}
          >
            <dt className="rebar-descriptions-label">
              {renderBionicChildren(item.label, bionicEnabled, bionicOptions)}
            </dt>
            <dd className="rebar-descriptions-value">
              {renderBionicChildren(item.value, bionicEnabled, bionicOptions)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
});
