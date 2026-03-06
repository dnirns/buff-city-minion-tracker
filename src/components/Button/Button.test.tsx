import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import Button from "./Button";

describe("Button", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies primary variant by default", () => {
    const { container } = render(<Button>Test</Button>);
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("button");
    expect(btn.className).toContain("primary");
  });

  it("applies the specified variant class", () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("danger");
  });

  it("applies fullWidth class when fullWidth is true", () => {
    const { container } = render(<Button fullWidth>Wide</Button>);
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("fullWidth");
  });

  it("does not apply fullWidth class by default", () => {
    const { container } = render(<Button>Normal</Button>);
    const btn = container.querySelector("button")!;
    expect(btn.className).not.toContain("fullWidth");
  });

  it("merges custom className", () => {
    const { container } = render(<Button className="custom">Test</Button>);
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("custom");
  });

  it("forwards native button props", () => {
    render(<Button disabled type="submit">Submit</Button>);
    const btn = screen.getByRole("button", { name: "Submit" });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("type", "submit");
  });

  it("calls onClick handler when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole("button", { name: "Click" }));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("supports all variant values", () => {
    const variants = ["primary", "secondary", "success", "danger", "stepper", "icon"] as const;
    for (const variant of variants) {
      const { container } = render(<Button variant={variant}>V</Button>);
      const btn = container.querySelector("button")!;
      expect(btn.className).toContain(variant);
    }
  });
});
