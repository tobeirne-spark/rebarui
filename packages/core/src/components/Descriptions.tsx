import { forwardRef } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { Editable } from "./Editable";
import { renderBionicChildren, useAmbientBionic, useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface DescriptionItem {
  label: string;
  value: ReactNode;
  span?: number;
  /** Makes this item's value click-to-edit via the real `Editable` component instead of plain
   * static content. Requires `value` to be a plain string — a non-string value (or one omitted
   * entirely) stays static even with this set, the same "no-op, not a crash" convention `Card`'s
   * own `editable` title follows for a non-string `title`. Per-item, not all-or-nothing: a
   * computed/derived field can sit right next to an editable one. */
  editable?: boolean;
}

export interface DescriptionsProps {
  title?: ReactNode;
  items: DescriptionItem[];
  column?: number;
  className?: string;
  /** Fires with the new value when an `editable` item is committed — required for the edit to
   * actually persist anywhere, same as any other controlled-editing component here. Called with
   * the item's index into `items`. */
  onItemChange?: (index: number, newValue: string) => void;
  /** Force bionic reading on/off for the title and all items, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

export const Descriptions = forwardRef<HTMLDivElement, DescriptionsProps>(function Descriptions(
  { title, items, column = 3, className, onItemChange, bionic, bionicOptions },
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
        {items.map((item, index) => {
          const isEditable = item.editable && typeof item.value === "string";
          return (
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
                {isEditable ? (
                  <Editable
                    value={item.value as string}
                    onChange={(next) => onItemChange?.(index, next)}
                    aria-label={item.label}
                    className="rebar-descriptions-value-editable"
                  />
                ) : (
                  renderBionicChildren(item.value, bionicEnabled, bionicOptions)
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
});
