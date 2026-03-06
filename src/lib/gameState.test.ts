import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getSavedGames,
  saveGame,
  deleteGame,
  getGameBySlug,
  getGameState,
  saveGameState,
  initGameState,
} from "@/lib/gameState";
import type { GameState } from "@/lib/types";

beforeEach(() => {
  localStorage.clear();
});

const makeGameState = (overrides: Partial<GameState> = {}): GameState => ({
  gameName: "Test Game",
  slug: "test-game",
  createdAt: 1000,
  turn: 1,
  lieutenantSpawned: false,
  uniqueCitizenSpawned: false,
  enemyNumbers: { Goon: 0, Henchman: 0, Lieutenant: 0, UniqueCitizen: 0 },
  enemies: [],
  ...overrides,
});

describe("getSavedGames", () => {
  it("returns empty array when no data", () => {
    expect(getSavedGames()).toEqual([]);
  });

  it("parses stored games", () => {
    const games = [{ gameName: "G1", slug: "g1", createdAt: 1 }];
    localStorage.setItem("bcw-games", JSON.stringify(games));
    expect(getSavedGames()).toEqual(games);
  });

  it("returns empty array on invalid JSON", () => {
    localStorage.setItem("bcw-games", "not-json");
    expect(getSavedGames()).toEqual([]);
  });
});

describe("saveGame", () => {
  it("adds a new game to the list", () => {
    saveGame("My Game", "my-game");
    const games = getSavedGames();
    expect(games).toHaveLength(1);
    expect(games[0].gameName).toBe("My Game");
    expect(games[0].slug).toBe("my-game");
  });

  it("does not add duplicate slugs", () => {
    saveGame("Game 1", "same-slug");
    saveGame("Game 2", "same-slug");
    expect(getSavedGames()).toHaveLength(1);
  });

  it("stores createdAt timestamp", () => {
    const before = Date.now();
    saveGame("Game", "game");
    const after = Date.now();
    const game = getSavedGames()[0];
    expect(game.createdAt).toBeGreaterThanOrEqual(before);
    expect(game.createdAt).toBeLessThanOrEqual(after);
  });
});

describe("deleteGame", () => {
  it("removes game from the list", () => {
    saveGame("Game", "game");
    deleteGame("game");
    expect(getSavedGames()).toHaveLength(0);
  });

  it("removes the game state from localStorage", () => {
    saveGame("Game", "game");
    saveGameState(makeGameState({ slug: "game" }));
    deleteGame("game");
    expect(localStorage.getItem("bcw-game-game")).toBeNull();
  });

  it("does not affect other games", () => {
    saveGame("Game 1", "g1");
    saveGame("Game 2", "g2");
    deleteGame("g1");
    expect(getSavedGames()).toHaveLength(1);
    expect(getSavedGames()[0].slug).toBe("g2");
  });
});

describe("getGameBySlug", () => {
  it("returns the matching game", () => {
    saveGame("Game", "game");
    const result = getGameBySlug("game");
    expect(result).not.toBeNull();
    expect(result!.slug).toBe("game");
  });

  it("returns null for missing slug", () => {
    expect(getGameBySlug("nonexistent")).toBeNull();
  });
});

describe("getGameState", () => {
  it("returns parsed state", () => {
    const state = makeGameState();
    saveGameState(state);
    const result = getGameState("test-game");
    expect(result).toEqual(state);
  });

  it("returns null when no state stored", () => {
    expect(getGameState("missing")).toBeNull();
  });

  it("returns null on invalid JSON", () => {
    localStorage.setItem("bcw-game-bad", "not-json");
    expect(getGameState("bad")).toBeNull();
  });
});

describe("saveGameState", () => {
  it("serializes state to the correct key", () => {
    const state = makeGameState({ slug: "my-slug" });
    saveGameState(state);
    const raw = localStorage.getItem("bcw-game-my-slug");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual(state);
  });
});

describe("initGameState", () => {
  it("creates a new game state when none exists", () => {
    const state = initGameState("New Game", "new-game");
    expect(state.gameName).toBe("New Game");
    expect(state.slug).toBe("new-game");
    expect(state.turn).toBe(1);
    expect(state.enemies).toEqual([]);
  });

  it("persists the new state to localStorage", () => {
    initGameState("New Game", "new-game");
    expect(getGameState("new-game")).not.toBeNull();
  });

  it("returns existing state if present", () => {
    const existing = makeGameState({ slug: "existing", turn: 5 });
    saveGameState(existing);
    const state = initGameState("Game", "existing");
    expect(state.turn).toBe(5);
  });

  it("migrates enemies without displayName", () => {
    const enemyWithoutDisplayName = {
      id: "e1",
      type: "Goon" as const,
      number: 1,
      displayName: "",
      edge: 1 as const,
      intent: "Combat" as const,
      spawnedOnTurn: 1 as const,
      defeated: false,
      strike: 0,
      condition: 6,
      agility: 0,
      range: 5,
      energy: 6,
      damage: 0,
      ready: 0,
    };
    const state = makeGameState({ slug: "migrate", enemies: [enemyWithoutDisplayName] });
    saveGameState(state);

    const result = initGameState("Game", "migrate");
    expect(result.enemies[0].displayName).toBe("Goon 1");
  });

  it("does not overwrite existing displayName during migration", () => {
    const enemy = {
      id: "e1",
      type: "Goon" as const,
      number: 1,
      displayName: "Custom Name",
      edge: 1 as const,
      intent: "Combat" as const,
      spawnedOnTurn: 1 as const,
      defeated: false,
      strike: 0,
      condition: 6,
      agility: 0,
      range: 5,
      energy: 6,
      damage: 0,
      ready: 0,
    };
    const state = makeGameState({ slug: "no-migrate", enemies: [enemy] });
    saveGameState(state);

    const result = initGameState("Game", "no-migrate");
    expect(result.enemies[0].displayName).toBe("Custom Name");
  });
});
