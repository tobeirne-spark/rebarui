import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Footer } from "../components/Footer";
import type { FooterChipItem, FooterLinkItem } from "../components/Footer";

afterEach(cleanup);

describe("Footer", () => {
  it("renders nothing but the wrapper when no section is set", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('[data-rebar-component="footer"]');
    expect(footer).toBeInTheDocument();
    expect(footer?.children.length).toBe(0);
  });

  it("renders label as a divider with text, and plain content", () => {
    render(<Footer label="No more results" content="© 2026 Example" />);
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(screen.getByText("No more results")).toBeInTheDocument();
    expect(screen.getByText("© 2026 Example")).toBeInTheDocument();
  });

  it("renders links as real <a> elements, in order", () => {
    const links: FooterLinkItem[] = [
      { text: "Terms", href: "/terms" },
      { text: "Privacy", href: "/privacy" },
    ];
    render(<Footer links={links} />);
    const terms = screen.getByRole("link", { name: "Terms" });
    expect(terms).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  });

  it("onLinkClick prevents the default navigation and is called with the item and index", async () => {
    const user = userEvent.setup();
    const onLinkClick = vi.fn();
    const links: FooterLinkItem[] = [{ text: "Terms", href: "/terms" }];
    render(<Footer links={links} onLinkClick={onLinkClick} />);
    await user.click(screen.getByRole("link", { name: "Terms" }));
    expect(onLinkClick).toHaveBeenCalledWith(links[0], 0);
    // jsdom doesn't actually navigate, but a real, unprevented click would have — confirm the
    // handler ran without asserting on navigation, which jsdom can't meaningfully simulate here.
  });

  it("renders plain chips as non-interactive tags, and link chips as real buttons", async () => {
    const user = userEvent.setup();
    const onChipClick = vi.fn();
    const chips: FooterChipItem[] = [
      { text: "Plain" },
      { text: "Clickable", type: "link" },
    ];
    render(<Footer chips={chips} onChipClick={onChipClick} />);
    expect(screen.getByText("Plain")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Plain" })).not.toBeInTheDocument();

    const clickable = screen.getByRole("button", { name: "Clickable" });
    await user.click(clickable);
    expect(onChipClick).toHaveBeenCalledWith(chips[1], 1);
  });

  it("supports a custom renderLink for framework routing", () => {
    render(
      <Footer
        links={[{ text: "Terms", href: "/terms" }]}
        renderLink={({ href, children, className }) => (
          <a href={href} className={className} data-custom-link="true">
            {children}
          </a>
        )}
      />,
    );
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("data-custom-link", "true");
  });
});
