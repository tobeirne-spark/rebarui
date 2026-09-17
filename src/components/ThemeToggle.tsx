import { useEffect, useState } from "react";
import { Button } from "./Button";
import { Popover } from "./Popover";
import { SegmentedControl } from "./SegmentedControl";
import { Stack } from "./Stack";
import { Switch } from "./Switch";
import { Text } from "./Text";

export interface ThemeToggleProps {
  /** Label on the trigger button. */
  label?: string;
  /** Trigger button size — match whatever else sits beside it in a toolbar/header (a plain
   * `Button` with no `size` set defaults to `"md"`; this defaults to `"sm"` for a more compact
   * header control, so set this explicitly to `"md"` when it's placed next to default-sized
   * buttons rather than leaving the two visibly mismatched). */
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * A visitor-facing popover onto the exact same DOM attributes `RebarDevTools`' dev-only panel
 * already writes (`data-rebar-theme="sketch"|"clean"`, `data-theme="dark"`/absent for light, and
 * `data-rebar-bionic="true"`/absent for bionic reading), not a second, competing mechanism. Each
 * toggle lazily reads the *current* attribute on mount (so it reflects whatever the host page
 * already configured, the same "don't clobber" precedent `RebarDevTools` itself follows) rather
 * than assuming a default. A real, shipped component — not private page/block chrome — so it can
 * be reused anywhere a site wants to give visitors this same control (`site-header`'s
 * `themeToggle` flag renders this directly).
 *
 * **Using this component means both theme packages must be installed and imported** —
 * `@rebar-ui/theme-clean` AND `@rebar-ui/theme-sketch`'s CSS, not just whichever one is the
 * build's own default. This toggle only flips the `data-rebar-theme` attribute; it does not load
 * either stylesheet for you. Offering the switch without both themes present means the "sketch"
 * (or "clean") state silently has nothing to switch to — indistinguishable from a broken control,
 * since nothing on screen indicates the missing half. See `ref/HEURISTICS.md` #50.
 */
export function ThemeToggle({ label = "Theme", size = "sm", className }: ThemeToggleProps) {
  const [style, setStyle] = useState<"sketch" | "clean">(() =>
    typeof document !== "undefined" && document.documentElement.getAttribute("data-rebar-theme") === "clean"
      ? "clean"
      : "sketch",
  );
  const [mode, setMode] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light",
  );
  const [bionic, setBionic] = useState<boolean>(
    () => typeof document !== "undefined" && document.documentElement.getAttribute("data-rebar-bionic") === "true",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-rebar-theme", style);
  }, [style]);

  useEffect(() => {
    if (mode === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
  }, [mode]);

  useEffect(() => {
    if (bionic) document.documentElement.setAttribute("data-rebar-bionic", "true");
    else document.documentElement.removeAttribute("data-rebar-bionic");
  }, [bionic]);

  return (
    <span className={className} style={{ flexShrink: 0 }} data-rebar-component="theme-toggle">
      <Popover trigger={<Button variant="secondary" size={size}>{label}</Button>}>
        <Stack gap="md" style={{ minWidth: 160 }}>
          <Stack gap="xs">
            <Text size="xs" color="secondary">
              Style
            </Text>
            <SegmentedControl
              aria-label="Style"
              options={[
                { value: "sketch", label: "Sketch" },
                { value: "clean", label: "Simple" },
              ]}
              value={style}
              onValueChange={(v) => setStyle(v as "sketch" | "clean")}
            />
          </Stack>
          <Stack gap="xs">
            <Text size="xs" color="secondary">
              Mode
            </Text>
            <SegmentedControl
              aria-label="Mode"
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
              value={mode}
              onValueChange={(v) => setMode(v as "light" | "dark")}
            />
          </Stack>
          <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
            {/* Text's polymorphic `as` prop doesn't widen its prop types to the target element, so
                it can't accept `htmlFor` when rendered `as="label"` — a real native `<label>`,
                styled to match `Text`'s own secondary/xs classes, instead. */}
            <label htmlFor="rebar-theme-toggle-bionic" className="rebar-text" data-rebar-color="secondary" data-rebar-size="xs">
              Bionic reading
            </label>
            <Switch id="rebar-theme-toggle-bionic" checked={bionic} onCheckedChange={setBionic} />
          </Stack>
        </Stack>
      </Popover>
    </span>
  );
}
