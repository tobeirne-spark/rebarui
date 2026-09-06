import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Card } from "../components/Card";

afterEach(cleanup);

describe("Card", () => {
  it("renders its children inside a real div with the expected data attribute", () => {
    render(<Card>Card content</Card>);
    const card = screen.getByText("Card content");
    expect(card.closest("[data-rebar-component='card']")).toBeInTheDocument();
  });

  it("forwards arbitrary DOM props to its root element", () => {
    render(<Card aria-label="Team summary">Content</Card>);
    expect(screen.getByLabelText("Team summary")).toBeInTheDocument();
  });

  it("merges a custom className with its own", () => {
    render(<Card className="custom-class">Content</Card>);
    const card = screen.getByText("Content").closest(".rebar-card");
    expect(card).toHaveClass("custom-class");
  });

  it("renders no header/cover/actions chrome when only children are given (backward-compatible)", () => {
    render(<Card>Plain content</Card>);
    const card = screen.getByText("Plain content").closest("[data-rebar-component='card']")!;
    expect(card.querySelector("[data-rebar-part='header']")).not.toBeInTheDocument();
    expect(card.querySelector("[data-rebar-part='cover']")).not.toBeInTheDocument();
    expect(card.querySelector("[data-rebar-part='actions']")).not.toBeInTheDocument();
  });

  it("renders a title/extra header, a cover, and an actions row when given", () => {
    render(
      <Card
        cover={<img alt="Product photo" src="/x.png" />}
        title="Pro plan"
        extra={<span>New</span>}
        actions={[<button key="buy">Buy</button>]}
      >
        $19/month
      </Card>,
    );
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(screen.getByText("Pro plan")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("$19/month")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buy" })).toBeInTheDocument();
  });

  it("renders an avatar alongside the title for a profile-card shape", () => {
    render(
      <Card avatar={<span data-testid="avatar">PS</span>} title="Priya Shah">
        Engineering lead
      </Card>,
    );
    expect(screen.getByTestId("avatar")).toBeInTheDocument();
    expect(screen.getByText("Priya Shah")).toBeInTheDocument();
  });

  describe("kanban-card slots", () => {
    it("renders a subtitle directly under the title", () => {
      render(<Card title="Fix login redirect" subtitle="ENG-142" />);
      expect(screen.getByText("Fix login redirect").closest("[data-rebar-part='title']")).toBeInTheDocument();
      expect(screen.getByText("ENG-142").closest("[data-rebar-part='subtitle']")).toBeInTheDocument();
    });

    it("renders labels as real Tag pills", () => {
      render(<Card labels={[{ label: "Bug", tone: "error" }, { label: "P1" }]} />);
      const bug = screen.getByText("Bug");
      expect(bug.closest("[data-rebar-component='tag']")).toBeInTheDocument();
      expect(screen.getByText("P1")).toBeInTheDocument();
    });

    it("renders a corner badge, separate from the header", () => {
      render(
        <Card title="Task" cornerBadge={<span data-testid="badge">!</span>}>
          Body
        </Card>,
      );
      const badge = screen.getByTestId("badge");
      expect(badge.closest("[data-rebar-part='corner-badge']")).toBeInTheDocument();
    });

    it("renders a footer row distinct from the actions row", () => {
      render(
        <Card footer={<span>3 comments</span>} actions={[<button key="open">Open</button>]}>
          Body
        </Card>,
      );
      expect(screen.getByText("3 comments").closest("[data-rebar-part='footer']")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Open" }).closest("[data-rebar-part='actions']")).toBeInTheDocument();
    });

    it("clamps the title to titleLines via line-clamp styling", () => {
      render(<Card title="A very long title that would normally wrap" titleLines={2} />);
      const title = screen.getByText("A very long title that would normally wrap");
      expect(title).toHaveStyle({ WebkitLineClamp: "2" });
    });
  });

  describe("editable title", () => {
    it("renders a static title by default, even when onTitleChange is set", () => {
      const onTitleChange = vi.fn();
      render(<Card title="Task one" onTitleChange={onTitleChange} />);
      expect(screen.queryByRole("button", { name: /click to edit/i })).not.toBeInTheDocument();
      expect(screen.getByText("Task one")).toBeInTheDocument();
    });

    it("renders the title via the real Editable component when editable is set, and commits edits back through onTitleChange", async () => {
      const user = userEvent.setup();
      const onTitleChange = vi.fn();
      function Wrapper() {
        const [title, setTitle] = useState("Task one");
        return (
          <Card
            title={title}
            editable
            onTitleChange={(value) => {
              onTitleChange(value);
              setTitle(value);
            }}
          />
        );
      }
      render(<Wrapper />);
      const display = screen.getByRole("button", { name: "Title, click to edit" });
      expect(display).toHaveTextContent("Task one");

      await user.click(display);
      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.type(input, "Task renamed{Enter}");

      expect(onTitleChange).toHaveBeenLastCalledWith("Task renamed");
      expect(screen.getByRole("button", { name: "Title, click to edit" })).toHaveTextContent("Task renamed");
    });

    it("falls back to a static title when editable is set but title isn't a plain string", () => {
      render(<Card title={<span>Rich title</span>} editable />);
      expect(screen.queryByRole("button", { name: /click to edit/i })).not.toBeInTheDocument();
      expect(screen.getByText("Rich title")).toBeInTheDocument();
    });
  });

  describe("activeBorder", () => {
    it("omits the active-border class by default", () => {
      render(<Card>Body</Card>);
      expect(screen.getByText("Body").closest("[data-rebar-component='card']")).not.toHaveClass(
        "rebar-active-border",
      );
    });

    it("adds the active-border class when set", () => {
      render(<Card activeBorder>Body</Card>);
      expect(screen.getByText("Body").closest("[data-rebar-component='card']")).toHaveClass(
        "rebar-active-border",
      );
    });
  });

  describe("watermark", () => {
    it("renders the card plainly, with no watermark overlay, by default", () => {
      const { container } = render(<Card>Body</Card>);
      expect(container.querySelector('[data-rebar-component="watermark"]')).not.toBeInTheDocument();
    });

    it("wraps the whole card in a real Watermark overlay when set", () => {
      const { container } = render(<Card watermark="CONFIDENTIAL">Body</Card>);
      const watermark = container.querySelector('[data-rebar-component="watermark"]');
      expect(watermark).toBeInTheDocument();
      expect(watermark?.querySelector('[data-rebar-component="card"]')).toBeInTheDocument();
      expect(screen.getByText("Body")).toBeInTheDocument();
    });
  });
});
