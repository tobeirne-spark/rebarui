"use client";

import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";
import { REBAR_MARK_PATH, REBAR_MARK_VIEWBOX } from "@/data/rebarMark";

const BLOCKS: Construct[] = [
  {
    type: "site-header",
    logo: { label: "Rebar UI", href: "/", iconPath: REBAR_MARK_PATH, iconViewBox: REBAR_MARK_VIEWBOX },
    items: [
      { href: "/about/agent", label: "For Agents" },
      {
        href: "/imitations",
        label: "For Humans",
        megaMenu: {
          columns: [
            {
              heading: "Framework",
              items: [
                { label: "Orders", description: "Pick your Plenum", href: "/orders" },
                { label: "Archetypes", description: "Construct studies", href: "/archetypes" },
                { label: "Imitations", description: "Primitive Constructs", href: "/imitations" },
              ],
            },
            {
              heading: "",
              items: [
                { label: "Synthetics", description: "Complex Constructs", href: "/synthetics" },
                { label: "Opinions", description: "Dynamic Constructs", href: "/opinions" },
                { label: "Geneses", description: "Rebar alive", href: "/geneses" },
              ],
            },
            {
              heading: "Philosophy",
              items: [
                { label: "Heuristics", href: "/heuristics" },
                { label: "Roadmap", href: "/planned/_none" },
                { label: "Rules", href: "/about/agent" },
                { label: "Benchmarks", href: "/about/benchmarks" },
                { label: "About", href: "/about" },
              ],
            },
          ],
          footer: { label: "Go to the GitHub Repo", href: "https://github.com/ob27/rebarui" },
        },
      },
    ],
    ariaLabel: "Main",
    trailing: { kind: "text", text: "0.10.0" },
    themeToggle: true,
  },
];

export function SiteHeader() {
  return <NextBlockRenderer blocks={BLOCKS} />;
}
