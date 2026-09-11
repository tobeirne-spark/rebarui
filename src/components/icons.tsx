import type { SVGProps } from "react";

/**
 * A small, curated set of icons sourced from RemixIcon (https://remixicon.com, Apache License
 * 2.0 — free for commercial use, attribution appreciated but not required) — inlined here as
 * plain React components rather than a `remixicon` npm dependency, matching this project's
 * existing embed-only-what's-needed convention (`assets/avatarPlaceholders.ts`,
 * `assets/ratioPlaceholders.ts`). Add more icons here only once a real component needs them —
 * don't bulk-import the whole set ahead of demand.
 *
 * Replaces the plain Unicode glyphs (▾ ▸ › ‹) several components used for disclosure/nav
 * chevrons, which read as unclear "tiny drop arrows" at small sizes — see `ref/TOM.md` 1.4.
 *
 * Checked directly against Ant Design's own published icon spec (ant.design/docs/spec/icon,
 * Part 4's "icon spec page alignment" ask) rather than assumed compliant: its two rules with real
 * teeth for a component library — icons scale proportionally with adjacent text, and match the
 * surrounding text color unless deliberately indicating state — were already both true here by
 * construction (`createIcon`'s own `size = "1em"` default and hardcoded `fill="currentColor"`),
 * confirmed by grepping every consuming component for a color/size override that would violate
 * either rule (found none). Its icon-grid/stroke-weight rules are written for AntD's own outlined-
 * icon-family construction process, not applicable to icons sourced as already-finished RemixIcon
 * paths (filled shapes, not something this project draws stroke-width for itself).
 */

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

