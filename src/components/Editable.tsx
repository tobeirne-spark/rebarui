import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import clsx from "clsx";
import { Input } from "./Input";
import { EnterOutlined } from "./icons";

export interface EditableProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
  /**
   * Shows a small `EnterOutlined` glyph inside the field, right side, while editing — a visual
   * reminder that Enter is what actually commits here (blur also commits, but a click-away isn't
   * an obvious "save" gesture the way pressing a labeled key is). On by default since Enter-to-
   * save is this component's own real behavior, not optional per instance; set `false` for a
   * denser UI (a table full of these, say) where the repeated hint becomes visual noise once a
   * user already knows the pattern.
   */
  showEnterHint?: boolean;
}

/**
 * Click-to-edit text: reads as plain text until activated (click, or Enter/Space when focused),
 * then becomes a real text input — Enter or blur commits, Escape reverts to the value it had
 * before this edit started, not just whatever's currently in the field. The read-mode element is
 * a real, focusable, keyboard-activatable button (heuristic #7, full keyboard operability), not a
 * bare `<span onClick>`.
 */
export function Editable({
  value,
  defaultValue = "",
  onChange,
  onSubmit,
  placeholder,
  "aria-label": ariaLabel,
  disabled,
  className,
  showEnterHint = true,
}: EditableProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [editing, setEditing] = useState(false);
  const beforeEditRef = useRef("");
  const isControlled = value !== undefined;
  const current = isControlled ? value : internalValue;

  const commit = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
    onSubmit?.(next);
  };

  const startEditing = () => {
    if (disabled) return;
    beforeEditRef.current = current;
    setEditing(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setEditing(false);
    } else if (event.key === "Escape") {
      commit(beforeEditRef.current);
      setEditing(false);
    }
  };

  if (editing) {
    const hint = showEnterHint && !disabled;
    return (
      <span className="rebar-editable-input-wrapper" data-rebar-part="input-wrapper">
        <Input
          className={clsx(className, hint && "rebar-editable-input-with-hint")}
          aria-label={ariaLabel}
          autoFocus
          value={current}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={handleKeyDown}
          data-rebar-part="input"
        />
        {hint ? (
          <span className="rebar-enter-hint rebar-editable-enter-hint" data-rebar-part="enter-hint" title="Press Enter to save">
            <EnterOutlined />
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={clsx("rebar-editable", className)}
      data-rebar-component="editable"
      data-rebar-part="display"
      aria-label={ariaLabel ? `${ariaLabel}, click to edit` : "Click to edit"}
      disabled={disabled}
      onClick={startEditing}
    >
      {current || <span className="rebar-editable-placeholder">{placeholder}</span>}
    </button>
  );
}
