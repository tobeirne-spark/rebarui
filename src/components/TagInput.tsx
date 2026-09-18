import { useId, useState } from "react";
import type { KeyboardEvent } from "react";
import clsx from "clsx";
import { Tag } from "./Tag";

export interface TagInputProps {
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
  placeholder?: string;
  "aria-label"?: string;
  disabled?: boolean;
  /** Caps the number of tags — the input itself disables once reached. Unset means no limit. */
  maxTags?: number;
  /** Skips adding a tag that already exists (case-insensitive). Default `true`. */
  allowDuplicates?: boolean;
  className?: string;
}

/**
 * Free-form typed tag entry — press Enter or `,` to commit the current text as a tag, Backspace on
 * an empty input removes the last one. Distinct from `MultiSelect`/`Combobox` (both pick from a
 * supplied option list) and from `Mentions` (@-autocomplete inside prose, not a standalone field):
 * this accepts arbitrary typed values with no fixed list behind it. Real state — committed
 * tags + in-progress text — the same "search-and-filter"-adjacent state-machine richness that
 * makes `Combobox` an Opinion, not an Imitation.
 */
export function TagInput({
  values,
  defaultValues,
  onValuesChange,
  placeholder = "Add a tag...",
  "aria-label": ariaLabel = "Tags",
  disabled,
  maxTags,
  allowDuplicates = false,
  className,
}: TagInputProps) {
  const listId = useId();
  const [internalValues, setInternalValues] = useState<string[]>(defaultValues ?? []);
  const currentValues = values ?? internalValues;
  const [draft, setDraft] = useState("");

  const atLimit = maxTags !== undefined && currentValues.length >= maxTags;

  const commit = (next: string[]) => {
    setInternalValues(next);
    onValuesChange?.(next);
  };

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || atLimit) return;
    if (!allowDuplicates && currentValues.some((v) => v.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    commit([...currentValues, tag]);
    setDraft("");
  };

  // Removes by index, not value — with `allowDuplicates`, two tags can share the same text, and
  // filtering by value would remove every matching occurrence instead of just the one clicked.
  const removeTagAt = (index: number) => {
    commit(currentValues.filter((_, i) => i !== index));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
    } else if (event.key === "Backspace" && draft === "" && currentValues.length > 0) {
      removeTagAt(currentValues.length - 1);
    }
  };

  return (
    <div
      className={clsx("rebar-tag-input", className)}
      data-rebar-component="tag-input"
      data-rebar-disabled={disabled || undefined}
    >
      <div className="rebar-tag-input-chips" data-rebar-part="chips" id={listId}>
        {currentValues.map((tag, index) => (
          <Tag key={`${tag}-${index}`} closable={!disabled} onClose={() => removeTagAt(index)}>
            {tag}
          </Tag>
        ))}
        <input
          type="text"
          className="rebar-tag-input-field"
          data-rebar-part="input"
          aria-label={ariaLabel}
          aria-describedby={listId}
          placeholder={currentValues.length === 0 ? placeholder : undefined}
          value={draft}
          disabled={disabled || atLimit}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
        />
      </div>
    </div>
  );
}
