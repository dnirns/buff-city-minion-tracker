import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import RenameModal from "./RenameModal";

describe("RenameModal", () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    currentName: "Goon 1",
    onSave: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders with the current name in the input", () => {
    render(<RenameModal {...defaultProps} />);
    const input = screen.getByLabelText("Name");
    expect(input).toHaveValue("Goon 1");
  });

  it("renders the heading", () => {
    render(<RenameModal {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "Rename" })).toBeInTheDocument();
  });

  it("renders Save and Cancel buttons", () => {
    render(<RenameModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<RenameModal {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<RenameModal {...defaultProps} onClose={onClose} />);

    const backdrop = container.firstChild as HTMLElement;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when modal content is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<RenameModal {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole("heading", { name: "Rename" }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onSave with trimmed name on submit", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<RenameModal {...defaultProps} onSave={onSave} />);

    const input = screen.getByLabelText("Name");
    await user.clear(input);
    await user.type(input, "  Big Boss  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith("Big Boss");
  });

  it("does not call onSave when name is empty/whitespace", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<RenameModal {...defaultProps} onSave={onSave} />);

    const input = screen.getByLabelText("Name");
    await user.clear(input);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).not.toHaveBeenCalled();
  });

  it("submits on Enter key", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<RenameModal {...defaultProps} onSave={onSave} />);

    const input = screen.getByLabelText("Name");
    await user.clear(input);
    await user.type(input, "New Name{Enter}");

    expect(onSave).toHaveBeenCalledWith("New Name");
  });

  it("has maxLength of 30 on input", () => {
    render(<RenameModal {...defaultProps} />);
    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("maxLength", "30");
  });
});
