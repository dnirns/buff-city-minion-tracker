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
import { TYPE_DISPLAY } from "./constants";

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
  range: 5,
  energy: 6,
  damage: 0,
};

const HENCHMAN_STATS: BaseStats = {
  strike: 0,
  condition: 8,
  agility: 4,
  range: 5,
  energy: 6,
  damage: 2,
};

const LIEUTENANT_STATS: BaseStats = {
  strike: 2,
  condition: 6,
  agility: 2,
  range: 6,
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
  Henchman: HENCHMAN_STATS,
  Lieutenant: LIEUTENANT_STATS,
  UniqueCitizen: STANDARD_STATS,
};

export interface SpawnContext {
  turn: TurnNumber;
  lieutenantSpawned: boolean;
  uniqueCitizenSpawned: boolean;
}

export const performSpawn = (
  context: SpawnContext,
  random?: () => number
): SpawnResult | null => {
  const spawnRoll = rollD12(random);
  const baseType = lookupSpawnType(context.turn, spawnRoll);
  if (baseType === null) return null;

  let enemyType: EnemyType;
  if (
    context.lieutenantSpawned &&
    !context.uniqueCitizenSpawned
  ) {
    enemyType = "UniqueCitizen";
  } else {
    enemyType = baseType;
  }

  const isUC = enemyType === "UniqueCitizen";
  const edgeRoll = isUC ? null : (rollD4(random) as BoardEdge);
  const intentRoll = rollD12(random);
  const intent = lookupIntent(enemyType, intentRoll);

  return {
    enemyType,
    edge: edgeRoll,
    intent,
    rolls: { spawnRoll, edgeRoll: edgeRoll ?? 0, intentRoll },
  };
};

export interface CommandingOrdersContext {
  sourceType: EnemyType;
  turn: TurnNumber;
  activeNonUCCount: number;
}

export interface CommandingOrdersResult extends SpawnResult {
  commandingRoll: number;
  usedStandardSpawn: boolean;
}

export const performCommandingOrdersSpawn = (
  context: CommandingOrdersContext,
  random?: () => number
): CommandingOrdersResult | null => {
  const isUCNoTargets =
    context.sourceType === "UniqueCitizen" && context.activeNonUCCount === 0;

  if (isUCNoTargets) {
    // Unique Citizen with no non-UC enemies in play: use standard spawn table
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
};

let nextId = 0;

export const generateId = (): string => {
  return `enemy-${Date.now()}-${nextId++}`;
};

export const createEnemy = (result: SpawnResult, turn: TurnNumber, enemyNumber: number): Enemy => {
  const stats = BASE_STATS[result.enemyType];
  return {
    id: generateId(),
    type: result.enemyType,
    number: enemyNumber,
    displayName: `${TYPE_DISPLAY[result.enemyType]} ${enemyNumber}`,
    edge: result.edge,
    intent: result.intent,
    spawnedOnTurn: turn,
    defeated: false,
    ...stats,
    ready: 0,
  };
};

export const getBaseStats = (type: EnemyType): BaseStats => {
  return BASE_STATS[type];
};
