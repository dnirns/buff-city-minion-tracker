import { describe, it, expect, vi } from "vitest";
import {
  performSpawn,
  performCommandingOrdersSpawn,
  createEnemy,
  getBaseStats,
  generateId,
} from "@/lib/spawner";
import type { SpawnResult } from "@/lib/types";

const makeRng = (values: number[]) => {
  let i = 0;
  return () => values[i++];
};

describe("performSpawn", () => {
  it("returns a standard Goon spawn on turn 1", () => {
    // D12 spawn roll → 1 (Goon on turn 1), D4 edge → 1, D12 intent → 0 (Combat)
    const rng = makeRng([0, 0, 0]);
    const result = performSpawn({ turn: 1, lieutenantSpawned: false, uniqueCitizenSpawned: false }, rng);
    expect(result).not.toBeNull();
    expect(result!.enemyType).toBe("Goon");
    expect(result!.edge).toBe(1);
    expect(result!.intent).toBe("Combat");
  });

  it("returns null on turn 10", () => {
    const result = performSpawn({ turn: 10, lieutenantSpawned: false, uniqueCitizenSpawned: false }, () => 0);
    expect(result).toBeNull();
  });

  it("overrides to UniqueCitizen when lieutenant spawned and UC not spawned", () => {
    // D12 spawn roll → 1 (would be Goon), but override to UC
    // UC gets no edge roll, so next D12 is intent roll
    const rng = makeRng([0, 0]);
    const result = performSpawn({ turn: 1, lieutenantSpawned: true, uniqueCitizenSpawned: false }, rng);
    expect(result).not.toBeNull();
    expect(result!.enemyType).toBe("UniqueCitizen");
    expect(result!.edge).toBeNull();
    expect(result!.intent).toBe("Combat");
  });

  it("does not override when UC already spawned", () => {
    const rng = makeRng([0, 0, 0]);
    const result = performSpawn({ turn: 1, lieutenantSpawned: true, uniqueCitizenSpawned: true }, rng);
    expect(result).not.toBeNull();
    expect(result!.enemyType).toBe("Goon");
  });

  it("does not override when lieutenant not spawned", () => {
    const rng = makeRng([0, 0, 0]);
    const result = performSpawn({ turn: 1, lieutenantSpawned: false, uniqueCitizenSpawned: false }, rng);
    expect(result!.enemyType).toBe("Goon");
  });

  it("includes correct roll values", () => {
    const rng = makeRng([0, 0, 0]);
    const result = performSpawn({ turn: 1, lieutenantSpawned: false, uniqueCitizenSpawned: false }, rng);
    expect(result!.rolls.spawnRoll).toBe(1);
    expect(result!.rolls.edgeRoll).toBe(1);
    expect(result!.rolls.intentRoll).toBe(1);
  });
});

describe("performCommandingOrdersSpawn", () => {
  it("spawns Goon via D6 roll 1-3 for standard commanding orders", () => {
    // D6 → 1 (Goon), D4 edge → 1, D12 intent → 0
    const rng = makeRng([0, 0, 0]);
    const result = performCommandingOrdersSpawn({ sourceType: "Lieutenant", turn: 1, activeNonUCCount: 1 }, rng);
    expect(result).not.toBeNull();
    expect(result!.enemyType).toBe("Goon");
    expect(result!.usedStandardSpawn).toBe(false);
    expect(result!.commandingRoll).toBe(1);
  });

  it("spawns Henchman via D6 roll 4-6 for standard commanding orders", () => {
    // D6 → 4 (0.5 * 6 + 1 = 4), D4 edge, D12 intent
    const rng = makeRng([0.5, 0, 0]);
    const result = performCommandingOrdersSpawn({ sourceType: "Lieutenant", turn: 1, activeNonUCCount: 1 }, rng);
    expect(result).not.toBeNull();
    expect(result!.enemyType).toBe("Henchman");
    expect(result!.usedStandardSpawn).toBe(false);
  });

  it("uses standard spawn table for UC with no non-UC targets", () => {
    // D12 spawn → 1 (Goon), D4 edge → 1, D12 intent → 1
    const rng = makeRng([0, 0, 0]);
    const result = performCommandingOrdersSpawn({ sourceType: "UniqueCitizen", turn: 1, activeNonUCCount: 0 }, rng);
    expect(result).not.toBeNull();
    expect(result!.enemyType).toBe("Goon");
    expect(result!.usedStandardSpawn).toBe(true);
  });

  it("returns null for UC with no targets on turn 10", () => {
    const result = performCommandingOrdersSpawn({ sourceType: "UniqueCitizen", turn: 10, activeNonUCCount: 0 }, () => 0);
    expect(result).toBeNull();
  });

  it("uses D6 path for UC with non-UC targets in play", () => {
    const rng = makeRng([0, 0, 0]);
    const result = performCommandingOrdersSpawn({ sourceType: "UniqueCitizen", turn: 1, activeNonUCCount: 2 }, rng);
    expect(result).not.toBeNull();
    expect(result!.usedStandardSpawn).toBe(false);
  });
});

