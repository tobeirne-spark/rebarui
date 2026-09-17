import Link from "next/link";
import { Stack, Text } from "rebar-ui";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/about/agent", label: "Design Heuristics" },
  { href: "/about/benchmarks", label: "Benchmarks" },
  { href: "https://github.com/ob27/rebarui/blob/main/CONTRIBUTING.md", label: "Contributing" },
];

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: "var(--rebar-border-width, 1px) solid var(--rebar-color-border, #e0e0e0)",
        marginTop: "var(--rebar-space-2xl)",
      }}
    >
      <Stack
        direction="row"
        gap="lg"
        style={{
          justifyContent: "space-between",
          padding: "var(--rebar-space-lg) var(--rebar-space-xl)",
          flexWrap: "wrap",
        }}
      >
        <Text size="xs" color="secondary">
          MIT licensed.{" "}
          <Link href="https://github.com/ob27/rebarui" className="rebar-link">
            Source on GitHub
          </Link>
          .
        </Text>
        <Stack direction="row" gap="md">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
              <Text as="span" size="xs" color="secondary">
                {link.label}
              </Text>
            </Link>
          ))}
        </Stack>
      </Stack>
    </footer>
  );
}
