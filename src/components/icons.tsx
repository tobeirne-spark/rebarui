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
