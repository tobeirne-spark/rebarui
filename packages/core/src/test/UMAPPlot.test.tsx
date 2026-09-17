import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { UMAPPlot } from "../components/UMAPPlot";

afterEach(cleanup);

function getPoints(container: HTMLElement) {
  return container.querySelectorAll('[data-rebar-part="point"]');
}

function getTagLines(container: HTMLElement) {
  const tag = container.querySelector('[data-rebar-part="value-tag"]');
  return Array.from(tag?.querySelectorAll("text") ?? []).map((el) => el.textContent);
}

describe("UMAPPlot", () => {
  const clusters = [
    {
      label: "Docs",
      points: [
        { x: 1, y: 2, id: "doc-1", preview: "Refunds are processed within 5 business days of approval once the return has been received and inspected." },
        { x: 1.5, y: 2.4 },
      ],
    },
    {
      label: "Support tickets",
      points: [{ x: -3, y: 5, id: "ticket-42", preview: "Customer reports the app crashes on login after the update." }],
    },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<UMAPPlot clusters={clusters} title="Vector DB contents" />);
    expect(screen.getByRole("img", { name: "Vector DB contents" })).toBeInTheDocument();
  });

  it("prefers an explicit ariaLabel over title for the accessible name", () => {
    render(<UMAPPlot clusters={clusters} title="Vector DB contents" ariaLabel="Detailed description" />);
    expect(screen.getByRole("img", { name: "Detailed description" })).toBeInTheDocument();
  });

  it("renders a visible figcaption when title is set, and omits it when title is unset", () => {
    const { rerender } = render(<UMAPPlot clusters={clusters} title="Vector DB contents" />);
    expect(screen.getByText("Vector DB contents")).toBeInTheDocument();
    rerender(<UMAPPlot clusters={clusters} ariaLabel="chart" />);
    expect(screen.queryByText("Vector DB contents")).not.toBeInTheDocument();
  });

  it("renders one point per record across all clusters", () => {
    const { container } = render(<UMAPPlot clusters={clusters} title="Vector DB contents" />);
    expect(getPoints(container)).toHaveLength(3);
  });

  it("renders a legend entry per cluster with a bionic-wired label", () => {
    render(<UMAPPlot clusters={clusters} title="Vector DB contents" />);
    expect(screen.getByText("Docs")).toBeInTheDocument();
    expect(screen.getByText("Support tickets")).toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<UMAPPlot clusters={clusters} title="Vector DB contents" />);
    expect(container.querySelector('[data-rebar-component="umap-plot"]')).toBeInTheDocument();
  });

  it("renders unitless axis captions instead of numeric tick labels", () => {
    render(<UMAPPlot clusters={clusters} title="Vector DB contents" />);
    expect(screen.getByText("UMAP-1")).toBeInTheDocument();
    expect(screen.getByText("UMAP-2")).toBeInTheDocument();
  });

  it("renders the shared chart empty state when there are no points", () => {
    const { container } = render(<UMAPPlot clusters={[{ label: "Empty", points: [] }]} title="Vector DB contents" />);
    expect(container.querySelector('[data-rebar-part="point"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-rebar-component="empty"]')).toBeInTheDocument();
  });

  it("hovering a point with a preview shows its cluster/id and truncated content, not raw coordinates", () => {
    const { container } = render(<UMAPPlot clusters={clusters} title="Vector DB contents" />);
    const point = getPoints(container)[0] as HTMLElement; // Docs, doc-1

    fireEvent.pointerEnter(point);
    const lines = getTagLines(container);
    expect(lines[0]).toBe("Docs — doc-1");
    expect(lines[1]).toBe("Refunds are processed within 5 business days of approval on…");
    expect(lines[1]).not.toMatch(/^x: /);
  });

  it("hovering a point with no preview falls back to raw coordinates", () => {
    const { container } = render(<UMAPPlot clusters={clusters} title="Vector DB contents" />);
    const point = getPoints(container)[1] as HTMLElement; // Docs, second point, no id/preview

    fireEvent.pointerEnter(point);
    const lines = getTagLines(container);
    expect(lines[0]).toBe("Docs");
    expect(lines[1]).toBe("x: 1.50  y: 2.40");
  });

  it("clicking a point persists its tag after the pointer leaves; a dead click clears it", () => {
    const { container } = render(<UMAPPlot clusters={clusters} title="Vector DB contents" />);
    const point = getPoints(container)[0] as HTMLElement;
    const background = container.querySelector('[data-rebar-part="chart-background"]') as HTMLElement;

    fireEvent.click(point);
    fireEvent.pointerLeave(point);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).toBeInTheDocument();

    fireEvent.click(background);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).not.toBeInTheDocument();
  });
});
