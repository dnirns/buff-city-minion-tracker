import type { EnemyType, EnemyNumberCounters, Intent } from "./types";

export const TYPE_DISPLAY: Record<EnemyType, string> = {
  Goon: "Goon",
  Henchman: "Henchman",
  Lieutenant: "Lieutenant",
  UniqueCitizen: "Unique Citizen",
};

export const INTENT_DISPLAY: Record<Intent, string> = {
  Combat: "Combat",
  Slam: "Slam",
  BuffTokenDenial: "Buff Token Denial",
  EvasiveManoeuvres: "Evasive Manoeuvres",
  CommandingOrders: "Commanding Orders",
};

export const INITIAL_ENEMY_NUMBERS: EnemyNumberCounters = {
  Goon: 0,
  Henchman: 0,
  Lieutenant: 0,
  UniqueCitizen: 0,
};

export const MAX_TURN = 10;

export const STAT_LABELS: { label: string; stat: "strike" | "condition" | "agility" | "range" | "energy" | "damage" | "ready" }[] = [
  { label: "STR", stat: "strike" },
  { label: "AGI", stat: "agility" },
  { label: "RNG", stat: "range" },
  { label: "ENG", stat: "energy" },
  { label: "DMG", stat: "damage" },
];
