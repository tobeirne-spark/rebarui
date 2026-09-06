import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Watermark } from "../components/Watermark";

describe("Watermark", () => {
  it("renders its children plus an aria-hidden overlay", () => {
    const { container } = render(
      <Watermark text="DRAFT">
        <p>Real content</p>
      </Watermark>,
    );
    expect(screen.getByText("Real content")).toBeInTheDocument();
    const overlay = container.querySelector('[data-rebar-part="overlay"]');
    expect(overlay).toHaveAttribute("aria-hidden", "true");
  });

  it("the overlay never blocks interaction with the real content", () => {
    const { container } = render(<Watermark text="DRAFT">content</Watermark>);
    const overlay = container.querySelector('[data-rebar-part="overlay"]') as HTMLElement;
    expect(overlay.style.pointerEvents).toBe("none");
  });

  it("builds a repeating background-image tile from the text", () => {
    const { container } = render(<Watermark text="DRAFT">content</Watermark>);
    const overlay = container.querySelector('[data-rebar-part="overlay"]') as HTMLElement;
    expect(overlay.style.backgroundImage).toMatch(/^url\("data:image\/svg\+xml;base64,/);
    expect(overlay.style.backgroundRepeat).toBe("repeat");
  });

  it("builds a different tile for an image watermark than a text one", () => {
    const text = render(<Watermark text="DRAFT">content</Watermark>);
    const textTile = (text.container.querySelector('[data-rebar-part="overlay"]') as HTMLElement).style
      .backgroundImage;
    text.unmount();

    const image = render(
      <Watermark image="/logo.svg" imageSize={[40, 40]}>
        content
      </Watermark>,
    );
    const imageTile = (image.container.querySelector('[data-rebar-part="overlay"]') as HTMLElement).style
      .backgroundImage;
    expect(imageTile).not.toBe(textTile);
  });

  it("marks the root with a data-rebar-component attribute", () => {
    const { container } = render(<Watermark text="DRAFT">content</Watermark>);
    expect(container.querySelector('[data-rebar-component="watermark"]')).toBeInTheDocument();
  });
});
