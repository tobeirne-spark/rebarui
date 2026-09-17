import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlockRenderer } from "./BlockRenderer";
import type { Construct } from "./schema";

describe("construct-entry block type", () => {
  it("renders a block entry with all fields", () => {
    const blocks: Construct[] = [
      {
        type: "construct-entry",
        id: "Button",
        measured: true,
        description: "A clickable button component",
        shape: `interface ButtonProps {
  label: string;
  onClick: () => void;
}`,
        code: `export const Button = ({ label, onClick }) => (
  <button onClick={onClick}>{label}</button>
);`,
        blocks: [
          {
            type: "callout",
            tone: "info",
            title: "Demo",
            subtitle: "This is a demo",
          },
        ],
      },
    ];

    render(<BlockRenderer blocks={blocks} />);

    // Check heading
    expect(screen.getByText("Button")).toBeInTheDocument();

    // Check tag
    expect(screen.getByText("Measured")).toBeInTheDocument();

    // Check description
    expect(screen.getByText("A clickable button component")).toBeInTheDocument();

    // Check shape label
    expect(screen.getByText("Shape")).toBeInTheDocument();

    // Check implementation label
    expect(screen.getByText("Implementation")).toBeInTheDocument();

    // Check demo label (callout title)
    expect(screen.getAllByText("Demo").length).toBeGreaterThanOrEqual(1);
  });

  it("renders unmeasured tag correctly", () => {
    const blocks: Construct[] = [
      {
        type: "construct-entry",
        id: "Input",
        measured: false,
        description: "A text input component",
        shape: `interface InputProps {
  value: string;
  onChange: (value: string) => void;
}`,
      },
    ];

    render(<BlockRenderer blocks={blocks} />);

    expect(screen.getByText("Unmeasured")).toBeInTheDocument();
  });

  it("renders without optional code and blocks", () => {
    const blocks: Construct[] = [
      {
        type: "construct-entry",
        id: "Card",
        measured: true,
        description: "A card container",
        shape: `interface CardProps {
  children: ReactNode;
}`,
      },
    ];

    render(<BlockRenderer blocks={blocks} />);

    expect(screen.getByText("Card")).toBeInTheDocument();
    expect(screen.queryByText("Implementation")).not.toBeInTheDocument();
    expect(screen.queryByText("Demo")).not.toBeInTheDocument();
  });
});
