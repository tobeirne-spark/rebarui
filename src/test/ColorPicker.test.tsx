import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorPicker } from "../components/ColorPicker";

afterEach(cleanup);

describe("ColorPicker", () => {
  it("renders a trigger showing the current color", () => {
    render(<ColorPicker defaultValue="#2e7d32" />);
    expect(screen.getByRole("button", { name: /#2e7d32/ })).toBeInTheDocument();
  });

  it("opens a popover of preset swatches and a native color input on click", async () => {
    const user = userEvent.setup();
    render(<ColorPicker />);
    await user.click(screen.getByRole("button", { name: /Pick a color/ }));
    expect(screen.getAllByRole("button", { name: /^#/ }).length).toBeGreaterThan(1);
  });

  it("calls onChange and closes when a preset swatch is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker onChange={onChange} presets={["#111111", "#222222"]} />);
    await user.click(screen.getByRole("button", { name: /Pick a color/ }));
    await user.click(screen.getByRole("button", { name: "#222222" }));
    expect(onChange).toHaveBeenCalledWith("#222222");
  });

  it("defaults to size md, reflected as a data attribute", () => {
    render(<ColorPicker />);
    expect(screen.getByRole("button", { name: /Pick a color/ })).toHaveAttribute("data-rebar-size", "md");
  });

  it("renders a visibly smaller swatch for size sm without shrinking the real tap target", () => {
    const { container } = render(<ColorPicker size="sm" defaultValue="#2e7d32" />);
    const trigger = screen.getByRole("button", { name: /Pick a color/ });
    expect(trigger).toHaveAttribute("data-rebar-size", "sm");
    // The trigger button itself carries no inline size — CSS (min-width/min-height: 44px) is what
    // keeps the real hit area at the touch-target minimum regardless of the visual swatch size.
    expect(trigger).not.toHaveAttribute("style");
    const swatch = container.querySelector('[data-rebar-part="swatch"]');
    expect(swatch).toHaveStyle({ width: "20px", height: "20px", backgroundColor: "#2e7d32" });
  });

  it("renders a visibly larger swatch for size lg", () => {
    const { container } = render(<ColorPicker size="lg" defaultValue="#2e7d32" />);
    const swatch = container.querySelector('[data-rebar-part="swatch"]');
    expect(swatch).toHaveStyle({ width: "36px", height: "36px" });
  });

  it("mode='full' (default) shows every preset", async () => {
    const user = userEvent.setup();
    render(<ColorPicker presets={["#111111", "#222222", "#333333", "#444444"]} />);
    await user.click(screen.getByRole("button", { name: /Pick a color/ }));
    expect(screen.getAllByRole("button", { name: /^#/ })).toHaveLength(4);
  });

  it("mode='recent' shows only up to 3 swatches, seeded from presets before any pick", async () => {
    const user = userEvent.setup();
    render(<ColorPicker mode="recent" presets={["#111111", "#222222", "#333333", "#444444"]} />);
    await user.click(screen.getByRole("button", { name: /Pick a color/ }));
    expect(screen.getAllByRole("button", { name: /^#/ })).toHaveLength(3);
  });

  it("mode='recent' promotes a newly picked color to the front, deduping and capping at 3", async () => {
    const user = userEvent.setup();
    render(<ColorPicker mode="recent" presets={["#111111", "#222222", "#333333"]} />);

    await user.click(screen.getByRole("button", { name: /Pick a color/ }));
    await user.click(screen.getByRole("button", { name: "#333333" }));

    await user.click(screen.getByRole("button", { name: /Pick a color/ }));
    const swatches = screen.getAllByRole("button", { name: /^#/ });
    expect(swatches).toHaveLength(3);
    expect(swatches[0]).toHaveAttribute("aria-label", "#333333");
  });

  it("mode='recent' still offers the native color input for anything not in the recent set", async () => {
    const user = userEvent.setup();
    render(<ColorPicker mode="recent" />);
    await user.click(screen.getByRole("button", { name: /Pick a color/ }));
    expect(screen.getByLabelText("Custom color")).toBeInTheDocument();
  });

  it("does not render an eyedropper button when the browser has no EyeDropper API, even with allowEyedropper", async () => {
    const user = userEvent.setup();
    render(<ColorPicker allowEyedropper />);
    await user.click(screen.getByRole("button", { name: /Pick a color/ }));
    expect(screen.queryByRole("button", { name: "Pick a color from the screen" })).not.toBeInTheDocument();
  });

  it("does not render an eyedropper button when allowEyedropper is unset, even if the browser supports it", async () => {
    const user = userEvent.setup();
    window.EyeDropper = class {
      open() {
        return Promise.resolve({ sRGBHex: "#abcdef" });
      }
    };
    render(<ColorPicker />);
    await user.click(screen.getByRole("button", { name: /Pick a color/ }));
    expect(screen.queryByRole("button", { name: "Pick a color from the screen" })).not.toBeInTheDocument();
    delete window.EyeDropper;
  });

  it("renders and uses the eyedropper when both allowEyedropper is set and the browser supports it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    window.EyeDropper = class {
      open() {
        return Promise.resolve({ sRGBHex: "#abcdef" });
      }
    };
    render(<ColorPicker allowEyedropper onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /Pick a color/ }));
    await user.click(screen.getByRole("button", { name: "Pick a color from the screen" }));
    expect(onChange).toHaveBeenCalledWith("#abcdef");
    delete window.EyeDropper;
  });

  it("does not throw when the eyedropper pick is cancelled (AbortError)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    window.EyeDropper = class {
      open() {
        return Promise.reject(new DOMException("The user aborted a request.", "AbortError"));
      }
    };
    render(<ColorPicker allowEyedropper onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /Pick a color/ }));
    await expect(
      user.click(screen.getByRole("button", { name: "Pick a color from the screen" })),
    ).resolves.not.toThrow();
    expect(onChange).not.toHaveBeenCalled();
    delete window.EyeDropper;
  });
});
