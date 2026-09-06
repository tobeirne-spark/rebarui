import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form, FormItem } from "../components/Form";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

interface Values {
  email: string;
}

function SampleForm({ onSubmit }: { onSubmit: (values: Values) => void }) {
  return (
    <Form<Values> onSubmit={onSubmit}>
      <FormItem name="email" label="Email" required>
        {(field) => <Input type="email" placeholder="you@example.com" {...field} />}
      </FormItem>
      <Button type="submit">Submit</Button>
    </Form>
  );
}

describe("Form", () => {
  it("labels the field above the input and associates them via htmlFor/id", () => {
    render(<SampleForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("marks required fields with a visible asterisk", () => {
    render(<SampleForm onSubmit={vi.fn()} />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("blocks submit and shows an inline error when a required field is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SampleForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent("This field is required");
  });

  it("calls onSubmit with form values once validation passes", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SampleForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), "person@example.com");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ email: "person@example.com" }),
      expect.anything(),
    );
  });
});
