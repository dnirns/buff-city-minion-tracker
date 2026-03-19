import { describe, it, expect, vi } from "vitest";
import { gameReducer, INITIAL_STATE } from "@/lib/gameReducer";
import type { GameState, Enemy, TurnNumber } from "@/lib/types";

vi.mock("@/lib/dice", () => ({
  rollD12: vi.fn(() => 1),
}));

vi.mock("@/lib/intentTable", () => ({
  lookupIntent: vi.fn(() => "Slam"),
}));

const makeEnemy = (overrides: Partial<Enemy> = {}): Enemy => ({
  id: "test-1",
  type: "Goon",
  number: 1,
  displayName: "Goon 1",
  edge: 1,
  intent: "Combat",
  spawnedOnTurn: 1,
  defeated: false,
  activated: false,
  strike: 0,
  condition: 6,
  agility: 0,
  range: 5,
  energy: 6,
  damage: 0,
  ready: 0,
  ...overrides,
});

const stateWithEnemy = (enemy?: Partial<Enemy>): GameState => ({
  ...INITIAL_STATE,
  enemies: [makeEnemy(enemy)],
});

describe("gameReducer", () => {
  describe("LOAD", () => {
    it("replaces entire state", () => {
      const loaded: GameState = { ...INITIAL_STATE, gameName: "Loaded Game", turn: 5 as TurnNumber };
      const result = gameReducer(INITIAL_STATE, { type: "LOAD", state: loaded });
      expect(result).toEqual(loaded);
    });
  });

  describe("ADVANCE_TURN", () => {
    it("increments turn by 1", () => {
      const result = gameReducer(INITIAL_STATE, { type: "ADVANCE_TURN" });
      expect(result.turn).toBe(2);
    });

    it("does not exceed MAX_TURN (10)", () => {
      const state = { ...INITIAL_STATE, turn: 10 as TurnNumber };
      const result = gameReducer(state, { type: "ADVANCE_TURN" });
      expect(result.turn).toBe(10);
    });

    it("resets all enemies' activated to false", () => {
      const state: GameState = {
        ...INITIAL_STATE,
        enemies: [
          makeEnemy({ id: "test-1", activated: true }),
          makeEnemy({ id: "test-2", number: 2, activated: false }),
        ],
      };
      const result = gameReducer(state, { type: "ADVANCE_TURN" });
      expect(result.enemies[0].activated).toBe(false);
      expect(result.enemies[1].activated).toBe(false);
    });
  });

  describe("RETREAT_TURN", () => {
    it("decrements turn by 1", () => {
      const state = { ...INITIAL_STATE, turn: 3 as TurnNumber };
      const result = gameReducer(state, { type: "RETREAT_TURN" });
      expect(result.turn).toBe(2);
    });

    it("does not go below 1", () => {
      const result = gameReducer(INITIAL_STATE, { type: "RETREAT_TURN" });
      expect(result.turn).toBe(1);
    });
  });

  describe("SPAWN_ENEMY", () => {
    it("adds enemy to the list", () => {
      const enemy = makeEnemy();
      const result = gameReducer(INITIAL_STATE, { type: "SPAWN_ENEMY", enemy, enemyType: "Goon" });
      expect(result.enemies).toHaveLength(1);
      expect(result.enemies[0]).toEqual(enemy);
    });

    it("increments the enemy type counter", () => {
      const enemy = makeEnemy();
      const result = gameReducer(INITIAL_STATE, { type: "SPAWN_ENEMY", enemy, enemyType: "Goon" });
      expect(result.enemyNumbers.Goon).toBe(1);
    });

    it("sets lieutenantSpawned flag when spawning Lieutenant", () => {
      const enemy = makeEnemy({ type: "Lieutenant" });
      const result = gameReducer(INITIAL_STATE, { type: "SPAWN_ENEMY", enemy, enemyType: "Lieutenant" });
      expect(result.lieutenantSpawned).toBe(true);
    });

    it("sets uniqueCitizenSpawned flag when spawning UniqueCitizen", () => {
      const enemy = makeEnemy({ type: "UniqueCitizen" });
      const result = gameReducer(INITIAL_STATE, { type: "SPAWN_ENEMY", enemy, enemyType: "UniqueCitizen" });
      expect(result.uniqueCitizenSpawned).toBe(true);
    });

    it("does not set lieutenant flag for non-Lieutenant types", () => {
      const enemy = makeEnemy();
      const result = gameReducer(INITIAL_STATE, { type: "SPAWN_ENEMY", enemy, enemyType: "Goon" });
      expect(result.lieutenantSpawned).toBe(false);
    });
  });

  describe("DEFEAT_ENEMY", () => {
    it("marks the targeted enemy as defeated", () => {
      const state = stateWithEnemy();
      const result = gameReducer(state, { type: "DEFEAT_ENEMY", enemyId: "test-1" });
      expect(result.enemies[0].defeated).toBe(true);
    });

    it("does not affect other enemies", () => {
      const state: GameState = {
        ...INITIAL_STATE,
        enemies: [makeEnemy({ id: "test-1" }), makeEnemy({ id: "test-2", number: 2 })],
      };
      const result = gameReducer(state, { type: "DEFEAT_ENEMY", enemyId: "test-1" });
      expect(result.enemies[1].defeated).toBe(false);
    });
  });

  describe("UPDATE_STAT", () => {
    it("increments a stat", () => {
      const state = stateWithEnemy();
      const result = gameReducer(state, { type: "UPDATE_STAT", enemyId: "test-1", stat: "strike", delta: 1 });
      expect(result.enemies[0].strike).toBe(1);
    });

    it("decrements a stat", () => {
      const state = stateWithEnemy();
      const result = gameReducer(state, { type: "UPDATE_STAT", enemyId: "test-1", stat: "condition", delta: -2 });
      expect(result.enemies[0].condition).toBe(4);
    });

    it("clamps stat at 0 minimum", () => {
      const state = stateWithEnemy();
      const result = gameReducer(state, { type: "UPDATE_STAT", enemyId: "test-1", stat: "strike", delta: -5 });
      expect(result.enemies[0].strike).toBe(0);
    });

    it("caps ready stat at 6", () => {
      const state = stateWithEnemy();
      const result = gameReducer(state, { type: "UPDATE_STAT", enemyId: "test-1", stat: "ready", delta: 10 });
      expect(result.enemies[0].ready).toBe(6);
    });

    it("does not cap non-ready stats at 6", () => {
      const state = stateWithEnemy();
      const result = gameReducer(state, { type: "UPDATE_STAT", enemyId: "test-1", stat: "condition", delta: 10 });
      expect(result.enemies[0].condition).toBe(16);
    });
  });

  describe("REROLL_INTENT", () => {
    it("changes the enemy intent using mocked dice and lookup", () => {
      const state = stateWithEnemy();
      const result = gameReducer(state, { type: "REROLL_INTENT", enemyId: "test-1" });
      expect(result.enemies[0].intent).toBe("Slam");
    });
  });

  describe("SET_INTENT", () => {
    it("sets intent directly", () => {
      const state = stateWithEnemy();
      const result = gameReducer(state, { type: "SET_INTENT", enemyId: "test-1", intent: "BuffTokenDenial" });
      expect(result.enemies[0].intent).toBe("BuffTokenDenial");
    });
  });

  describe("REVIVE_ENEMY", () => {
    it("sets defeated to false", () => {
      const state = stateWithEnemy({ defeated: true });
      const result = gameReducer(state, { type: "REVIVE_ENEMY", enemyId: "test-1" });
      expect(result.enemies[0].defeated).toBe(false);
    });
  });

  describe("RENAME_ENEMY", () => {
    it("updates the displayName", () => {
      const state = stateWithEnemy();
      const result = gameReducer(state, { type: "RENAME_ENEMY", enemyId: "test-1", displayName: "Big Boss" });
      expect(result.enemies[0].displayName).toBe("Big Boss");
    });
  });

  describe("TOGGLE_ACTIVATED", () => {
    it("toggles activated from false to true", () => {
      const state = stateWithEnemy();
      const result = gameReducer(state, { type: "TOGGLE_ACTIVATED", enemyId: "test-1" });
      expect(result.enemies[0].activated).toBe(true);
    });

    it("toggles activated from true to false", () => {
      const state = stateWithEnemy({ activated: true });
      const result = gameReducer(state, { type: "TOGGLE_ACTIVATED", enemyId: "test-1" });
      expect(result.enemies[0].activated).toBe(false);
    });

    it("does not affect other enemies", () => {
      const state: GameState = {
        ...INITIAL_STATE,
        enemies: [makeEnemy({ id: "test-1" }), makeEnemy({ id: "test-2", number: 2 })],
      };
      const result = gameReducer(state, { type: "TOGGLE_ACTIVATED", enemyId: "test-1" });
      expect(result.enemies[0].activated).toBe(true);
      expect(result.enemies[1].activated).toBe(false);
    });
  });

  describe("unknown action", () => {
    it("returns state unchanged", () => {
      const result = gameReducer(INITIAL_STATE, { type: "NONEXISTENT" } as never);
      expect(result).toBe(INITIAL_STATE);
    });
  });
});
