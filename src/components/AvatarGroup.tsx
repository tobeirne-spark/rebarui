import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { Avatar } from "./Avatar";
import type { AvatarProps } from "./Avatar";

export interface AvatarGroupItem {
  src?: string;
  fallback: string;
}

export interface AvatarGroupProps extends Omit<ComponentPropsWithoutRef<"div">, "className"> {
  avatars: AvatarGroupItem[];
  /** How many avatars to show before collapsing the rest into a "+N" overflow avatar. Default 5. */
  max?: number;
  /** Forwarded to every real `Avatar` rendered, including the overflow one — same sm/md/lg
   * convention as `Avatar` itself. */
  size?: AvatarProps["size"];
  className?: string;
}

/**
 * A stacked, overlapping row of real `Avatar`s (composition, not reimplementation) with a real
 * "+N more" overflow avatar once there are more than `max` — never several plain `Avatar`s just
 * laid out side by side.
 */
export function AvatarGroup({ avatars, max = 5, size, className, ...props }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflowCount = avatars.length - visible.length;

  return (
    <div className={clsx("rebar-avatar-group", className)} data-rebar-component="avatar-group" {...props}>
      {visible.map((avatar, i) => (
        <Avatar
          key={`${avatar.fallback}-${i}`}
          src={avatar.src}
          fallback={avatar.fallback}
          alt={avatar.fallback}
          size={size}
          className="rebar-avatar-group-item"
          data-rebar-part="item"
        />
      ))}
      {overflowCount > 0 ? (
        <Avatar
          fallback={`+${overflowCount}`}
          size={size}
          className="rebar-avatar-group-item rebar-avatar-group-overflow"
          data-rebar-part="overflow"
        />
      ) : null}
    </div>
  );
}
