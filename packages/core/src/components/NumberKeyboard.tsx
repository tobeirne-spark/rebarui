import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";

export interface NumberKeyboardProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
  onInput: (digit: string) => void;
  onDelete: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  /** An extra key in the bottom-left slot (where a keypad often has "." for decimals, or "00") —
   * omitted entirely (a blank slot) when not passed. */
  customKey?: string;
  /** Shuffles the 0-9 digit positions each time the keyboard opens — the antd-mobile security
   * feature for PIN entry: defeats shoulder-surfing or a compromised screen recording that relies
   * on remembering key *positions* rather than values. `customKey`/delete stay in their fixed
   * corners regardless. Default `false`. */
  randomOrder?: boolean;
  /** Closes the keyboard automatically after `onConfirm` fires. Default `true`. */
  closeOnConfirm?: boolean;
  className?: string;
}

function shuffledDigits(): string[] {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j]!, digits[i]!];
  }
  return digits;
}

const ORDERED_DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

/**
 * An on-screen numeric keypad, presented as a real `BottomSheet` — the antd-mobile
 * `NumberKeyboard` pattern, typically paired with `PinInput` for secure entry (a PIN/passcode
 * field that shouldn't invoke the device's own native keyboard, which some platforms render with
 * predictive text or leave a visible input trail). This component owns only the keypad UI and
 * emits `onInput`/`onDelete`/`onConfirm` — it holds no PIN state of its own, matching every other
 * "presentational, caller owns the data" component in this library (`FileUpload`, `ChatThread`).
 */
export function NumberKeyboard({
  open,
  defaultOpen = false,
  onOpenChange,
  title,
  onInput,
  onDelete,
  onConfirm,
  confirmLabel,
  customKey,
  randomOrder = false,
  closeOnConfirm = true,
  className,
}: NumberKeyboardProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const [digits, setDigits] = useState<string[]>(ORDERED_DIGITS);

  useEffect(() => {
    if (isOpen && randomOrder) setDigits(shuffledDigits());
    if (isOpen && !randomOrder) setDigits(ORDERED_DIGITS);
  }, [isOpen, randomOrder]);

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const handleConfirm = () => {
    onConfirm?.();
    if (closeOnConfirm) setOpen(false);
  };

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={setOpen}
      title={title}
      className={clsx("rebar-number-keyboard", className)}
    >
      <div className="rebar-number-keyboard-grid" data-rebar-component="number-keyboard" data-rebar-part="grid">
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            className="rebar-number-keyboard-key"
            data-rebar-part="key"
            aria-label={digit}
            onClick={() => onInput(digit)}
          >
            {digit}
          </button>
        ))}
        {customKey ? (
          <button
            type="button"
            className="rebar-number-keyboard-key"
            data-rebar-part="custom-key"
            aria-label={customKey}
            onClick={() => onInput(customKey)}
          >
            {customKey}
          </button>
        ) : (
          <span className="rebar-number-keyboard-key-spacer" aria-hidden="true" />
        )}
        <button
          type="button"
          className="rebar-number-keyboard-key rebar-number-keyboard-delete"
          data-rebar-part="delete-key"
          aria-label="Delete"
          onClick={onDelete}
        >
          ⌫
        </button>
      </div>
      {onConfirm ? (
        <Button
          type="button"
          variant="primary"
          className="rebar-number-keyboard-confirm"
          data-rebar-part="confirm"
          onClick={handleConfirm}
        >
          {confirmLabel ?? "Confirm"}
        </Button>
      ) : null}
    </BottomSheet>
  );
}