function createIcon(path: string, displayName: string) {
  function Icon({ size = "1em", ...props }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path d={path} />
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

export const ChevronDownIcon = createIcon(
  "M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z",
  "ChevronDownIcon",
);

export const ChevronRightIcon = createIcon(
  "M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z",
  "ChevronRightIcon",
);

export const ChevronLeftIcon = createIcon(
  "M10.8284 12.0007L15.7782 16.9504L14.364 18.3646L8 12.0007L14.364 5.63672L15.7782 7.05093L10.8284 12.0007Z",
  "ChevronLeftIcon",
);

export const MicIcon = createIcon(
  "M11.9998 3C10.3429 3 8.99976 4.34315 8.99976 6V10C8.99976 11.6569 10.3429 13 11.9998 13C13.6566 13 14.9998 11.6569 14.9998 10V6C14.9998 4.34315 13.6566 3 11.9998 3ZM11.9998 1C14.7612 1 16.9998 3.23858 16.9998 6V10C16.9998 12.7614 14.7612 15 11.9998 15C9.23833 15 6.99976 12.7614 6.99976 10V6C6.99976 3.23858 9.23833 1 11.9998 1ZM3.05469 11H5.07065C5.55588 14.3923 8.47329 17 11.9998 17C15.5262 17 18.4436 14.3923 18.9289 11H20.9448C20.4837 15.1716 17.1714 18.4839 12.9998 18.9451V23H10.9998V18.9451C6.82814 18.4839 3.51584 15.1716 3.05469 11Z",
  "MicIcon",
);

export const StopCircleIcon = createIcon(
  "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM9 9H15V15H9V9Z",
  "StopCircleIcon",
);

export const SendPlaneIcon = createIcon(
  "M21.7267 2.95694L16.2734 22.0432C16.1225 22.5716 15.7979 22.5956 15.5563 22.1126L11 13L1.9229 9.36919C1.41322 9.16532 1.41953 8.86022 1.95695 8.68108L21.0432 2.31901C21.5716 2.14285 21.8747 2.43866 21.7267 2.95694ZM19.0353 5.09647L6.81221 9.17085L12.4488 11.4255L15.4895 17.5068L19.0353 5.09647Z",
  "SendPlaneIcon",
);

export const CopyIcon = createIcon(
  "M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6Z",
  "CopyIcon",
);

export const DeleteIcon = createIcon(
  "M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z",
  "DeleteIcon",
);

export const MoveIcon = createIcon(
  "M12.4142 5H21C21.5523 5 22 5.44772 22 6V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H10.4142L12.4142 5ZM4 5V19H20V7H11.5858L9.58579 5H4ZM12 12V9L16 13L12 17V14H8V12H12Z",
  "MoveIcon",
);

export const DownloadIcon = createIcon(
  "M13 10H18L12 16L6 10H11V3H13V10ZM4 19H20V12H22V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V12H4V19Z",
  "DownloadIcon",
);

export const MoreIcon = createIcon(
  "M5 10C3.9 10 3 10.9 3 12C3 13.1 3.9 14 5 14C6.1 14 7 13.1 7 12C7 10.9 6.1 10 5 10ZM19 10C17.9 10 17 10.9 17 12C17 13.1 17.9 14 19 14C20.1 14 21 13.1 21 12C21 10.9 20.1 10 19 10ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z",
  "MoreIcon",
);

export const LockIcon = createIcon(
  "M19 10H20C20.5523 10 21 10.4477 21 11V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V11C3 10.4477 3.44772 10 4 10H5V9C5 5.13401 8.13401 2 12 2C15.866 2 19 5.13401 19 9V10ZM17 10V9C17 6.23858 14.7614 4 12 4C9.23858 4 7 6.23858 7 9V10H17ZM11 14V18H13V14H11Z",
  "LockIcon",
);

export const UnlockIcon = createIcon(
  "M7 10H20C20.5523 10 21 10.4477 21 11V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V11C3 10.4477 3.44772 10 4 10H5V9C5 5.13401 8.13401 2 12 2C14.7405 2 17.1131 3.5748 18.2624 5.86882L16.4731 6.76344C15.6522 5.12486 13.9575 4 12 4C9.23858 4 7 6.23858 7 9V10ZM10 15V17H14V15H10Z",
  "UnlockIcon",
);

export const SearchIcon = createIcon(
  "M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z",
  "SearchIcon",
);

export const ErrorWarningIcon = createIcon(
  "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11 15V17H13V15H11ZM11 7V13H13V7H11Z",
  "ErrorWarningIcon",
);

export const WifiOffIcon = createIcon(
  "M12.0001 18C12.7144 18 13.3704 18.2497 13.8856 18.6665L12.0001 21L10.1145 18.6665C10.6297 18.2497 11.2857 18 12.0001 18ZM2.80766 1.39343L20.4853 19.0711L19.0711 20.4853L13.8913 15.3042C13.2967 15.1069 12.6609 15 12.0001 15C10.5719 15 9.26024 15.499 8.22998 16.3322L6.97363 14.7759C8.24961 13.7442 9.84925 13.0969 11.5964 13.01L9.00025 10.414C7.55273 10.8234 6.22651 11.5217 5.0878 12.4426L3.83099 10.8868C4.89946 10.0226 6.10763 9.32438 7.41633 8.83118L5.13168 6.5451C3.98878 7.08913 2.92058 7.76472 1.94666 8.55228L0.689453 6.99674C1.60358 6.25747 2.59156 5.60589 3.64058 5.05479L1.39345 2.80765L2.80766 1.39343ZM14.5004 10.2854L12.2165 8.00243L12 8C15.0947 8 17.9369 9.08141 20.1693 10.8869L18.9123 12.4426C17.6438 11.4167 16.1427 10.6672 14.5004 10.2854ZM12.0001 3.00003C16.2849 3.00003 20.22 4.49719 23.3109 6.99691L22.0534 8.55228C19.3061 6.33062 15.8085 5.00003 12.0001 5.00003C11.122 5.00003 10.2604 5.07077 9.42075 5.20685L7.72455 3.51088C9.09498 3.17702 10.5268 3.00003 12.0001 3.00003Z",
  "WifiOffIcon",
);

export const TimeIcon = createIcon(
  "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM13 12H17V14H11V7H13V12Z",
  "TimeIcon",
);

export const CloseIcon = createIcon(
  "M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z",
  "CloseIcon",
);
