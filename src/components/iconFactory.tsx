import type { SVGProps } from "react";

/**
 * The shared icon-component factory, split out from `icons.tsx` specifically so it has zero
 * dependency on `icons-remix.tsx`/`icons-antd.tsx` — those two generated files both import
 * `createIcon` from here, and `icons.tsx` imports *them* (as namespace imports, to build
 * `ICON_REGISTRY`), which would otherwise be a real circular import (`icons.tsx` → `icons-remix.tsx`
 * → `icons.tsx`) if `createIcon` lived in `icons.tsx` itself. A circular ESM import doesn't error at
 * build time — `tsup`/`tsc` both accept it — it fails at runtime instead, since the bulk files'
 * top-level `createIcon(...)` calls execute while `icons.tsx` is still mid-evaluation (it hasn't
 * reached its own `function createIcon` definition yet, because its *first* statement is importing
 * the bulk files). Caught live via `vitest run`: every icon-consuming test failed with
 * "createIcon is not a function" despite `tsc --noEmit` and the `tsup` build both succeeding clean.
 */
export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

export interface IconPathSpec {
  d: string;
  fillRule?: "nonzero" | "evenodd";
  fillOpacity?: number;
}

type IconPathsInput = string | IconPathSpec | (string | IconPathSpec)[];

function normalizePaths(input: IconPathsInput): IconPathSpec[] {
  const arr = Array.isArray(input) ? input : [input];
  return arr.map((p) => (typeof p === "string" ? { d: p } : p));
}

export function createIcon(paths: IconPathsInput, displayName: string, viewBox = "0 0 24 24") {
  const specs = normalizePaths(paths);
  function Icon({ size = "1em", ...props }: IconProps) {
    return (
      <svg
        viewBox={viewBox}
        width={size}
        height={size}
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
        data-rebar-icon={displayName}
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        {specs.map((spec, i) => (
          <path key={i} d={spec.d} fillRule={spec.fillRule} fillOpacity={spec.fillOpacity} />
        ))}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}
