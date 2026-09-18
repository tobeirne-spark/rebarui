import clsx from "clsx";
import { Avatar } from "./Avatar";
import { Dropdown } from "./Dropdown";
import type { DropdownItem } from "./Dropdown";

export interface WorkspaceSwitcherItem {
  id: string;
  name: string;
  avatarSrc?: string;
}

export interface WorkspaceSwitcherProps {
  workspaces: WorkspaceSwitcherItem[];
  /** The currently active workspace's `id` — must match one entry in `workspaces`. */
  activeId: string;
  onSelect: (id: string) => void;
  /** Rendered as a trailing action below the workspace list, separated by a divider (e.g. "+ New
   * workspace"). Omitted entirely when unset. */
  onCreateNew?: () => void;
  createLabel?: string;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "");
}

/**
 * An org/workspace/tenant switcher — the Slack/Notion/Linear header pattern: page-level governance
 * of which tenant context the whole app is currently in, the same Order-tier role `NavBar`/
 * `SidebarNav` already play for navigation. Built on the real `Dropdown` (a Radix menu, correct
 * focus/keyboard handling for free) rather than a hand-rolled popover.
 */
export function WorkspaceSwitcher({
  workspaces,
  activeId,
  onSelect,
  onCreateNew,
  createLabel = "New workspace",
  className,
}: WorkspaceSwitcherProps) {
  const active = workspaces.find((w) => w.id === activeId);

  const items: DropdownItem[] = [
    ...workspaces.map((w) => ({
      key: w.id,
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: "var(--rebar-space-sm, 8px)" }}>
          <Avatar src={w.avatarSrc} fallback={initials(w.name)} size="sm" />
          {w.name}
        </span>
      ),
      onSelect: () => onSelect(w.id),
    })),
    ...(onCreateNew
      ? [
          {
            key: "__create_new__",
            label: createLabel,
            onSelect: onCreateNew,
          },
        ]
      : []),
  ];

  return (
    <Dropdown
      items={items}
      trigger={
        <button
          type="button"
          className={clsx("rebar-workspace-switcher", className)}
          data-rebar-component="workspace-switcher"
        >
          {active ? <Avatar src={active.avatarSrc} fallback={initials(active.name)} size="sm" /> : null}
          <span className="rebar-workspace-switcher-name" data-rebar-part="name">
            {active?.name ?? "Select workspace"}
          </span>
          <span aria-hidden="true" className="rebar-workspace-switcher-caret">
            ▾
          </span>
        </button>
      }
    />
  );
}
