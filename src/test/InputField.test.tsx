import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import InputField from "@/components/InputField";

afterEach(cleanup);

describe("InputField", () => {
  it("links the label and helper text to the input", () => {
    render(<InputField label="What page are you on?" helper="You can change this later." />);
    const input = screen.getByLabelText("What page are you on?");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAccessibleDescription("You can change this later.");
  });

  it("marks the input invalid and shows the error instead of the helper", () => {
    render(<InputField label="Page" helper="You can change this later." error="Enter a page between 1 and 604." />);
    const input = screen.getByLabelText("Page");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a page between 1 and 604.");
    expect(screen.getByRole("alert")).toHaveClass("text-destructive");
    expect(screen.queryByText("You can change this later.")).not.toBeInTheDocument();
  });
});
