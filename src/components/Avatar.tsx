import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import * as RadixAvatar from "@radix-ui/react-avatar";
import clsx from "clsx";
import { resolvePlaceholderSrc } from "./avatarPlaceholder";

export interface AvatarProps extends Omit<ComponentPropsWithoutRef<"span">, "className"> {
  src?: string;
  alt?: string;
  fallback: string;
  className?: string;
  /**
   * Shows one of Rebar's built-in illustrated placeholder portraits when `src` isn't set yet —
   * opt-in, off by default, so existing plain-initials usage is unaffected. `true` picks one
   * deterministically from `fallback` (the same name always gets the same portrait); a number
   * picks a specific one directly (`placeholder % AVATAR_PLACEHOLDERS.length`).
   */
  placeholder?: boolean | number;
  /** Visual size — same sm/md/lg convention as `Button`/`Input`. Defaults to `"md"` (the original,
   * only size this component shipped with), applied via `data-rebar-size` like every other sized
   * component here, not a prop-driven inline style. */
  size?: "sm" | "md" | "lg";
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, alt, fallback, className, placeholder, size = "md", ...props },
  ref,
) {
  const imageSrc = src ?? resolvePlaceholderSrc(placeholder, fallback);

  return (
    <RadixAvatar.Root
      ref={ref}
      className={clsx("rebar-avatar", className)}
      data-rebar-component="avatar"
      data-rebar-size={size}
      {...props}
    >
      {imageSrc ? (
        <RadixAvatar.Image className="rebar-avatar-image" src={imageSrc} alt={alt ?? ""} />
      ) : null}
      <RadixAvatar.Fallback className="rebar-avatar-fallback" data-rebar-part="fallback">
        {fallback}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
});
