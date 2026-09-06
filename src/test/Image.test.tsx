import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Image } from "../components/Image";

describe("Image", () => {
  it("carries data-rebar-component on the root", () => {
    render(<Image src="https://example.com/photo.jpg" alt="A photo" />);
    expect(document.querySelector('[data-rebar-component="image"]')).not.toBeNull();
  });

  it("shows the loading indicator initially", () => {
    render(<Image src="https://example.com/photo.jpg" alt="A photo" />);
    expect(document.querySelector('[data-rebar-part="loading"]')).not.toBeNull();
    expect(document.querySelector('[data-rebar-component="spin"]')).not.toBeNull();
  });

  it("swaps to the loaded image after a real load event", () => {
    render(<Image src="https://example.com/photo.jpg" alt="A photo" />);
    const img = screen.getByAltText("A photo") as HTMLImageElement;

    fireEvent.load(img);

    expect(document.querySelector('[data-rebar-part="loading"]')).toBeNull();
    expect(document.querySelector('[data-rebar-image-status="loaded"]')).not.toBeNull();
    expect(screen.getByAltText("A photo")).toHaveAttribute("src", "https://example.com/photo.jpg");
  });

  it("swaps to the fallback after a real error event", () => {
    render(<Image src="https://example.com/broken.jpg" alt="A photo" />);
    const img = screen.getByAltText("A photo") as HTMLImageElement;

    fireEvent.error(img);

    expect(document.querySelector('[data-rebar-part="fallback"]')).not.toBeNull();
    expect(document.querySelector('[data-rebar-image-status="error"]')).not.toBeNull();
  });

  it("renders a caller-supplied fallback on error instead of the default", () => {
    render(
      <Image src="https://example.com/broken.jpg" alt="A photo" fallback={<span>Custom fallback</span>} />,
    );
    fireEvent.error(screen.getByAltText("A photo"));
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
  });

  it("renders a caller-supplied loading indicator instead of the default Spin", () => {
    render(
      <Image
        src="https://example.com/photo.jpg"
        alt="A photo"
        loadingIndicator={<span>Custom loading</span>}
      />,
    );
    expect(screen.getByText("Custom loading")).toBeInTheDocument();
    expect(document.querySelector('[data-rebar-component="spin"]')).toBeNull();
  });

  it("keeps alt text present in the loading state", () => {
    render(<Image src="https://example.com/photo.jpg" alt="A photo" />);
    expect(screen.getByAltText("A photo")).toBeInTheDocument();
  });

  it("keeps alt text present in the error state", () => {
    render(<Image src="https://example.com/broken.jpg" alt="A photo" />);
    fireEvent.error(screen.getByAltText("A photo"));
    // The <img> itself stays in the DOM (never unmounted) so its alt text stays accessible...
    expect(screen.getByAltText("A photo")).toBeInTheDocument();
    // ...and the default fallback also surfaces the alt text visibly.
    expect(screen.getByText("A photo")).toBeInTheDocument();
  });

  it("keeps alt text present in the loaded state", () => {
    render(<Image src="https://example.com/photo.jpg" alt="A photo" />);
    fireEvent.load(screen.getByAltText("A photo"));
    expect(screen.getByAltText("A photo")).toBeInTheDocument();
  });

  it("defaults to loading=lazy", () => {
    render(<Image src="https://example.com/photo.jpg" alt="A photo" />);
    expect(screen.getByAltText("A photo")).toHaveAttribute("loading", "lazy");
  });

  it("lets the caller override the loading attribute via rest-spread", () => {
    render(<Image src="https://example.com/photo.jpg" alt="A photo" loading="eager" />);
    expect(screen.getByAltText("A photo")).toHaveAttribute("loading", "eager");
  });

  it("fires onLoad/onError callbacks", () => {
    const onLoad = vi.fn();
    const onError = vi.fn();
    render(<Image src="https://example.com/photo.jpg" alt="A photo" onLoad={onLoad} onError={onError} />);
    fireEvent.load(screen.getByAltText("A photo"));
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("forwards arbitrary data-*/aria-* props onto the img", () => {
    render(<Image src="https://example.com/photo.jpg" alt="A photo" data-testid="hero-image" />);
    expect(screen.getByTestId("hero-image")).toBeInTheDocument();
  });

  it("does not reset an already-resolved status on a re-render with the same src", () => {
    // Regression test for a real bug: a `useEffect` keyed on `src` unconditionally reset status
    // to "loading" — including on mount — which raced a broken src's `error` event firing before
    // that effect ran, clobbering the correct "error" status right back to "loading" with no
    // further error event ever firing to correct it. jsdom's synchronous fireEvent can't reproduce
    // the exact mount-timing race a real browser's network failure exposed (a live Playwright
    // check against a genuinely invalid domain is what actually caught it), but this test verifies
    // the real guarantee the fix provides: status only resets on a genuine `src` change, never on
    // an unrelated re-render, which is what a lingering effect-based reset would have broken.
    const { rerender } = render(<Image src="https://example.com/broken.jpg" alt="A photo" />);
    fireEvent.error(screen.getByAltText("A photo"));
    expect(document.querySelector('[data-rebar-image-status="error"]')).not.toBeNull();

    rerender(<Image src="https://example.com/broken.jpg" alt="A photo" style={{ opacity: 1 }} />);
    expect(document.querySelector('[data-rebar-image-status="error"]')).not.toBeNull();
    expect(document.querySelector('[data-rebar-image-status="loading"]')).toBeNull();
  });

  it("does reset to loading when src genuinely changes after an error", () => {
    const { rerender } = render(<Image src="https://example.com/broken.jpg" alt="A photo" />);
    fireEvent.error(screen.getByAltText("A photo"));
    expect(document.querySelector('[data-rebar-image-status="error"]')).not.toBeNull();

    rerender(<Image src="https://example.com/photo-2.jpg" alt="A photo" />);
    expect(document.querySelector('[data-rebar-image-status="loading"]')).not.toBeNull();
  });
});
