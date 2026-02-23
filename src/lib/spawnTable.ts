import type { EnemyType, TurnNumber } from "./types";

interface SpawnRange {
  minionMax: number;
  muscleMax: number;
}

const SPAWN_TABLE: Record<TurnNumber, SpawnRange | null> = {
  1:  { minionMax: 8,  muscleMax: 11 },
  2:  { minionMax: 7,  muscleMax: 10 },
  3:  { minionMax: 6,  muscleMax: 10 },
  4:  { minionMax: 5,  muscleMax: 9  },
  5:  { minionMax: 4,  muscleMax: 6  },
  6:  { minionMax: 5,  muscleMax: 9  },
  7:  { minionMax: 6,  muscleMax: 10 },
  8:  { minionMax: 7,  muscleMax: 10 },
  9:  { minionMax: 8,  muscleMax: 11 },
  10: null,
};

export function lookupSpawnType(
  turn: TurnNumber,
  d12Roll: number
): EnemyType | null {
  const range = SPAWN_TABLE[turn];
  if (range === null) return null;
  if (d12Roll <= range.minionMax) return "Minion";
  if (d12Roll <= range.muscleMax) return "Muscle";
  return "Lieutenant";
}
