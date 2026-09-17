import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Descriptions } from "../components/Descriptions";
import type { DescriptionItem } from "../components/Descriptions";

describe("Descriptions", () => {
  const items = [
    { label: "Team", value: "Engineering" },
    { label: "Lead", value: "Priya Shah" },
  ];

  it("renders each item as a real label/value pair", () => {
    render(<Descriptions items={items} />);
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Lead")).toBeInTheDocument();
    expect(screen.getByText("Priya Shah")).toBeInTheDocument();
  });

  it("renders an optional title", () => {
    render(<Descriptions title="Project details" items={items} />);
    expect(screen.getByText("Project details")).toBeInTheDocument();
  });

  it("applies the column count to the grid", () => {
    const { container } = render(<Descriptions items={items} column={2} />);
    const grid = container.querySelector(".rebar-descriptions-grid") as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe("repeat(2, 1fr)");
  });

  it("renders a plain value as static text when editable is unset", () => {
    render(<Descriptions items={[{ label: "Team", value: "Engineering" }]} />);
    expect(screen.queryByRole("button", { name: /click to edit/ })).not.toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
  });

  it("makes an editable item a real click-to-edit control, and commits via onItemChange", async () => {
    const user = userEvent.setup();
    const onItemChange = vi.fn();

    function Wrapper() {
      const [items, setItems] = useState<DescriptionItem[]>([
        { label: "Team", value: "Engineering", editable: true },
        { label: "Lead", value: "Priya Shah" },
      ]);
      return (
        <Descriptions
          items={items}
          onItemChange={(index, newValue) => {
            onItemChange(index, newValue);
            setItems((prev) => prev.map((item, i) => (i === index ? { ...item, value: newValue } : item)));
          }}
        />
      );
    }

    render(<Wrapper />);

    // The editable item is a real button (Editable's read mode), the non-editable one is not.
    const editButton = screen.getByRole("button", { name: "Team, click to edit" });
    expect(editButton).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lead, click to edit" })).not.toBeInTheDocument();

    await user.click(editButton);
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Platform{Enter}");

    expect(onItemChange).toHaveBeenLastCalledWith(0, "Platform");
  });

  it("leaves a non-string value static even when editable is set (no-op, not a crash)", () => {
    render(<Descriptions items={[{ label: "Status", value: <strong>Active</strong>, editable: true }]} />);
    expect(screen.queryByRole("button", { name: /click to edit/ })).not.toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
