import type {
  TurnNumber,
  SpawnResult,
  BoardEdge,
  EnemyType,
  Enemy,
} from "./types";
import { rollD4, rollD6, rollD12 } from "./dice";
import { lookupSpawnType } from "./spawnTable";
import { lookupIntent } from "./intentTable";

interface BaseStats {
  strike: number;
  condition: number;
  agility: number;
  range: number;
  energy: number;
  damage: number;
}

const GOON_STATS: BaseStats = {
  strike: 0,
  condition: 6,
  agility: 0,
  range: 4,
  energy: 6,
  damage: 0,
};

const STANDARD_STATS: BaseStats = {
  strike: 0,
  condition: 12,
  agility: 0,
  range: 4,
  energy: 6,
  damage: 0,
};

const BASE_STATS: Record<EnemyType, BaseStats> = {
  Goon: GOON_STATS,
  Henchman: STANDARD_STATS,
  Lieutenant: STANDARD_STATS,
  UniqueCitizen: STANDARD_STATS,
};

export interface SpawnContext {
  turn: TurnNumber;
  goonCounter: number;
  uniqueCitizenSpawned: boolean;
}

export function performSpawn(
  context: SpawnContext,
  random?: () => number
): SpawnResult | null {
  const spawnRoll = rollD12(random);
  const baseType = lookupSpawnType(context.turn, spawnRoll);
  if (baseType === null) return null;

  let enemyType: EnemyType;
  if (
    context.goonCounter >= 3 &&
    !context.uniqueCitizenSpawned
  ) {
    enemyType = "UniqueCitizen";
  } else {
    enemyType = baseType;
  }

  const edgeRoll = rollD4(random) as BoardEdge;
  const intentRoll = rollD12(random);
  const intent = lookupIntent(enemyType, intentRoll);

  return {
    enemyType,
    edge: edgeRoll,
    intent,
    rolls: { spawnRoll, edgeRoll, intentRoll },
  };
}

export interface CommandingOrdersContext {
  sourceType: EnemyType;
  turn: TurnNumber;
  activeGoonCount: number;
}

export interface CommandingOrdersResult extends SpawnResult {
  commandingRoll: number;
  usedStandardSpawn: boolean;
}

export function performCommandingOrdersSpawn(
  context: CommandingOrdersContext,
  random?: () => number
): CommandingOrdersResult | null {
  const isUniqueCitizenNoGoons =
    context.sourceType === "UniqueCitizen" && context.activeGoonCount === 0;

  if (isUniqueCitizenNoGoons) {
    // Unique Citizen with no goons in play: use standard spawn table
    const spawnRoll = rollD12(random);
    const baseType = lookupSpawnType(context.turn, spawnRoll);
    if (baseType === null) return null;

    const edgeRoll = rollD4(random) as BoardEdge;
    const intentRoll = rollD12(random);
    const intent = lookupIntent(baseType, intentRoll);

    return {
      enemyType: baseType,
      edge: edgeRoll,
      intent,
      rolls: { spawnRoll, edgeRoll, intentRoll },
      commandingRoll: spawnRoll,
      usedStandardSpawn: true,
    };
  }

  // Standard commanding orders: D6 determines Goon or Henchman
  const d6Roll = rollD6(random);
  const enemyType: EnemyType = d6Roll <= 3 ? "Goon" : "Henchman";

  const edgeRoll = rollD4(random) as BoardEdge;
  const intentRoll = rollD12(random);
  const intent = lookupIntent(enemyType, intentRoll);

  return {
    enemyType,
    edge: edgeRoll,
    intent,
    rolls: { spawnRoll: d6Roll, edgeRoll, intentRoll },
    commandingRoll: d6Roll,
    usedStandardSpawn: false,
  };
}

let nextId = 0;

export function generateId(): string {
  return `enemy-${Date.now()}-${nextId++}`;
}

export function createEnemy(result: SpawnResult, turn: TurnNumber, enemyNumber: number): Enemy {
  const stats = BASE_STATS[result.enemyType];
  return {
    id: generateId(),
    type: result.enemyType,
    number: enemyNumber,
    edge: result.edge,
    intent: result.intent,
    spawnedOnTurn: turn,
    defeated: false,
    ...stats,
  };
}

export function getBaseStats(type: EnemyType): BaseStats {
  return BASE_STATS[type];
}
