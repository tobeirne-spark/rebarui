import { useEffect, useState } from "react";
import { Button } from "./Button";
import { Popover } from "./Popover";
import { SegmentedControl } from "./SegmentedControl";
import { Stack } from "./Stack";
import { Switch } from "./Switch";
import { Text } from "./Text";

export type ThemeToggleSection = "style" | "mode" | "bionic";

const ALL_SECTIONS: ThemeToggleSection[] = ["style", "mode", "bionic"];

export interface ThemeToggleProps {
  /** Label on the trigger button. Ignored when `sections` names exactly one control — there's no
   * trigger button in that case, just the control itself. */
  label?: string;
  /** Trigger button size — match whatever else sits beside it in a toolbar/header (a plain
   * `Button` with no `size` set defaults to `"md"`; this defaults to `"sm"` for a more compact
   * header control, so set this explicitly to `"md"` when it's placed next to default-sized
   * buttons rather than leaving the two visibly mismatched). Ignored when `sections` names
   * exactly one control, for the same reason as `label` above. */
  size?: "sm" | "md" | "lg";
  /** Which controls to expose: `"style"` (sketch/simple), `"mode"` (light/dark), `"bionic"`
   * (bionic reading). Defaults to all three, together behind one popover trigger — the original
   * shape. Naming exactly **one** collapses this to that single control rendered directly, with
   * no popover or trigger button at all: `["mode"]` alone renders as a classic, icon-in-thumb
   * light/dark switch with a state-matching label (`"Light Mode"`/`"Dark Mode"`); `["style"]` or
   * `["bionic"]` alone render as one inline `SegmentedControl`/labeled `Switch`. Naming **two**
   * keeps the popover (there's still more than one control to hide behind a trigger) but only
   * shows the named ones inside it. */
  sections?: ThemeToggleSection[];
  className?: string;
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" fill="currentColor" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8 6 18M18 6l1.8-1.8" />
      </g>
    </svg>
  );
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
export function ThemeToggle({ label = "Theme", size = "sm", sections = ALL_SECTIONS, className }: ThemeToggleProps) {
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

  const showStyle = sections.includes("style");
  const showMode = sections.includes("mode");
  const showBionic = sections.includes("bionic");

  const styleControl = (
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
  );

  const modeControl = (
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
  );

  const bionicControl = (
    <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
      {/* Text's polymorphic `as` prop doesn't widen its prop types to the target element, so
          it can't accept `htmlFor` when rendered `as="label"` — a real native `<label>`,
          styled to match `Text`'s own secondary/xs classes, instead. */}
      <label htmlFor="rebar-theme-toggle-bionic" className="rebar-text" data-rebar-color="secondary" data-rebar-size="xs">
        Bionic reading
      </label>
      <Switch id="rebar-theme-toggle-bionic" checked={bionic} onCheckedChange={setBionic} />
    </Stack>
  );

  // A single named section renders directly — no popover to hide one lone control behind.
  if (sections.length === 1) {
    if (showMode) {
      return (
        <span className={className} style={{ flexShrink: 0 }} data-rebar-component="theme-toggle" data-rebar-variant="mode-only">
          <Stack direction="row" gap="sm" align="center">
            <Switch
              aria-label="Dark mode"
              checked={mode === "dark"}
              onCheckedChange={(checked) => setMode(checked ? "dark" : "light")}
              thumbIcon={mode === "dark" ? <SunIcon /> : <MoonIcon />}
            />
            <Text size="sm">{mode === "dark" ? "Dark Mode" : "Light Mode"}</Text>
          </Stack>
        </span>
      );
    }
    return (
      <span className={className} style={{ flexShrink: 0 }} data-rebar-component="theme-toggle" data-rebar-variant={showStyle ? "style-only" : "bionic-only"}>
        {showStyle ? styleControl : bionicControl}
      </span>
    );
  }

  return (
    <span className={className} style={{ flexShrink: 0 }} data-rebar-component="theme-toggle">
      <Popover trigger={<Button variant="secondary" size={size}>{label}</Button>}>
        <Stack gap="md" style={{ minWidth: 160 }}>
          {showStyle ? styleControl : null}
          {showMode ? modeControl : null}
          {showBionic ? bionicControl : null}
        </Stack>
      </Popover>
    </span>
  );
}
