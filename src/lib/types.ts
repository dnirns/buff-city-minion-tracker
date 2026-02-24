export type EnemyType = "Goon" | "Henchman" | "Lieutenant" | "UniqueCitizen";

export type Intent =
  | "Combat"
  | "Slam"
  | "BuffTokenDenial"
  | "EvasiveManoeuvres"
  | "CommandingOrders";

export type BoardEdge = 1 | 2 | 3 | 4;

export type TurnNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Enemy {
  id: string;
  type: EnemyType;
  number: number;
  edge: BoardEdge;
  intent: Intent;
  spawnedOnTurn: TurnNumber;
  defeated: boolean;
  strike: number;
  condition: number;
  agility: number;
  range: number;
  energy: number;
  damage: number;
}

export type EnemyNumberCounters = Record<EnemyType, number>;

export interface GameState {
  gameName: string;
  slug: string;
  createdAt: number;
  turn: TurnNumber;
  goonCounter: number;
  uniqueCitizenSpawned: boolean;
  enemyNumbers: EnemyNumberCounters;
  enemies: Enemy[];
}

export interface SpawnResult {
  enemyType: EnemyType;
  edge: BoardEdge;
  intent: Intent;
  rolls: {
    spawnRoll: number;
    edgeRoll: number;
    intentRoll: number;
  };
}