describe("createEnemy", () => {
  const spawnResult: SpawnResult = {
    enemyType: "Goon",
    edge: 2,
    intent: "Combat",
    rolls: { spawnRoll: 3, edgeRoll: 2, intentRoll: 1 },
  };

  it("creates enemy with correct base stats for Goon", () => {
    const enemy = createEnemy(spawnResult, 1, 1);
    expect(enemy.type).toBe("Goon");
    expect(enemy.strike).toBe(0);
    expect(enemy.condition).toBe(6);
    expect(enemy.agility).toBe(0);
    expect(enemy.range).toBe(5);
    expect(enemy.energy).toBe(6);
    expect(enemy.damage).toBe(0);
  });

  it("sets displayName with type display and number", () => {
    const enemy = createEnemy(spawnResult, 1, 3);
    expect(enemy.displayName).toBe("Goon 3");
  });

  it("sets defeated to false, activated to false, and ready to 0", () => {
    const enemy = createEnemy(spawnResult, 1, 1);
    expect(enemy.defeated).toBe(false);
    expect(enemy.activated).toBe(false);
    expect(enemy.ready).toBe(0);
  });

  it("sets edge and intent from spawn result", () => {
    const enemy = createEnemy(spawnResult, 1, 1);
    expect(enemy.edge).toBe(2);
    expect(enemy.intent).toBe("Combat");
  });

  it("records spawned turn", () => {
    const enemy = createEnemy(spawnResult, 5, 1);
    expect(enemy.spawnedOnTurn).toBe(5);
  });

  it("creates Henchman with correct stats", () => {
    const result: SpawnResult = { ...spawnResult, enemyType: "Henchman" };
    const enemy = createEnemy(result, 1, 1);
    expect(enemy.condition).toBe(8);
    expect(enemy.agility).toBe(4);
    expect(enemy.damage).toBe(2);
    expect(enemy.displayName).toBe("Henchman 1");
  });

  it("creates Lieutenant with correct stats", () => {
    const result: SpawnResult = { ...spawnResult, enemyType: "Lieutenant" };
    const enemy = createEnemy(result, 1, 1);
    expect(enemy.strike).toBe(2);
    expect(enemy.condition).toBe(6);
    expect(enemy.agility).toBe(2);
    expect(enemy.range).toBe(6);
    expect(enemy.displayName).toBe("Lieutenant 1");
  });

  it("creates UniqueCitizen with correct stats", () => {
    const result: SpawnResult = { ...spawnResult, enemyType: "UniqueCitizen" };
    const enemy = createEnemy(result, 1, 1);
    expect(enemy.condition).toBe(12);
    expect(enemy.range).toBe(4);
    expect(enemy.displayName).toBe("Unique Citizen 1");
  });
});

describe("getBaseStats", () => {
  it("returns correct stats for each enemy type", () => {
    expect(getBaseStats("Goon")).toEqual({ strike: 0, condition: 6, agility: 0, range: 5, energy: 6, damage: 0 });
    expect(getBaseStats("Henchman")).toEqual({ strike: 0, condition: 8, agility: 4, range: 5, energy: 6, damage: 2 });
    expect(getBaseStats("Lieutenant")).toEqual({ strike: 2, condition: 6, agility: 2, range: 6, energy: 6, damage: 0 });
    expect(getBaseStats("UniqueCitizen")).toEqual({ strike: 0, condition: 12, agility: 0, range: 4, energy: 6, damage: 0 });
  });
});

describe("generateId", () => {
  it("returns unique strings on successive calls", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it("starts with 'enemy-' prefix", () => {
    expect(generateId()).toMatch(/^enemy-/);
  });
});
