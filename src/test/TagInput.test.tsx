import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagInput } from "../components/TagInput";

describe("TagInput", () => {
  it("carries data-rebar-component on the root", () => {
    render(<TagInput />);
    expect(document.querySelector('[data-rebar-component="tag-input"]')).not.toBeNull();
  });

  it("adds a tag on Enter and clears the draft text", async () => {
    const user = userEvent.setup();
    render(<TagInput />);
    const input = screen.getByRole("textbox");
    await user.type(input, "urgent{Enter}");
    expect(screen.getByText("urgent")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("adds a tag on typing a comma", async () => {
    const user = userEvent.setup();
    render(<TagInput />);
    await user.type(screen.getByRole("textbox"), "bug,");
    expect(screen.getByText("bug")).toBeInTheDocument();
  });

  it("removes the last tag on Backspace when the draft is empty", async () => {
    const user = userEvent.setup();
    render(<TagInput defaultValues={["one", "two"]} />);
    expect(screen.getByText("two")).toBeInTheDocument();
    await user.click(screen.getByRole("textbox"));
    await user.keyboard("{Backspace}");
    expect(screen.queryByText("two")).not.toBeInTheDocument();
    expect(screen.getByText("one")).toBeInTheDocument();
  });

  it("does not remove a tag on Backspace when the draft has text", async () => {
    const user = userEvent.setup();
    render(<TagInput defaultValues={["one"]} />);
    await user.type(screen.getByRole("textbox"), "abc");
    await user.keyboard("{Backspace}");
    expect(screen.getByText("one")).toBeInTheDocument();
  });

  it("removes a tag via its own close button", async () => {
    const user = userEvent.setup();
    render(<TagInput defaultValues={["one", "two"]} />);
    const tag = screen.getByText("one").closest('[data-rebar-component="tag"]')!;
    await user.click(tag.querySelector("button")!);
    expect(screen.queryByText("one")).not.toBeInTheDocument();
  });

  it("calls onValuesChange with the updated array", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(<TagInput onValuesChange={onValuesChange} />);
    await user.type(screen.getByRole("textbox"), "one{Enter}");
    expect(onValuesChange).toHaveBeenCalledWith(["one"]);
  });

  it("skips duplicate tags by default (case-insensitive)", async () => {
    const user = userEvent.setup();
    render(<TagInput defaultValues={["Urgent"]} />);
    await user.type(screen.getByRole("textbox"), "urgent{Enter}");
    expect(screen.getAllByText(/urgent/i)).toHaveLength(1);
  });

  it("allows duplicates when allowDuplicates is set", async () => {
    const user = userEvent.setup();
    render(<TagInput defaultValues={["urgent"]} allowDuplicates />);
    await user.type(screen.getByRole("textbox"), "urgent{Enter}");
    expect(screen.getAllByText("urgent")).toHaveLength(2);
  });

  it("stops accepting new tags once maxTags is reached", () => {
    render(<TagInput defaultValues={["one", "two"]} maxTags={2} />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("commits the draft on blur", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <TagInput />
        <button>elsewhere</button>
      </div>,
    );
    await user.type(screen.getByRole("textbox"), "final");
    await user.click(screen.getByRole("button", { name: "elsewhere" }));
    expect(screen.getByText("final")).toBeInTheDocument();
  });
});
