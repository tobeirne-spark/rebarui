import { useId, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import clsx from "clsx";
import { Tag } from "./Tag";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxSingleProps {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

interface ComboboxMultipleProps {
  multiple: true;
  /** Selected values render as removable chips, not a raw delimited string — see
   * ref/HEURISTICS.md #37. */
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
}

export type ComboboxProps = (ComboboxSingleProps | ComboboxMultipleProps) & {
  options: ComboboxOption[];
  placeholder?: string;
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * `Select` (`packages/core`) is browsing-only — no type-to-filter, checked directly against its
 * source. This closes that real gap: a text input that filters its own option list as the user
 * types, a real WAI-ARIA combobox (`role="combobox"` + a `listbox` popup + `aria-activedescendant`
 * tracking the highlighted option), not a styled `<select>`. See ref/HEURISTICS.md #27.
 *
 * `multiple` turns on multi-select: selected values render as removable chips inline with the
 * input (ref/HEURISTICS.md #37), already-selected options drop out of the remaining list, and the
 * dropdown stays open after each pick so choosing several options doesn't mean reopening it every
 * time — only single-select closes on selection. Deliberately one component with a `multiple`
 * prop rather than two near-identical ones (a lesson already applied to `Card`'s slot props and
 * `data-list`'s item shape this same session): multi-select is a mode of "type to filter a list,"
 * not a structurally different interaction.
 */
export function Combobox(props: ComboboxProps) {
  const { options, placeholder, "aria-label": ariaLabel, disabled, className, multiple } = props;
  const listId = useId();

  const singleProps = !multiple ? (props as ComboboxSingleProps) : undefined;
  const multiProps = multiple ? (props as ComboboxMultipleProps) : undefined;

  const [internalValue, setInternalValue] = useState(singleProps?.defaultValue);
  const [internalValues, setInternalValues] = useState<string[]>(multiProps?.defaultValues ?? []);
  const selectedValue = singleProps?.value ?? internalValue;
  const selectedValues = multiProps?.values ?? internalValues;

  const initialQuery = !multiple
    ? (options.find((o) => o.value === selectedValue)?.label ?? "")
    : "";
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const availableOptions = useMemo(
    () => (multiple ? options.filter((o) => !selectedValues.includes(o.value)) : options),
    [options, multiple, selectedValues],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableOptions;
    return availableOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [availableOptions, query]);

  const selectSingle = (option: ComboboxOption) => {
    setInternalValue(option.value);
    singleProps?.onValueChange?.(option.value);
    setQuery(option.label);
    setOpen(false);
    setActiveIndex(-1);
  };

  const addValue = (option: ComboboxOption) => {
    const next = [...selectedValues, option.value];
    setInternalValues(next);
    multiProps?.onValuesChange?.(next);
    setQuery("");
    setActiveIndex(-1);
  };

  const removeValue = (value: string) => {
    const next = selectedValues.filter((v) => v !== value);
    setInternalValues(next);
    multiProps?.onValuesChange?.(next);
  };

  const select = (option: ComboboxOption) => (multiple ? addValue(option) : selectSingle(option));

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      if (open && activeIndex >= 0 && filtered[activeIndex]) {
        event.preventDefault();
        select(filtered[activeIndex]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "Backspace" && multiple && query === "" && selectedValues.length > 0) {
      removeValue(selectedValues[selectedValues.length - 1]!);
    }
  };

  const inputEl = (
    <input
      type="text"
      role="combobox"
      className={multiple ? "rebar-combobox-tag-input" : "rebar-input"}
      aria-label={ariaLabel}
      aria-expanded={open}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
      aria-multiselectable={multiple || undefined}
      placeholder={multiple && selectedValues.length > 0 ? undefined : placeholder}
      disabled={disabled}
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        setOpen(true);
        setActiveIndex(-1);
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={handleKeyDown}
    />
  );

  return (
    <div
      className={clsx(multiple ? "rebar-combobox-multiple" : "rebar-combobox", className)}
      data-rebar-component="combobox"
      data-rebar-multiple={multiple || undefined}
    >
      {multiple ? (
        <div className="rebar-combobox-chips" data-rebar-part="field">
          {selectedValues.map((v) => {
            const option = options.find((o) => o.value === v);
            return (
              <Tag key={v} closable onClose={() => removeValue(v)}>
                {option?.label ?? v}
              </Tag>
            );
          })}
          {inputEl}
        </div>
      ) : (
        inputEl
      )}
      {open && filtered.length > 0 ? (
        <ul id={listId} role="listbox" className="rebar-combobox-list" data-rebar-part="list">
          {filtered.map((option, i) => (
            <li
              key={option.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className="rebar-combobox-option"
              data-rebar-active={i === activeIndex || undefined}
              // onMouseDown (not onClick) fires before the input's onBlur closes the list.
              onMouseDown={(e) => {
                e.preventDefault();
                select(option);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
