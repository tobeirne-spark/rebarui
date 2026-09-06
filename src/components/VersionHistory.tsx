import type { ReactNode } from "react";
import { DrawerPanel } from "./Drawer";
import type { DrawerSide } from "./Drawer";
import { Popconfirm } from "./Popconfirm";
import { Button } from "./Button";
import { Tag } from "./Tag";
import { Empty } from "./Empty";
import { renderBionicChildren, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface VersionSnapshot {
  id: string;
  /** e.g. "Auto-saved", "Before AI edit", or a manual name the user gave this snapshot. */
  label: string;
  timestamp: string | Date;
  /** Truncated content preview — rendered clamped to two lines, full text stays in the DOM. */
  preview?: string;
}

export interface VersionHistoryProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the panel when clicked — same convention as Drawer's own `trigger`. */
  trigger?: ReactNode;
  /** Drawer heading. Defaults to "Version history". */
  title?: ReactNode;
  side?: DrawerSide;
  size?: number;
  className?: string;
  /** Newest first — ordering is the caller's responsibility, this component renders as given. */
  versions: VersionSnapshot[];
  /** Which version, if any, is "current" — shown with a Current pill (ref/HEURISTICS.md #41: a
   * lifecycle status is a pill, never inline parenthetical text or a full sentence). */
  currentVersionId?: string;
  /** Fires only after the user confirms the Popconfirm — never on the initial Restore click. */
  onRestore: (version: VersionSnapshot) => void;
  /** Customizable confirm question. Defaults to a generic "Restore this version?" message
   * naming the version's own label. */
  restoreConfirmMessage?: (version: VersionSnapshot) => string;
  /** Force bionic reading on/off for every label, overriding the ambient data-rebar-bionic
   * setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

const defaultRestoreConfirmMessage = (version: VersionSnapshot) =>
  `Restore "${version.label}"? This replaces the current content.`;

function toDate(timestamp: string | Date): Date {
  return typeof timestamp === "string" ? new Date(timestamp) : timestamp;
}

/**
 * Recent snapshots (within a week either side of now) render as a relative phrase
 * ("3 hours ago") — easier to parse at a glance than a date. Anything older renders as an
 * absolute date/time instead, since "3 weeks ago" stops being a useful unit past that point.
 * An invalid/unparseable timestamp falls back to printing whatever the caller passed, rather
 * than silently rendering "Invalid Date".
 */
function formatTimestamp(timestamp: string | Date): string {
  const date = toDate(timestamp);
  if (Number.isNaN(date.getTime())) return String(timestamp);

  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 60 * 24 * 7) {
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
    if (absMinutes < 1) return rtf.format(0, "minute");
    if (absMinutes < 60) return rtf.format(diffMinutes, "minute");
    if (absMinutes < 60 * 24) return rtf.format(Math.round(diffMinutes / 60), "hour");
    return rtf.format(Math.round(diffMinutes / (60 * 24)), "day");
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * A drawer listing timestamped content snapshots, each restorable only after a real confirm
 * step — this is a destructive/overwriting action (restoring replaces whatever the caller's
 * current content is), so it never fires on a single click, per this project's own destructive-
 * action heuristic.
 *
 * Pure composition, same as `Popconfirm`/`BottomSheet`/`ActionSheet` before it: the panel chrome
 * is the real `DrawerPanel` (the same plumbing `Drawer` itself uses, supplying this component's
 * own `data-rebar-component` the way `BottomSheet`/`ActionSheet` already do rather than nesting a
 * `<Drawer>` — a `<Drawer>` element hardcodes its own `data-rebar-component="drawer"` with no way
 * for a caller to override it), and each row's restore action is the real `Popconfirm` — no
 * reimplemented slide-in panel or confirm interaction. `VersionHistory` itself holds no state of
 * its own beyond what it forwards straight to `DrawerPanel`, the same thin-wrapper shape
 * `BottomSheet` uses (unlike `ActionSheet`, which needs its own controlled/uncontrolled state
 * because selecting an action must force the panel closed — restoring a version doesn't need
 * that: the panel stays open so the caller can keep browsing/restoring other versions).
 */
export function VersionHistory({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title = "Version history",
  side,
  size,
  className,
  versions,
  currentVersionId,
  onRestore,
  restoreConfirmMessage = defaultRestoreConfirmMessage,
  bionic,
  bionicOptions,
}: VersionHistoryProps) {
  const ambient = useAmbientBionic();
  const bionicEnabled = bionic ?? ambient;

  return (
    <DrawerPanel
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={title}
      side={side}
      size={size}
      className={className}
      dataComponent="version-history"
    >
      {versions.length === 0 ? (
        <div className="rebar-version-history-empty" data-rebar-part="empty">
          <Empty description="No versions yet" />
        </div>
      ) : (
        <ul className="rebar-version-history-list" data-rebar-part="list">
          {versions.map((version) => {
            const isCurrent = version.id === currentVersionId;
            const date = toDate(version.timestamp);
            const isValidDate = !Number.isNaN(date.getTime());
            return (
              <li
                key={version.id}
                className="rebar-version-history-row"
                data-rebar-part="row"
                data-rebar-current={isCurrent ? "true" : undefined}
              >
                <div className="rebar-version-history-row-main">
                  <div className="rebar-version-history-row-header">
                    <span className="rebar-version-history-label" data-rebar-part="label">
                      {renderBionicChildren(version.label, bionicEnabled, bionicOptions)}
                    </span>
                    {isCurrent ? (
                      <Tag tone="info" data-rebar-part="current-badge">
                        Current
                      </Tag>
                    ) : null}
                  </div>
                  <time
                    className="rebar-version-history-timestamp"
                    data-rebar-part="timestamp"
                    dateTime={isValidDate ? date.toISOString() : undefined}
                  >
                    {formatTimestamp(version.timestamp)}
                  </time>
                  {version.preview ? (
                    <p className="rebar-version-history-preview" data-rebar-part="preview">
                      {version.preview}
                    </p>
                  ) : null}
                </div>
                <div className="rebar-version-history-actions" data-rebar-part="actions">
                  <Popconfirm
                    trigger={
                      <Button
                        type="button"
                        variant="secondary"
                        data-rebar-part="restore-button"
                        aria-label={`Restore version "${version.label}"`}
                      >
                        Restore
                      </Button>
                    }
                    title={restoreConfirmMessage(version)}
                    confirmLabel="Restore"
                    cancelLabel="Cancel"
                    destructive
                    onConfirm={() => onRestore(version)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DrawerPanel>
  );
}
