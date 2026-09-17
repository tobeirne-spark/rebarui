import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ComponentPropsWithoutRef, KeyboardEvent } from "react";
import clsx from "clsx";
import { renderBionicChildren, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface MentionOption {
  id: string;
  label: string;
}

export interface MentionsProps
  extends Omit<ComponentPropsWithoutRef<"div">, "value" | "defaultValue" | "onChange"> {
  value?: string;
  defaultValue?: string;
  /** The full textarea content as plain text — mentions are written inline as `@name`, there is
   * no separate structured "list of mentioned ids" the caller has to keep in sync. */
  onValueChange?: (value: string) => void;
  options: MentionOption[];
  placeholder?: string;
  rows?: number;
  /** Force bionic reading on/off for the suggestion list's labels, overriding the ambient
   * data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

interface ActiveMention {
  /** Index into the full text where the triggering "@" sits. */
  start: number;
  query: string;
}

/** Looking backward from the cursor for `@` followed by a run of non-whitespace, non-`@`
 * characters, with either start-of-string or whitespace right before the `@` — the same
 * "is the user mid-token" check `Combobox`'s own filtering is built around, just anchored to a
 * trigger character instead of the whole field. */
function findActiveMention(textBeforeCursor: string): ActiveMention | null {
  const match = /(?:^|\s)@([^\s@]*)$/.exec(textBeforeCursor);
  if (!match) return null;
  const start = textBeforeCursor.lastIndexOf("@");
  return { start, query: match[1] ?? "" };
}

/**
 * An `@`-mention autocomplete inside a real `<textarea>` — distinct from `Combobox`'s general
 * type-to-filter dropdown, which is a dedicated single-value field, not a trigger character
 * inside a larger block of free text.
 *
 * Deliberate simplification, stated plainly: the dropdown is anchored near the textarea itself
 * (a `Popover`-like absolutely-positioned panel under it), not at the real caret pixel position.
 * Tracking a `<textarea>`'s actual caret coordinates requires mirroring its full content into a
 * hidden, identically-styled element to measure against — a genuinely hard problem for plain
 * HTML with no built-in API, and out of proportion to what this component needs to be useful.
 */
export function Mentions({
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder,
  rows = 3,
  bionic,
  bionicOptions,
  className,
  ...rest
}: MentionsProps) {
  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const current = isControlled ? (value ?? "") : internalValue;
  const setValue = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  const [activeMention, setActiveMention] = useState<ActiveMention | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelectionRef = useRef<number | null>(null);
  const listId = useId();

  const filtered = useMemo(() => {
    if (!activeMention) return [];
    const q = activeMention.query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, activeMention]);

  const open = activeMention !== null && filtered.length > 0;

  useLayoutEffect(() => {
    if (pendingSelectionRef.current !== null && textareaRef.current) {
      textareaRef.current.setSelectionRange(pendingSelectionRef.current, pendingSelectionRef.current);
      pendingSelectionRef.current = null;
    }
  }, [current]);

  const recomputeMention = (text: string, cursor: number) => {
    const mention = findActiveMention(text.slice(0, cursor));
    setActiveMention(mention);
    setActiveIndex(0);
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    setValue(next);
    recomputeMention(next, event.target.selectionStart ?? next.length);
  };

  const selectOption = (option: MentionOption) => {
    if (!activeMention) return;
    const cursor = textareaRef.current?.selectionStart ?? current.length;
    const before = current.slice(0, activeMention.start);
    const after = current.slice(cursor);
    const insertion = `@${option.label} `;
    const next = `${before}${insertion}${after}`;
    pendingSelectionRef.current = before.length + insertion.length;
    setValue(next);
    setActiveMention(null);
    setActiveIndex(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" || event.key === "Tab") {
      if (filtered[activeIndex]) {
        event.preventDefault();
        selectOption(filtered[activeIndex]);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setActiveMention(null);
    }
  };

  return (
    <div className={clsx("rebar-mentions", className)} data-rebar-component="mentions" {...rest}>
      <textarea
        ref={textareaRef}
        className="rebar-mentions-input"
        data-rebar-part="input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        placeholder={placeholder}
        rows={rows}
        value={current}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setActiveMention(null)}
      />
      {open ? (
        <ul id={listId} role="listbox" className="rebar-mentions-list" data-rebar-part="list">
          {filtered.map((option, i) => (
            <li
              key={option.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className="rebar-mentions-option"
              data-rebar-part="option"
              data-rebar-active={i === activeIndex || undefined}
              // onMouseDown (not onClick) fires before the textarea's onBlur closes the list —
              // same trick Combobox's own option list uses.
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(option);
              }}
            >
              {renderBionicChildren(option.label, bionicEnabled, bionicOptions)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
