import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import NewGameModal from "./NewGameModal";
import { saveGame } from "@/lib/gameState";
import { slugify } from "@/lib/slugify";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/gameState", () => ({
  saveGame: vi.fn(),
}));

vi.mock("@/lib/slugify", () => ({
  slugify: vi.fn((s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")),
}));

describe("NewGameModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("returns null when isOpen is false", () => {
    const { container } = render(
      <NewGameModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders the modal when isOpen is true", () => {
    render(<NewGameModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Start New Game" })).toBeInTheDocument();
  });

  it("renders the input and buttons", () => {
    render(<NewGameModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByLabelText("Game Name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NewGameModal isOpen={true} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<NewGameModal isOpen={true} onClose={onClose} />);

    const backdrop = container.firstChild as HTMLElement;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when modal content is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NewGameModal isOpen={true} onClose={onClose} />);

    await user.click(screen.getByRole("heading", { name: "Start New Game" }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows error when submitting empty name", async () => {
    const user = userEvent.setup();
    render(<NewGameModal isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Start Game" }));
    expect(screen.getByText("Please enter a game name.")).toBeInTheDocument();
  });

  it("shows error when name produces empty slug", async () => {
    vi.mocked(slugify).mockReturnValueOnce("");

    const user = userEvent.setup();
    render(<NewGameModal isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByLabelText("Game Name");
    await user.type(input, "!!!");
    await user.click(screen.getByRole("button", { name: "Start Game" }));

    expect(
      screen.getByText("Please enter a valid name with at least one letter or number.")
    ).toBeInTheDocument();
  });

  it("saves game and navigates on valid submit", async () => {
    const user = userEvent.setup();
    render(<NewGameModal isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByLabelText("Game Name");
    await user.type(input, "Friday Night");
    await user.click(screen.getByRole("button", { name: "Start Game" }));

    expect(saveGame).toHaveBeenCalledWith("Friday Night", "friday-night");
    expect(mockPush).toHaveBeenCalledWith("/game/friday-night");
  });

  it("has maxLength of 50 on input", () => {
    render(<NewGameModal isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByLabelText("Game Name");
    expect(input).toHaveAttribute("maxLength", "50");
  });

  it("has placeholder text", () => {
    render(<NewGameModal isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByLabelText("Game Name");
    expect(input).toHaveAttribute("placeholder", "e.g. Friday Night Showdown");
  });
});
