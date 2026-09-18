import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Col, Row } from "../components/Row";

describe("Row", () => {
  it("carries data-rebar-component on the root", () => {
    render(<Row>content</Row>);
    expect(document.querySelector('[data-rebar-component="row"]')).not.toBeNull();
  });

  it("establishes a 24-unit CSS Grid track", () => {
    const { container } = render(<Row>content</Row>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.display).toBe("grid");
    expect(el.style.gridTemplateColumns).toBe("repeat(24, 1fr)");
  });

  it("applies the gutter token as gap", () => {
    const { container } = render(<Row gutter="lg">content</Row>);
    expect((container.firstChild as HTMLElement).style.gap).toBe("var(--rebar-space-lg, 24px)");
  });
});

describe("Col", () => {
  it("carries data-rebar-component on the root", () => {
    render(<Col>content</Col>);
    expect(document.querySelector('[data-rebar-component="col"]')).not.toBeNull();
  });

  it("defaults to a full-width span of 24, left to CSS Grid's own auto-placement", () => {
    const { container } = render(<Col>content</Col>);
    expect((container.firstChild as HTMLElement).style.gridColumn).toBe("span 24");
  });

  it("honors a custom span, still auto-placed (no explicit start line) when offset is unset", () => {
    const { container } = render(<Col span={8}>content</Col>);
    expect((container.firstChild as HTMLElement).style.gridColumn).toBe("span 8");
  });

  it("two unoffset Cols auto-place with no explicit start line, so sequential siblings sit side by side instead of both starting at column 1", () => {
    const { container } = render(
      <Row>
        <Col span={16}>a</Col>
        <Col span={8}>b</Col>
      </Row>,
    );
    const cols = container.querySelectorAll('[data-rebar-component="col"]');
    expect((cols[0] as HTMLElement).style.gridColumn).toBe("span 16");
    expect((cols[1] as HTMLElement).style.gridColumn).toBe("span 8");
  });

  it("honors an offset, using an explicit absolute start line", () => {
    const { container } = render(
      <Col span={12} offset={6}>
        content
      </Col>,
    );
    expect((container.firstChild as HTMLElement).style.gridColumn).toBe("7 / span 12");
  });
});
