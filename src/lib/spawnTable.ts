import type { EnemyType, TurnNumber } from "./types";

interface SpawnRange {
  goonMax: number;
  henchmanMax: number;
}

const SPAWN_TABLE: Record<TurnNumber, SpawnRange | null> = {
  1:  { goonMax: 8,  henchmanMax: 11 },
  2:  { goonMax: 7,  henchmanMax: 10 },
  3:  { goonMax: 6,  henchmanMax: 10 },
  4:  { goonMax: 5,  henchmanMax: 9  },
  5:  { goonMax: 4,  henchmanMax: 6  },
  6:  { goonMax: 5,  henchmanMax: 9  },
  7:  { goonMax: 6,  henchmanMax: 10 },
  8:  { goonMax: 7,  henchmanMax: 10 },
  9:  { goonMax: 8,  henchmanMax: 11 },
  10: null,
};

export const lookupSpawnType = (
  turn: TurnNumber,
  d12Roll: number
): EnemyType | null => {
  const range = SPAWN_TABLE[turn];
  if (range === null) return null;
  if (d12Roll <= range.goonMax) return "Goon";
  if (d12Roll <= range.henchmanMax) return "Henchman";
  return "Lieutenant";
};
