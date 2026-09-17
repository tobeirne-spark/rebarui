import { DrawerPanel } from "./Drawer";
import type { DrawerProps } from "./Drawer";

export type BottomSheetProps = Omit<DrawerProps, "side">;

/**
 * `Drawer` fixed to `side="bottom"`, plus a real drag-to-dismiss handle — a small pill/bar at the
 * top of the sheet, draggable down past ~25% of the sheet's own height to dismiss it (the actual
 * gesture logic lives in `DrawerPanel`'s `dragToDismiss` — plain pointer tracking, the same
 * technique `SwipeActions`/`PullToRefresh`/`PickerWheel` already use, no real spring physics).
 * Dismissal always still works the same three non-drag ways `Drawer` already provides — the
 * visible close button, Esc, and a backdrop click — the drag is an added path, never the only one.
 *
 * A thin wrapper around `DrawerPanel` (the same plumbing `Drawer` itself uses), not a
 * reimplementation — it only fixes `side`, turns on `dragToDismiss`, and supplies the handle.
 */
export function BottomSheet(props: BottomSheetProps) {
  return (
    <DrawerPanel
      {...props}
      side="bottom"
      dataComponent="bottom-sheet"
      dragToDismiss
      handle={<div className="rebar-bottom-sheet-handle" data-rebar-part="handle" aria-hidden="true" />}
    />
  );
}
