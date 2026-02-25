import type { EnemyNumberCounters, GameState } from "./types";

const INITIAL_ENEMY_NUMBERS: EnemyNumberCounters = {
  Goon: 0,
  Henchman: 0,
  Lieutenant: 0,
  UniqueCitizen: 0,
};

const STORAGE_KEY = "bcw-games";
const GAME_STATE_PREFIX = "bcw-game-";

export interface GameSummary {
  gameName: string;
  slug: string;
  createdAt: number;
}

export function getSavedGames(): GameSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GameSummary[];
  } catch {
    return [];
  }
}

export function saveGame(gameName: string, slug: string): void {
  if (typeof window === "undefined") return;
  const games = getSavedGames();
  const existing = games.find((g) => g.slug === slug);
  if (existing) return;
  games.push({ gameName, slug, createdAt: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function deleteGame(slug: string): void {
  if (typeof window === "undefined") return;
  const games = getSavedGames().filter((g) => g.slug !== slug);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  localStorage.removeItem(`${GAME_STATE_PREFIX}${slug}`);
}

export function getGameBySlug(slug: string): GameSummary | null {
  return getSavedGames().find((g) => g.slug === slug) ?? null;
}

function gameStateKey(slug: string): string {
  return `${GAME_STATE_PREFIX}${slug}`;
}

export function getGameState(slug: string): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(gameStateKey(slug));
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function saveGameState(state: GameState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(gameStateKey(state.slug), JSON.stringify(state));
}

export function initGameState(gameName: string, slug: string): GameState {
  const existing = getGameState(slug);
  if (existing) return existing;
  const state: GameState = {
    gameName,
    slug,
    createdAt: Date.now(),
    turn: 1,
    lieutenantSpawned: false,
    uniqueCitizenSpawned: false,
    enemyNumbers: { ...INITIAL_ENEMY_NUMBERS },
    enemies: [],
  };
  saveGameState(state);
  return state;
}
