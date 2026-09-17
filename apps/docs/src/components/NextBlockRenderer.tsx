"use client";

import Link from "next/link";
import { BlockRenderer, type Construct } from "@rebar-ui/placement";

/**
 * `BlockRenderer`'s `renderLink` is a function prop, and functions can't cross the Server-to-
 * Client Component boundary in Next.js's App Router — passing one from a Server Component page
 * straight into `BlockRenderer` fails the build. This wrapper binds `next/link` on the client
 * side instead, so pages only ever pass `blocks` (plain, serializable data) across that boundary.
 *
 * Preserves the caller-supplied `className` (e.g. `rebar-navbar-link` from NavBar) so nav links
 * keep their own styling instead of being painted as body-text hyperlinks.
 */
export function NextBlockRenderer({ blocks }: { blocks: Construct[] }) {
  return (
    <BlockRenderer
      blocks={blocks}
      renderLink={({ href, children, className, onClick }) => (
        <Link href={href} className={className ?? "rebar-link"} onClick={onClick}>
          {children}
        </Link>
      )}
    />
  );
}
