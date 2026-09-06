import { DrawerPanel } from "./Drawer";
import type { DrawerProps } from "./Drawer";

export interface BottomSheetProps extends Omit<DrawerProps, "side"> {}

/**
 * `Drawer` fixed to `side="bottom"`, plus a visible drag handle — a small pill/bar at the top of
 * the sheet. The handle is a purely decorative affordance (`aria-hidden`, not a real element):
 * real touch-drag-to-dismiss physics is a separate, harder gesture-physics problem, out of scope
 * here. Dismissal always works the same three ways `Drawer` already provides — the visible close
 * button, Esc, and a backdrop click — never drag-only.
 *
 * A thin wrapper around `DrawerPanel` (the same plumbing `Drawer` itself uses), not a
 * reimplementation — it only fixes `side` and injects the handle.
 */
export function BottomSheet(props: BottomSheetProps) {
  return (
    <DrawerPanel
      {...props}
      side="bottom"
      dataComponent="bottom-sheet"
      handle={<div className="rebar-bottom-sheet-handle" data-rebar-part="handle" aria-hidden="true" />}
    />
  );
}
