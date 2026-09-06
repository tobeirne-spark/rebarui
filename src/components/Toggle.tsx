import { forwardRef, useState } from "react";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface ToggleProps extends ComponentPropsWithoutRef<"button"> {
  /** Controlled pressed state. Omit for uncontrolled use via `defaultPressed`. */
  pressed?: boolean;
  /** Initial pressed state when uncontrolled. Ignored if `pressed` is supplied. */
  defaultPressed?: boolean;
  /** Fires with the next pressed state whenever the toggle is activated (click or Enter/Space). */
  onPressedChange?: (pressed: boolean) => void;
  /** Matches `Button`'s own size scale so a `Toggle` sitting next to real `Button`s in a toolbar
   * shares the same padding/height. Default `"md"` is the real ≥44×44px touch target. */
  size?: "sm" | "md" | "lg";
  /** Force bionic reading on/off for this instance, overriding the ambient data-rebar-bionic
   * setting — same convention as `Button`. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

/**
 * A single pressable on/off button — the classic toolbar-button shape (Bold/Italic in a rich
 * text editor toolbar): looks like a normal button, but carries a persistent pressed/unpressed
 * state via `aria-pressed`, not a momentary click. Distinct from `Switch` (a form-field boolean,
 * always shows a track/thumb) and `SegmentedControl` (an exclusive-choice set of several
 * options) — `Toggle` is one button, remembering whether it's "on".
 *
 * Accepts arbitrary `children` (icon and/or text), same as `Button`. If used icon-only (no
 * visible text in `children`), the caller must supply an explicit `aria-label` — `Toggle` has no
 * built-in fallback label, the same convention `Button` itself already follows (an icon-only
 * `Button` needs a caller-supplied `aria-label` too; neither component invents placeholder text
 * that would just be redundant when real visible text is present).
 *
 * Deliberately does NOT wrap the real `Button` component internally, even though it shares
 * `Button`'s CSS class for sizing/padding (see `.rebar-toggle` reusing `.rebar-button`'s rules in
 * `style.css`). `Button` hardcodes `data-rebar-component="button"` and its own `disabled`/
 * `aria-busy` semantics for a `loading` state Toggle has no equivalent of — nesting `Button` here
 * would mean fighting to override attributes `Button` already committed to on its own root
 * rather than sharing them. Composing at the CSS layer (same class, same tokens) gets the
 * "shares visual DNA with Button" goal without that friction; a real `<button>` underneath is
 * still exactly what `Button` renders too, so no behavior is duplicated, only the JSX.
 */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  {
    pressed,
    defaultPressed = false,
    onPressedChange,
    size = "md",
    disabled,
    className,
    onClick,
    type = "button",
    bionic,
    bionicOptions,
    children,
    ...props
  },
  ref,
) {
  const [internalPressed, setInternalPressed] = useState(defaultPressed);
  const isControlled = pressed !== undefined;
  const current = isControlled ? pressed : internalPressed;
  const content = useBionicChildren(children, bionic, bionicOptions);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const next = !current;
    if (!isControlled) setInternalPressed(next);
    onPressedChange?.(next);
  };

  return (
    <button
      ref={ref}
      type={type}
      className={clsx("rebar-toggle", className)}
      data-rebar-component="toggle"
      data-rebar-pressed={current || undefined}
      data-rebar-size={size}
      aria-pressed={current}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {content}
    </button>
  );
});
