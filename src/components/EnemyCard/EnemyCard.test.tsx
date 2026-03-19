import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import EnemyCard from "./EnemyCard";
import type { Enemy, TurnNumber } from "@/lib/types";

const makeEnemy = (overrides: Partial<Enemy> = {}): Enemy => ({
  id: "enemy-1",
  type: "Goon",
  number: 1,
  displayName: "Goon 1",
  edge: 2,
  intent: "Combat",
  spawnedOnTurn: 1,
  defeated: false,
  activated: false,
  strike: 3,
  condition: 4,
  agility: 2,
  range: 1,
  energy: 5,
  damage: 2,
  ready: 1,
  ...overrides,
});

const defaultProps = () => ({
  enemy: makeEnemy(),
  currentTurn: 1 as TurnNumber,
  onUpdateStat: vi.fn(),
  onRename: vi.fn(),
  onDefeat: vi.fn(),
  onRerollIntent: vi.fn(),
  onCommandingOrders: vi.fn(),
  onRerollIntentForEnemy: vi.fn(),
  onRevive: vi.fn(),
  onToggleActivated: vi.fn(),
  activeNonUC: [] as Enemy[],
  spawnPending: false,
});

describe("EnemyCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the enemy display name", () => {
    render(<EnemyCard {...defaultProps()} />);
    expect(screen.getByText("Goon 1")).toBeInTheDocument();
  });

  it("shows type in parentheses when renamed", () => {
    const props = defaultProps();
    props.enemy = makeEnemy({ displayName: "Big Boy" });
    render(<EnemyCard {...props} />);
    expect(screen.getByText("Big Boy (Goon)")).toBeInTheDocument();
  });

  it("does not show type in parentheses for default name", () => {
    render(<EnemyCard {...defaultProps()} />);
    expect(screen.queryByText("Goon 1 (Goon)")).not.toBeInTheDocument();
  });

  it("shows the edge", () => {
    render(<EnemyCard {...defaultProps()} />);
    expect(screen.getByText("Edge 2")).toBeInTheDocument();
  });

  it("shows 'Anywhere' when edge is null", () => {
    const props = defaultProps();
    props.enemy = makeEnemy({ edge: null });
    render(<EnemyCard {...props} />);
    expect(screen.getByText("Anywhere")).toBeInTheDocument();
  });

  it("shows 'New' badge when spawned on current turn", () => {
    render(<EnemyCard {...defaultProps()} />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("does not show 'New' badge on later turns", () => {
    const props = defaultProps();
    props.currentTurn = 3 as TurnNumber;
    render(<EnemyCard {...props} />);
    expect(screen.queryByText("New")).not.toBeInTheDocument();
  });

  it("displays the intent", () => {
    render(<EnemyCard {...defaultProps()} />);
    expect(screen.getByText("Combat")).toBeInTheDocument();
  });

  it("shows the Re-roll button", () => {
    render(<EnemyCard {...defaultProps()} />);
    expect(screen.getByRole("button", { name: "Re-roll" })).toBeInTheDocument();
  });

  it("calls onRerollIntent when Re-roll is clicked", async () => {
    const user = userEvent.setup();
    const props = defaultProps();
    render(<EnemyCard {...props} />);

    await user.click(screen.getByRole("button", { name: "Re-roll" }));
    expect(props.onRerollIntent).toHaveBeenCalledWith("enemy-1");
  });

  it("shows the Defeated button for active enemies", () => {
    render(<EnemyCard {...defaultProps()} />);
    expect(screen.getByRole("button", { name: "Defeated" })).toBeInTheDocument();
  });

  it("calls onDefeat when Defeated is clicked", async () => {
    const user = userEvent.setup();
    const props = defaultProps();
    render(<EnemyCard {...props} />);

    await user.click(screen.getByRole("button", { name: "Defeated" }));
    expect(props.onDefeat).toHaveBeenCalledWith("enemy-1");
  });

  it("shows static stats for non-UC enemies", () => {
    render(<EnemyCard {...defaultProps()} />);
    expect(screen.getByText("STR")).toBeInTheDocument();
    expect(screen.getByText("AGI")).toBeInTheDocument();
    expect(screen.getByText("RNG")).toBeInTheDocument();
    expect(screen.getByText("ENG")).toBeInTheDocument();
    expect(screen.getByText("DMG")).toBeInTheDocument();
  });

  it("shows CON and RDY trackers with stepper buttons", () => {
    render(<EnemyCard {...defaultProps()} />);
    expect(screen.getByText("CON")).toBeInTheDocument();
    expect(screen.getByText("RDY")).toBeInTheDocument();
  });

  it("calls onUpdateStat for condition increment", async () => {
    const user = userEvent.setup();
    const props = defaultProps();
    render(<EnemyCard {...props} />);

    const conSection = screen.getByText("CON").closest("div")!;
    const plusButtons = within(conSection).getAllByRole("button", { name: "+" });
    await user.click(plusButtons[0]);

    expect(props.onUpdateStat).toHaveBeenCalledWith("enemy-1", "condition", 1);
  });

  it("calls onUpdateStat for condition decrement", async () => {
    const user = userEvent.setup();
    const props = defaultProps();
    render(<EnemyCard {...props} />);

    const conSection = screen.getByText("CON").closest("div")!;
    const minusButtons = within(conSection).getAllByRole("button", { name: "-" });
    await user.click(minusButtons[0]);

    expect(props.onUpdateStat).toHaveBeenCalledWith("enemy-1", "condition", -1);
  });

  it("calls onUpdateStat for ready increment", async () => {
    const user = userEvent.setup();
    const props = defaultProps();
    render(<EnemyCard {...props} />);

    const rdySection = screen.getByText("RDY").closest("div")!;
    const plusButtons = within(rdySection).getAllByRole("button", { name: "+" });
    await user.click(plusButtons[0]);

    expect(props.onUpdateStat).toHaveBeenCalledWith("enemy-1", "ready", 1);
  });

  it("calls onUpdateStat for ready decrement", async () => {
    const user = userEvent.setup();
    const props = defaultProps();
    render(<EnemyCard {...props} />);

    const rdySection = screen.getByText("RDY").closest("div")!;
    const minusButtons = within(rdySection).getAllByRole("button", { name: "-" });
    await user.click(minusButtons[0]);

    expect(props.onUpdateStat).toHaveBeenCalledWith("enemy-1", "ready", -1);
  });

  describe("defeated state", () => {
    it("shows 'Defeated' label and Revive button", () => {
      const props = defaultProps();
      props.enemy = makeEnemy({ defeated: true });
      render(<EnemyCard {...props} />);

      expect(screen.getByText("Defeated")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Revive" })).toBeInTheDocument();
    });

    it("calls onRevive when Revive is clicked", async () => {
      const user = userEvent.setup();
      const props = defaultProps();
      props.enemy = makeEnemy({ defeated: true });
      render(<EnemyCard {...props} />);

      await user.click(screen.getByRole("button", { name: "Revive" }));
      expect(props.onRevive).toHaveBeenCalledWith("enemy-1");
    });

    it("does not show rename button when defeated", () => {
      const props = defaultProps();
      props.enemy = makeEnemy({ defeated: true });
      render(<EnemyCard {...props} />);

      expect(screen.queryByLabelText("Rename")).not.toBeInTheDocument();
    });

    it("does not show stats or Defeated button when defeated", () => {
      const props = defaultProps();
      props.enemy = makeEnemy({ defeated: true });
      render(<EnemyCard {...props} />);

      expect(screen.queryByText("STR")).not.toBeInTheDocument();
      expect(screen.queryByText("Re-roll")).not.toBeInTheDocument();
    });
  });

  describe("rename modal", () => {
    it("opens rename modal when edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<EnemyCard {...defaultProps()} />);

      await user.click(screen.getByLabelText("Rename"));
      expect(screen.getByRole("heading", { name: "Rename" })).toBeInTheDocument();
    });

    it("calls onRename and closes modal on save", async () => {
      const user = userEvent.setup();
      const props = defaultProps();
      render(<EnemyCard {...props} />);

      await user.click(screen.getByLabelText("Rename"));
      const input = screen.getByLabelText("Name");
      await user.clear(input);
      await user.type(input, "Custom Name");
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(props.onRename).toHaveBeenCalledWith("enemy-1", "Custom Name");
      expect(screen.queryByRole("heading", { name: "Rename" })).not.toBeInTheDocument();
    });

    it("closes rename modal when Cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<EnemyCard {...defaultProps()} />);

      await user.click(screen.getByLabelText("Rename"));
      expect(screen.getByRole("heading", { name: "Rename" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(screen.queryByRole("heading", { name: "Rename" })).not.toBeInTheDocument();
    });
  });

  describe("UniqueCitizen layout", () => {
    it("shows all stat steppers for UC enemies", () => {
      const props = defaultProps();
      props.enemy = makeEnemy({ type: "UniqueCitizen", displayName: "Unique Citizen 1" });
      render(<EnemyCard {...props} />);

      expect(screen.getByText("STR")).toBeInTheDocument();
      expect(screen.getByText("AGI")).toBeInTheDocument();
      expect(screen.getByText("RNG")).toBeInTheDocument();
      expect(screen.getByText("ENG")).toBeInTheDocument();
      expect(screen.getByText("DMG")).toBeInTheDocument();
      expect(screen.getByText("CON")).toBeInTheDocument();
      expect(screen.getByText("RDY")).toBeInTheDocument();

      // UC gets stepper buttons for all stats
      const allPlusButtons = screen.getAllByRole("button", { name: "+" });
      const allMinusButtons = screen.getAllByRole("button", { name: "-" });
      // 5 editable stats + CON + RDY = 7 pairs
      expect(allPlusButtons).toHaveLength(7);
      expect(allMinusButtons).toHaveLength(7);
    });

    it("calls onUpdateStat for UC editable stats", async () => {
      const user = userEvent.setup();
      const props = defaultProps();
      props.enemy = makeEnemy({ type: "UniqueCitizen", displayName: "Unique Citizen 1" });
      render(<EnemyCard {...props} />);

      // Click STR increment (first editable stat)
      const strSection = screen.getByText("STR").closest("div")!;
      await user.click(within(strSection).getAllByRole("button", { name: "+" })[0]);
      expect(props.onUpdateStat).toHaveBeenCalledWith("enemy-1", "strike", 1);

      // Click AGI decrement
      const agiSection = screen.getByText("AGI").closest("div")!;
      await user.click(within(agiSection).getAllByRole("button", { name: "-" })[0]);
      expect(props.onUpdateStat).toHaveBeenCalledWith("enemy-1", "agility", -1);
    });

    it("calls onUpdateStat for UC CON and RDY trackers", async () => {
      const user = userEvent.setup();
      const props = defaultProps();
      props.enemy = makeEnemy({ type: "UniqueCitizen", displayName: "Unique Citizen 1" });
      render(<EnemyCard {...props} />);

      const conSection = screen.getByText("CON").closest("div")!;
      await user.click(within(conSection).getAllByRole("button", { name: "+" })[0]);
      expect(props.onUpdateStat).toHaveBeenCalledWith("enemy-1", "condition", 1);

      await user.click(within(conSection).getAllByRole("button", { name: "-" })[0]);
      expect(props.onUpdateStat).toHaveBeenCalledWith("enemy-1", "condition", -1);

      const rdySection = screen.getByText("RDY").closest("div")!;
      await user.click(within(rdySection).getAllByRole("button", { name: "+" })[0]);
      expect(props.onUpdateStat).toHaveBeenCalledWith("enemy-1", "ready", 1);

      await user.click(within(rdySection).getAllByRole("button", { name: "-" })[0]);
      expect(props.onUpdateStat).toHaveBeenCalledWith("enemy-1", "ready", -1);
    });
  });

  describe("CommandingOrders intent", () => {
    it("shows target buttons when Lieutenant has active goons/henchmen", () => {
      const props = defaultProps();
      props.enemy = makeEnemy({
        type: "Lieutenant",
        displayName: "Lieutenant 1",
        intent: "CommandingOrders",
      });
      props.activeNonUC = [
        makeEnemy({ id: "goon-1", type: "Goon", displayName: "Goon 1" }),
        makeEnemy({ id: "hench-1", type: "Henchman", displayName: "Henchman 1" }),
      ];
      render(<EnemyCard {...props} />);

      expect(screen.getByText("Pick an enemy to re-roll intent:")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Goon 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Henchman 1" })).toBeInTheDocument();
    });

    it("calls onRerollIntentForEnemy when target is clicked", async () => {
      const user = userEvent.setup();
      const props = defaultProps();
      props.enemy = makeEnemy({
        type: "Lieutenant",
        displayName: "Lieutenant 1",
        intent: "CommandingOrders",
      });
      props.activeNonUC = [
        makeEnemy({ id: "goon-1", type: "Goon", displayName: "Goon 1" }),
      ];
      render(<EnemyCard {...props} />);

      await user.click(screen.getByRole("button", { name: "Goon 1" }));
      expect(props.onRerollIntentForEnemy).toHaveBeenCalledWith("goon-1");
    });

    it("shows Spawn Reinforcement button when no targets available for Lieutenant", () => {
      const props = defaultProps();
      props.enemy = makeEnemy({
        type: "Lieutenant",
        displayName: "Lieutenant 1",
        intent: "CommandingOrders",
      });
      props.activeNonUC = [];
      render(<EnemyCard {...props} />);

      expect(screen.getByRole("button", { name: "Spawn Reinforcement" })).toBeInTheDocument();
    });

    it("disables Spawn Reinforcement when spawnPending", () => {
      const props = defaultProps();
      props.enemy = makeEnemy({
        type: "Lieutenant",
        displayName: "Lieutenant 1",
        intent: "CommandingOrders",
      });
      props.activeNonUC = [];
      props.spawnPending = true;
      render(<EnemyCard {...props} />);

      expect(screen.getByRole("button", { name: "Spawn Reinforcement" })).toBeDisabled();
    });

    it("calls onCommandingOrders when Spawn Reinforcement is clicked", async () => {
      const user = userEvent.setup();
      const props = defaultProps();
      props.enemy = makeEnemy({
        type: "Lieutenant",
        displayName: "Lieutenant 1",
        intent: "CommandingOrders",
      });
      props.activeNonUC = [];
      render(<EnemyCard {...props} />);

      await user.click(screen.getByRole("button", { name: "Spawn Reinforcement" }));
      expect(props.onCommandingOrders).toHaveBeenCalledWith("enemy-1");
    });

    it("does not show commanding orders UI for Goon with CommandingOrders", () => {
      const props = defaultProps();
      props.enemy = makeEnemy({ intent: "CommandingOrders" });
      render(<EnemyCard {...props} />);

      expect(screen.queryByText("Pick an enemy to re-roll intent:")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Spawn Reinforcement" })).not.toBeInTheDocument();
    });

    it("UC with CommandingOrders shows all non-UC enemies as targets", () => {
      const props = defaultProps();
      props.enemy = makeEnemy({
        type: "UniqueCitizen",
        displayName: "Unique Citizen 1",
        intent: "CommandingOrders",
      });
      props.activeNonUC = [
        makeEnemy({ id: "lt-1", type: "Lieutenant", displayName: "Lieutenant 1" }),
        makeEnemy({ id: "goon-1", type: "Goon", displayName: "Goon 1" }),
      ];
      render(<EnemyCard {...props} />);

      expect(screen.getByRole("button", { name: "Lieutenant 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Goon 1" })).toBeInTheDocument();
    });
  });

  describe("activation marker", () => {
    it("shows activation badge for active enemies", () => {
      render(<EnemyCard {...defaultProps()} />);
      expect(screen.getByLabelText("Mark as activated")).toBeInTheDocument();
    });

    it("shows inactive state by default", () => {
      render(<EnemyCard {...defaultProps()} />);
      expect(screen.getByLabelText("Mark as activated")).toHaveAttribute("aria-pressed", "false");
    });

    it("calls onToggleActivated when badge is clicked", async () => {
      const user = userEvent.setup();
      const props = defaultProps();
      render(<EnemyCard {...props} />);

      await user.click(screen.getByLabelText("Mark as activated"));
      expect(props.onToggleActivated).toHaveBeenCalledWith("enemy-1");
    });

    it("shows activated state when enemy.activated is true", () => {
      const props = defaultProps();
      props.enemy = makeEnemy({ activated: true });
      render(<EnemyCard {...props} />);

      expect(screen.getByLabelText("Mark as not activated")).toHaveAttribute("aria-pressed", "true");
    });

    it("does not show activation badge for defeated enemies", () => {
      const props = defaultProps();
      props.enemy = makeEnemy({ defeated: true });
      render(<EnemyCard {...props} />);

      expect(screen.queryByLabelText("Mark as activated")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Mark as not activated")).not.toBeInTheDocument();
    });
  });

  it("shows the High Ground rule text", () => {
    render(<EnemyCard {...defaultProps()} />);
    expect(
      screen.getByText(/High Ground: D6/)
    ).toBeInTheDocument();
  });

  it("shows behaviour summary and actions", () => {
    render(<EnemyCard {...defaultProps()} />);
    expect(screen.getByText("Close distance and attack")).toBeInTheDocument();
    expect(screen.getByText("1st")).toBeInTheDocument();
    expect(screen.getByText("2nd")).toBeInTheDocument();
  });
});
