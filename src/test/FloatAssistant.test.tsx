import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FloatAssistant } from "../components/FloatAssistant";

afterEach(cleanup);

// The greeting only renders as a message once the panel is open (closed by default) -- the
// trigger has no plain onClick (double-click, Enter, or a real pointer tap-vs-drag distinguish
// it from a drag start), so opening it in tests goes through the same Enter keydown path a
// keyboard user would use, the simplest one to simulate without faking pointer coordinates.
function openPanel(container: HTMLElement) {
  const trigger = container.querySelector('[data-rebar-part="trigger"]')!;
  fireEvent.keyDown(trigger, { key: "Enter" });
}

// FloatAssistant's greeting is rendered as its own assistant message once open, the simplest way
// to exercise its message-content rendering path without simulating a full send/reply round trip.
describe("FloatAssistant markdown rendering (on by default, same convention as ChatThread)", () => {
  it("renders bold/italic/inline-code and lists as real elements, not literal markdown syntax", () => {
    const { container } = render(
      <FloatAssistant greeting={"A **bold** and *italic* word, plus `inline code`.\n\n- one\n- two"} />,
    );
    openPanel(container);
    expect(container.querySelector("strong")).toHaveTextContent("bold");
    expect(container.querySelector("em")).toHaveTextContent("italic");
    expect(container.querySelector("code")).toHaveTextContent("inline code");
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByText("two")).toBeInTheDocument();
    expect(screen.queryByText(/\*\*bold\*\*/)).not.toBeInTheDocument();
  });

  it("markdown={false} falls back to plain text -- literal markup characters render as-is", () => {
    const { container } = render(<FloatAssistant greeting="**not bold**" markdown={false} />);
    openPanel(container);
    expect(screen.getByText("**not bold**")).toBeInTheDocument();
    expect(container.querySelector("strong")).not.toBeInTheDocument();
  });

  it("plain text with no special syntax still renders correctly under markdown mode", () => {
    const { container } = render(<FloatAssistant greeting="Hi there, how can I help?" />);
    openPanel(container);
    expect(screen.getByText("Hi there, how can I help?")).toBeInTheDocument();
  });
});

const SCREENSHOT_ACK = "Yep, I'm looking at the screen — what would you like me to analyze?";
const SCREENSHOT_ERROR = "Sorry, I couldn't capture the screen just now.";

describe("FloatAssistant screenshot capture resilience", () => {
  it("a failed capture still acknowledges when contextAware is on -- DOM-harvested page context doesn't depend on the screenshot succeeding", async () => {
    const { container } = render(
      <FloatAssistant contextAware onCaptureScreenshot={() => Promise.reject(new Error("nope"))} />,
    );
    openPanel(container);
    fireEvent.click(screen.getByRole("button", { name: "Capture a screenshot of the page" }));
    expect(await screen.findByText(SCREENSHOT_ACK)).toBeInTheDocument();
    expect(screen.queryByText(SCREENSHOT_ERROR)).not.toBeInTheDocument();
  });

  it("a failed capture with contextAware off shows the real failure, not a false acknowledgment", async () => {
    const { container } = render(<FloatAssistant onCaptureScreenshot={() => Promise.reject(new Error("nope"))} />);
    openPanel(container);
    fireEvent.click(screen.getByRole("button", { name: "Capture a screenshot of the page" }));
    expect(await screen.findByText(SCREENSHOT_ERROR)).toBeInTheDocument();
  });

  it("a successful custom onCaptureScreenshot always acknowledges", async () => {
    const { container } = render(<FloatAssistant onCaptureScreenshot={() => Promise.resolve("data:image/png;base64,AA==")} />);
    openPanel(container);
    fireEvent.click(screen.getByRole("button", { name: "Capture a screenshot of the page" }));
    expect(await screen.findByText(SCREENSHOT_ACK)).toBeInTheDocument();
  });
});
