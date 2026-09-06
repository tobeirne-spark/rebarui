import { useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import clsx from "clsx";

export interface PinInputProps {
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  "aria-label"?: string;
  disabled?: boolean;
  /** Renders each filled box as a dot, like a password field — for a PIN, not an OTP code someone
   * needs to visually confirm before submitting. */
  mask?: boolean;
  className?: string;
}

/**
 * Segmented single-digit input boxes for confirmation codes — one real gap this closes: a plain
 * text input for a 6-digit code gives no visual sense of how many digits are expected or how many
 * have been entered so far. Auto-advances focus per digit, handles backspace-to-previous and
 * pasting a full code across every box at once.
 */
export function PinInput({
  length = 6,
  value,
  defaultValue = "",
  onChange,
  onComplete,
  "aria-label": ariaLabel = "Verification code",
  disabled,
  mask,
  className,
}: PinInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = (isControlled ? value : internalValue).padEnd(length, "\0").slice(0, length);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const commit = (next: string) => {
    const trimmed = next.replace(/\0/g, "");
    if (!isControlled) setInternalValue(trimmed);
    onChange?.(trimmed);
    if (trimmed.length === length) onComplete?.(trimmed);
  };

  const setDigit = (index: number, digit: string) => {
    const chars = current.split("");
    chars[index] = digit || "\0";
    commit(chars.join(""));
    if (digit && index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !current[index]?.trim().replace("\0", "") && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\s/g, "");
    if (!pasted) return;
    event.preventDefault();
    const chars = current.split("");
    for (let i = 0; i < pasted.length && index + i < length; i++) {
      chars[index + i] = pasted[i] ?? "\0";
    }
    commit(chars.join(""));
    const nextFocus = Math.min(index + pasted.length, length - 1);
    inputRefs.current[nextFocus]?.focus();
  };

  return (
    <div
      className={clsx("rebar-pin-input", className)}
      data-rebar-component="pin-input"
      role="group"
      aria-label={ariaLabel}
    >
      {Array.from({ length }, (_, i) => current[i]?.replace("\0", "") ?? "").map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type={mask ? "password" : "text"}
          inputMode="numeric"
          maxLength={1}
          className="rebar-input rebar-pin-input-box"
          data-rebar-part="digit"
          aria-label={`Digit ${i + 1} of ${length}`}
          disabled={disabled}
          value={digit}
          onChange={(e) => setDigit(i, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
        />
      ))}
    </div>
  );
}
