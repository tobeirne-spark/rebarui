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
  });

  it("shows a fixed, generic fallback message rather than echoing alt text", () => {
    // Regression test for a real bug: the default fallback used to render `alt` as its visible
    // text, so a caller's own content description (e.g. describing what the image depicts) leaked
    // through as if it were an error message. The fallback message is now fixed and unrelated to
    // whatever `alt` says.
    render(<Image src="https://example.com/broken.jpg" alt="This image intentionally fails to load" />);
    fireEvent.error(screen.getByAltText("This image intentionally fails to load"));
    expect(screen.getByText("Image failed to load")).toBeInTheDocument();
    expect(screen.queryByText("This image intentionally fails to load")).toBeNull();
  });

  it("renders the empty state when src is omitted", () => {
    render(<Image alt="Profile photo" />);
    expect(document.querySelector('[data-rebar-image-status="empty"]')).toBeInTheDocument();
    expect(document.querySelector('[data-rebar-part="empty"]')).toBeInTheDocument();
    expect(screen.getByText("No image")).toBeInTheDocument();
    expect(screen.getByLabelText("Profile photo")).toBeInTheDocument();
  });

  it("renders the empty state when src is an empty string", () => {
    render(<Image src="" alt="Profile photo" />);
    expect(document.querySelector('[data-rebar-part="empty"]')).toBeInTheDocument();
  });

  it("does not render a real <img> element at all in the empty state", () => {
    render(<Image alt="Profile photo" />);
    expect(document.querySelector("img")).toBeNull();
  });

  it("renders a caller-supplied emptyIndicator instead of the default", () => {
    render(<Image alt="Profile photo" emptyIndicator={<span>Upload a photo</span>} />);
    expect(screen.getByText("Upload a photo")).toBeInTheDocument();
    expect(screen.queryByText("No image")).toBeNull();
  });

  it("switches from empty to loading once a real src is supplied", () => {
    const { rerender } = render(<Image alt="Profile photo" />);
    expect(document.querySelector('[data-rebar-part="empty"]')).toBeInTheDocument();

    rerender(<Image src="https://example.com/photo.jpg" alt="Profile photo" />);
    expect(document.querySelector('[data-rebar-part="empty"]')).toBeNull();
    expect(document.querySelector('[data-rebar-part="loading"]')).toBeInTheDocument();
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
